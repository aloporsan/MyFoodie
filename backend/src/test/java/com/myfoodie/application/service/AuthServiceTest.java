package com.myfoodie.application.service;

import com.myfoodie.application.dto.auth.AuthResponseDTO;
import com.myfoodie.application.dto.auth.LoginRequestDTO;
import com.myfoodie.application.dto.auth.RegisterRequestDTO;
import com.myfoodie.domain.model.Preferencias;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.repository.PreferenciasRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import com.myfoodie.infrastructure.security.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private PreferenciasRepository preferenciasRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenProvider jwtTokenProvider;

    @InjectMocks private AuthService authService;

    // -------------------------------------------------------------------------
    // Tests positivos
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Registro exitoso con datos válidos devuelve token y datos del usuario")
    void registroExitoso_conDatosValidos() {
        RegisterRequestDTO request = new RegisterRequestDTO(
                "Alonso", "alonso_test", "alonso@test.com", "password123");

        Usuario usuarioGuardado = Usuario.builder()
                .id("user-1")
                .nombre("Alonso")
                .nombreUsuario("alonso_test")
                .email("alonso@test.com")
                .passwordHash("hashed")
                .build();

        when(usuarioRepository.existsByEmail("alonso@test.com")).thenReturn(false);
        when(usuarioRepository.existsByNombreUsuario("alonso_test")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuarioGuardado);
        when(jwtTokenProvider.generateToken(usuarioGuardado)).thenReturn("jwt.token.test");

        AuthResponseDTO respuesta = authService.register(request);

        assertThat(respuesta.token()).isEqualTo("jwt.token.test");
        assertThat(respuesta.email()).isEqualTo("alonso@test.com");
        assertThat(respuesta.nombreUsuario()).isEqualTo("alonso_test");
        assertThat(respuesta.userId()).isEqualTo("user-1");
        verify(preferenciasRepository).save(any(Preferencias.class));
    }

    @Test
    @DisplayName("Login exitoso con credenciales correctas devuelve token válido")
    void loginExitoso_conCredencialesCorrectas() {
        LoginRequestDTO request = new LoginRequestDTO("alonso@test.com", "password123");

        Usuario usuario = Usuario.builder()
                .id("user-1")
                .email("alonso@test.com")
                .nombreUsuario("alonso_test")
                .nombre("Alonso")
                .passwordHash("hashed")
                .build();

        when(usuarioRepository.findByEmail("alonso@test.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
        when(jwtTokenProvider.generateToken(usuario)).thenReturn("jwt.token.test");

        AuthResponseDTO respuesta = authService.login(request);

        assertThat(respuesta.token()).isNotBlank();
        assertThat(respuesta.email()).isEqualTo("alonso@test.com");
    }

    @Test
    @DisplayName("Login exitoso devuelve respuesta con el userId correcto en el payload")
    void loginExitoso_devuelveTokenConUsuarioId() {
        LoginRequestDTO request = new LoginRequestDTO("alonso@test.com", "password123");

        Usuario usuario = Usuario.builder()
                .id("user-id-99")
                .email("alonso@test.com")
                .nombreUsuario("alonso_test")
                .nombre("Alonso")
                .passwordHash("hashed")
                .build();

        when(usuarioRepository.findByEmail("alonso@test.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
        when(jwtTokenProvider.generateToken(usuario)).thenReturn("jwt.token.test");

        AuthResponseDTO respuesta = authService.login(request);

        assertThat(respuesta.userId()).isEqualTo("user-id-99");
    }

    // -------------------------------------------------------------------------
    // Tests negativos
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Registro falla con 409 si el email ya está registrado")
    void registro_falla_siEmailYaExiste() {
        RegisterRequestDTO request = new RegisterRequestDTO(
                "Alonso", "alonso_test", "duplicado@test.com", "password123");

        when(usuarioRepository.existsByEmail("duplicado@test.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ApiException.class)
                .hasMessage("El email ya está registrado")
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus())
                        .isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    @DisplayName("Registro falla con 409 si el nombre de usuario ya existe")
    void registro_falla_siNombreUsuarioYaExiste() {
        RegisterRequestDTO request = new RegisterRequestDTO(
                "Alonso", "yaexiste", "nuevo@test.com", "password123");

        when(usuarioRepository.existsByEmail("nuevo@test.com")).thenReturn(false);
        when(usuarioRepository.existsByNombreUsuario("yaexiste")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ApiException.class)
                .hasMessage("El nombre de usuario ya está en uso")
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus())
                        .isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    @DisplayName("Login falla con 401 si el email no existe")
    void login_falla_siEmailNoExiste() {
        LoginRequestDTO request = new LoginRequestDTO("noexiste@test.com", "password123");

        when(usuarioRepository.findByEmail("noexiste@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ApiException.class)
                .hasMessage("Credenciales incorrectas")
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus())
                        .isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    @DisplayName("Login falla con 401 si la contraseña es incorrecta")
    void login_falla_siPasswordIncorrecta() {
        LoginRequestDTO request = new LoginRequestDTO("alonso@test.com", "wrongpassword");

        Usuario usuario = Usuario.builder()
                .id("user-1")
                .email("alonso@test.com")
                .passwordHash("hashed")
                .build();

        when(usuarioRepository.findByEmail("alonso@test.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("wrongpassword", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ApiException.class)
                .hasMessage("Credenciales incorrectas")
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus())
                        .isEqualTo(HttpStatus.UNAUTHORIZED));
    }
}
