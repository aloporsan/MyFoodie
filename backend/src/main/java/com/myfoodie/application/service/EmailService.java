package com.myfoodie.application.service;

import com.myfoodie.exception.ApiException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class EmailService {

    @Value("${myfoodie.mail.from}")
    private String from;

    @Value("${myfoodie.frontend.reset-password-url}")
    private String resetPasswordUrl;

    @Value("${RESEND_API_KEY}")
    private String apiKey;

    private RestClient restClient;

    @PostConstruct
    public void init() {
        restClient = RestClient.builder()
                .baseUrl("https://api.resend.com")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }

    public void sendPasswordResetEmail(String to, String tokenValue) {
        String link = resetPasswordUrl + "?token=" + tokenValue;

        Map<String, Object> body = Map.of(
                "from", from,
                "to", List.of(to),
                "subject", "Restablecer contraseña · MyFoodie",
                "html", buildHtml(link, tokenValue)
        );

        try {
            restClient.post()
                    .uri("/emails")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Email de recuperación enviado a {}", to);
        } catch (Exception e) {
            log.error("Error al enviar email de recuperación: {}", e.getMessage());
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo enviar el email de recuperación");
        }
    }

    private String buildHtml(String link, String token) {
        return """
                <!DOCTYPE html>
                <html lang="es">
                <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 0;">
                    <tr><td align="center">
                      <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;">
                        <tr>
                          <td align="center" style="background-color:#4CAF50;padding:32px 40px;">
                            <p style="margin:0;font-size:28px;font-weight:bold;color:#ffffff;letter-spacing:1px;">MyFoodie</p>
                            <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Tu despensa inteligente</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:40px;">
                            <h2 style="margin:0 0 16px;font-size:20px;color:#333333;">Restablecer contraseña</h2>
                            <p style="margin:0 0 24px;font-size:15px;color:#555555;line-height:1.6;">
                              Solicitaste restablecer tu contraseña. Pulsa el botón de abajo para continuar.<br>
                              Si no fuiste tú, ignora este mensaje — tu contraseña no cambiará.
                            </p>
                            <table cellpadding="0" cellspacing="0">
                              <tr>
                                <td align="center" style="background-color:#4CAF50;border-radius:8px;">
                                  <a href="%s" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">
                                    Restablecer contraseña
                                  </a>
                                </td>
                              </tr>
                            </table>
                            <p style="margin:24px 0 8px;font-size:13px;color:#999999;">
                              Este enlace expira en <strong>30 minutos</strong>.
                            </p>
                            <p style="margin:16px 0 4px;font-size:12px;color:#bbbbbb;">
                              ¿El botón no funciona? Introduce este código manualmente en la app:
                            </p>
                            <p style="margin:0 0 12px;font-size:13px;font-family:monospace;background-color:#f5f5f5;padding:10px 14px;border-radius:6px;word-break:break-all;color:#333;">%s</p>
                            <p style="margin:0;font-size:11px;color:#cccccc;word-break:break-all;">
                              O copia este enlace en Safari/Chrome: <a href="%s" style="color:#4CAF50;">%s</a>
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="background-color:#f9f9f9;padding:20px 40px;border-top:1px solid #eeeeee;">
                            <p style="margin:0;font-size:12px;color:#bbbbbb;text-align:center;">
                              © MyFoodie · Este es un mensaje automático, no respondas a este email.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(link, token, link, link);
    }
}
