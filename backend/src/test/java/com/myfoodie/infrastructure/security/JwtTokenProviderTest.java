package com.myfoodie.infrastructure.security;

import com.myfoodie.domain.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("JwtTokenProvider — generación y validación de tokens")
class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    private static final String SECRET = "test-secret-key-for-jwt-at-least-32-chars-long";
    private static final long EXPIRATION = 3_600_000L; // 1 hora

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "secret", SECRET);
        ReflectionTestUtils.setField(jwtTokenProvider, "expiration", EXPIRATION);
    }

    // -------------------------------------------------------------------------
    // Tests positivos
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("generateToken devuelve un token no vacío")
    void generarToken_devuelveTokenNoVacio() {
        String token = jwtTokenProvider.generateToken(buildUsuario());

        assertThat(token).isNotNull().isNotBlank();
    }

    @Test
    @DisplayName("generateToken incluye el userId en los claims del token")
    void generarToken_contieneUsuarioId() {
        String token = jwtTokenProvider.generateToken(buildUsuario());

        Claims claims = parsearToken(token);

        assertThat(claims.get("userId", String.class)).isEqualTo("user-test-id");
    }

    @Test
    @DisplayName("validateToken devuelve true para un token recién generado")
    void validarToken_devuelveTrue_siTokenValido() {
        String token = jwtTokenProvider.generateToken(buildUsuario());

        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("El userId extraído del token coincide con el del usuario original")
    void extraerUsuarioId_devuelveIdCorrecto() {
        Usuario usuario = buildUsuario();
        String token = jwtTokenProvider.generateToken(usuario);

        Claims claims = parsearToken(token);

        assertThat(claims.get("userId", String.class)).isEqualTo(usuario.getId());
    }

    // -------------------------------------------------------------------------
    // Tests negativos
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("validateToken devuelve false para un token expirado")
    void validarToken_devuelveFalse_siTokenExpirado() {
        // Generar un token ya expirado poniendo expiración negativa
        ReflectionTestUtils.setField(jwtTokenProvider, "expiration", -1000L);
        String tokenExpirado = jwtTokenProvider.generateToken(buildUsuario());

        assertThat(jwtTokenProvider.validateToken(tokenExpirado)).isFalse();
    }

    @Test
    @DisplayName("validateToken devuelve false para un token con la firma manipulada")
    void validarToken_devuelveFalse_siTokenManipulado() {
        String token = jwtTokenProvider.generateToken(buildUsuario());
        // Alterar los últimos caracteres de la firma
        String tokenManipulado = token.substring(0, token.length() - 6) + "XXXXXX";

        assertThat(jwtTokenProvider.validateToken(tokenManipulado)).isFalse();
    }

    @Test
    @DisplayName("validateToken devuelve false para un token vacío o nulo")
    void validarToken_devuelveFalse_siTokenVacio() {
        assertThat(jwtTokenProvider.validateToken("")).isFalse();
        assertThat(jwtTokenProvider.validateToken(null)).isFalse();
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

    private Claims parsearToken(String token) {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
