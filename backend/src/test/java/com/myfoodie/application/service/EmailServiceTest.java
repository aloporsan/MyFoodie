package com.myfoodie.application.service;

import com.myfoodie.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Answers.RETURNS_DEEP_STUBS;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Se inyecta un {@link RestClient} simulado por reflexión (saltándonos {@code init()}) para no
 * hacer peticiones reales a Resend. Solo interesa comprobar el envío y el envoltorio de errores.
 */
class EmailServiceTest {

    private EmailService emailService;
    private RestClient restClient;

    @BeforeEach
    void setUp() {
        emailService = new EmailService();
        restClient = mock(RestClient.class, RETURNS_DEEP_STUBS);
        ReflectionTestUtils.setField(emailService, "from", "no-reply@myfoodie.test");
        ReflectionTestUtils.setField(emailService, "resetPasswordUrl", "myfoodie://reset-password");
        ReflectionTestUtils.setField(emailService, "restClient", restClient);
    }

    @Test
    @DisplayName("sendPasswordResetEmail: envía la petición sin lanzar excepción")
    void sendPasswordResetEmail_happy() {
        assertThatCode(() -> emailService.sendPasswordResetEmail("user@myfoodie.test", "token-123"))
                .doesNotThrowAnyException();
        verify(restClient).post();
    }

    @Test
    @DisplayName("sendPasswordResetEmail: si el cliente HTTP falla, envuelve el error en ApiException 500")
    void sendPasswordResetEmail_error() {
        when(restClient.post()).thenThrow(new RuntimeException("Resend caído"));

        assertThatThrownBy(() -> emailService.sendPasswordResetEmail("user@myfoodie.test", "token-123"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus())
                        .isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR));
    }
}
