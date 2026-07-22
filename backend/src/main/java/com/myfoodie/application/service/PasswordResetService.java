package com.myfoodie.application.service;

import com.myfoodie.domain.model.PasswordResetToken;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.repository.PasswordResetTokenRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final long EXPIRATION_MS = 30 * 60 * 1000L; // 30 minutos

    public void forgotPassword(String email) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        if (usuarioOpt.isEmpty()) {
            // Respuesta idéntica para no revelar si el email está registrado
            log.info("Solicitud de recuperación para email no registrado");
            return;
        }

        Usuario usuario = usuarioOpt.get();

        // Invalidar tokens anteriores pendientes del mismo usuario
        List<PasswordResetToken> pendientes = tokenRepository.findByUsuarioIdAndUsadoFalse(usuario.getId());
        if (!pendientes.isEmpty()) {
            pendientes.forEach(t -> t.setUsado(true));
            tokenRepository.saveAll(pendientes);
            log.info("Invalidados {} tokens anteriores para usuario {}", pendientes.size(), usuario.getId());
        }

        // Crear nuevo token con expiración de 30 minutos
        String tokenValue = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .usuarioId(usuario.getId())
                .token(tokenValue)
                .expiresAt(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .build();
        tokenRepository.save(resetToken);
        log.info("Token de recuperación creado para usuario {}", usuario.getId());

        emailService.sendPasswordResetEmail(email, tokenValue);
    }

    public void validateToken(String tokenValue) {
        PasswordResetToken resetToken = tokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Token de recuperación no válido"));

        if (resetToken.getUsado()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Este enlace ya ha sido utilizado");
        }

        if (resetToken.getExpiresAt().before(new Date())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El enlace de recuperación ha expirado");
        }
    }

    public void resetPassword(String tokenValue, String nuevaPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Token de recuperación no válido"));

        if (resetToken.getUsado()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Este enlace ya ha sido utilizado");
        }

        if (resetToken.getExpiresAt().before(new Date())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El enlace de recuperación ha expirado");
        }

        Usuario usuario = usuarioRepository.findById(resetToken.getUsuarioId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        usuario.setPasswordHash(passwordEncoder.encode(nuevaPassword));
        usuarioRepository.save(usuario);

        resetToken.setUsado(true);
        tokenRepository.save(resetToken);

        log.info("Contraseña restablecida para usuario {}", usuario.getId());
    }
}
