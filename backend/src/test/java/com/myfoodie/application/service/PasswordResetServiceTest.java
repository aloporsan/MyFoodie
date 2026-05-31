package com.myfoodie.application.service;

import com.myfoodie.domain.model.PasswordResetToken;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.repository.PasswordResetTokenRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PasswordResetService — recuperación de contraseña")
class PasswordResetServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordResetTokenRepository tokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private PasswordResetService passwordResetService;

    // -------------------------------------------------------------------------
    // forgotPassword
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("forgotPassword crea token y envía email si el usuario existe")
    void forgotPassword_creaTokenYEnviaEmail_siUsuarioExiste() {
        Usuario usuario = buildUsuario();
        when(usuarioRepository.findByEmail(usuario.getEmail())).thenReturn(Optional.of(usuario));
        when(tokenRepository.findByUsuarioIdAndUsadoFalse(usuario.getId())).thenReturn(List.of());

        passwordResetService.forgotPassword(usuario.getEmail());

        verify(tokenRepository).save(any(PasswordResetToken.class));
        verify(emailService).sendPasswordResetEmail(eq(usuario.getEmail()), any(String.class));
    }

    @Test
    @DisplayName("forgotPassword no hace nada si el email no está registrado")
    void forgotPassword_noHaceNada_siEmailNoExiste() {
        when(usuarioRepository.findByEmail("noexiste@test.com")).thenReturn(Optional.empty());

        passwordResetService.forgotPassword("noexiste@test.com");

        verify(tokenRepository, never()).save(any());
        verify(emailService, never()).sendPasswordResetEmail(any(), any());
    }

    @Test
    @DisplayName("forgotPassword invalida tokens anteriores antes de crear uno nuevo")
    void forgotPassword_invalidaTokensAnteriores_antesDeCrearNuevo() {
        Usuario usuario = buildUsuario();
        PasswordResetToken tokenAnterior = buildToken(usuario.getId(), false, futuro());
        when(usuarioRepository.findByEmail(usuario.getEmail())).thenReturn(Optional.of(usuario));
        when(tokenRepository.findByUsuarioIdAndUsadoFalse(usuario.getId())).thenReturn(List.of(tokenAnterior));

        passwordResetService.forgotPassword(usuario.getEmail());

        assertThat(tokenAnterior.getUsado()).isTrue();
        verify(tokenRepository).saveAll(List.of(tokenAnterior));
        verify(tokenRepository).save(any(PasswordResetToken.class));
    }

    // -------------------------------------------------------------------------
    // validateToken
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("validateToken no lanza excepción para un token válido")
    void validateToken_noLanzaExcepcion_siTokenValido() {
        PasswordResetToken token = buildToken("user-id", false, futuro());
        when(tokenRepository.findByToken("valid-token")).thenReturn(Optional.of(token));

        passwordResetService.validateToken("valid-token");
    }

    @Test
    @DisplayName("validateToken lanza BAD_REQUEST si el token no existe")
    void validateToken_lanzaBadRequest_siTokenNoExiste() {
        when(tokenRepository.findByToken("bad-token")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> passwordResetService.validateToken("bad-token"))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    @DisplayName("validateToken lanza BAD_REQUEST si el token ya fue usado")
    void validateToken_lanzaBadRequest_siTokenYaUsado() {
        PasswordResetToken token = buildToken("user-id", true, futuro());
        when(tokenRepository.findByToken("used-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> passwordResetService.validateToken("used-token"))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    @DisplayName("validateToken lanza BAD_REQUEST si el token está expirado")
    void validateToken_lanzaBadRequest_siTokenExpirado() {
        PasswordResetToken token = buildToken("user-id", false, pasado());
        when(tokenRepository.findByToken("expired-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> passwordResetService.validateToken("expired-token"))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    // -------------------------------------------------------------------------
    // resetPassword
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("resetPassword cambia la contraseña y marca el token como usado")
    void resetPassword_cambiaPasswordYMarcaTokenUsado() {
        Usuario usuario = buildUsuario();
        PasswordResetToken token = buildToken(usuario.getId(), false, futuro());
        when(tokenRepository.findByToken("valid-token")).thenReturn(Optional.of(token));
        when(usuarioRepository.findById(usuario.getId())).thenReturn(Optional.of(usuario));
        when(passwordEncoder.encode("nuevaPass123")).thenReturn("encoded-pass");

        passwordResetService.resetPassword("valid-token", "nuevaPass123");

        assertThat(usuario.getPasswordHash()).isEqualTo("encoded-pass");
        assertThat(token.getUsado()).isTrue();
        verify(usuarioRepository).save(usuario);
        verify(tokenRepository).save(token);
    }

    @Test
    @DisplayName("resetPassword lanza BAD_REQUEST si el token no existe")
    void resetPassword_lanzaBadRequest_siTokenNoExiste() {
        when(tokenRepository.findByToken("bad-token")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> passwordResetService.resetPassword("bad-token", "pass"))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    @DisplayName("resetPassword lanza BAD_REQUEST si el token ya fue usado")
    void resetPassword_lanzaBadRequest_siTokenYaUsado() {
        PasswordResetToken token = buildToken("user-id", true, futuro());
        when(tokenRepository.findByToken("used-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> passwordResetService.resetPassword("used-token", "pass"))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    @DisplayName("resetPassword lanza BAD_REQUEST si el token está expirado")
    void resetPassword_lanzaBadRequest_siTokenExpirado() {
        PasswordResetToken token = buildToken("user-id", false, pasado());
        when(tokenRepository.findByToken("expired-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> passwordResetService.resetPassword("expired-token", "pass"))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    @DisplayName("resetPassword lanza NOT_FOUND si el usuario del token ya no existe")
    void resetPassword_lanzaNotFound_siUsuarioNoExiste() {
        PasswordResetToken token = buildToken("user-sin-cuenta", false, futuro());
        when(tokenRepository.findByToken("orphan-token")).thenReturn(Optional.of(token));
        when(usuarioRepository.findById("user-sin-cuenta")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> passwordResetService.resetPassword("orphan-token", "pass"))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private Usuario buildUsuario() {
        return Usuario.builder()
                .id("user-test-id")
                .email("test@test.com")
                .nombreUsuario("testuser")
                .nombre("Test")
                .build();
    }

    private PasswordResetToken buildToken(String usuarioId, boolean usado, Date expiresAt) {
        return PasswordResetToken.builder()
                .id("token-id")
                .usuarioId(usuarioId)
                .token("token-value")
                .expiresAt(expiresAt)
                .usado(usado)
                .build();
    }

    private Date futuro() {
        return new Date(System.currentTimeMillis() + 30 * 60 * 1000L);
    }

    private Date pasado() {
        return new Date(System.currentTimeMillis() - 30 * 60 * 1000L);
    }
}
