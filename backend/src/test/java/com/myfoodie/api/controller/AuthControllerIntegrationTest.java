package com.myfoodie.api.controller;

import com.myfoodie.application.service.EmailService;
import com.myfoodie.domain.model.PasswordResetToken;
import com.myfoodie.domain.repository.PasswordResetTokenRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Date;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.emptyOrNullString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("AuthController — integracion registro, login y recuperacion de contrasena")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private EmailService emailService;

    @BeforeEach
    void limpiarBD() {
        usuarioRepository.deleteAll();
        tokenRepository.deleteAll();
    }

    // -------------------------------------------------------------------------
    // POST /api/auth/register
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("POST /register devuelve 201 y token cuando los datos son validos")
    void POST_register_devuelve201_conDatosValidos() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "nombre", "Test User",
                                "nombreUsuario", "testuser",
                                "email", "test@test.com",
                                "password", "password123"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value(not(emptyOrNullString())))
                .andExpect(jsonPath("$.email").value("test@test.com"))
                .andExpect(jsonPath("$.nombreUsuario").value("testuser"));
    }

    @Test
    @DisplayName("POST /register devuelve 409 si el email ya esta registrado")
    void POST_register_devuelve409_siEmailDuplicado() throws Exception {
        registrarUsuario("testuser", "test@test.com");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "nombre", "Otro User", "nombreUsuario", "otrouser",
                                "email", "test@test.com", "password", "password123"
                        ))))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /register devuelve 409 si el nombreUsuario ya existe")
    void POST_register_devuelve409_siNombreUsuarioDuplicado() throws Exception {
        registrarUsuario("testuser", "test@test.com");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "nombre", "Otro User", "nombreUsuario", "testuser",
                                "email", "otro@test.com", "password", "password123"
                        ))))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /register devuelve 400 si faltan campos obligatorios")
    void POST_register_devuelve400_siDatosFaltantes() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "test@test.com"))))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------
    // POST /api/auth/login
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("POST /login devuelve 200 y token con credenciales correctas")
    void POST_login_devuelve200_conCredencialesCorrectas() throws Exception {
        registrarUsuario("testuser", "test@test.com");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "test@test.com", "password", "password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value(not(emptyOrNullString())))
                .andExpect(jsonPath("$.email").value("test@test.com"));
    }

    @Test
    @DisplayName("POST /login devuelve 401 si la contrasena es incorrecta")
    void POST_login_devuelve401_siPasswordIncorrecta() throws Exception {
        registrarUsuario("testuser", "test@test.com");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "test@test.com", "password", "wrongpassword"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /login devuelve 401 si el email no existe")
    void POST_login_devuelve401_siEmailNoExiste() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "noexiste@test.com", "password", "password123"))))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------------------
    // POST /api/auth/forgot-password
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("POST /forgot-password devuelve 200 con mensaje generico si el email esta registrado")
    void POST_forgotPassword_devuelve200_conEmailRegistrado() throws Exception {
        registrarUsuario("testuser", "test@test.com");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "test@test.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("POST /forgot-password devuelve 200 aunque el email no exista (no revela info)")
    void POST_forgotPassword_devuelve200_conEmailNoRegistrado() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "noexiste@test.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());
    }

    // -------------------------------------------------------------------------
    // POST /api/auth/reset-password
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("POST /reset-password devuelve 200 con token valido")
    void POST_resetPassword_devuelve200_conTokenValido() throws Exception {
        registrarUsuario("testuser", "test@test.com");
        String usuarioId = usuarioRepository.findByEmail("test@test.com").orElseThrow().getId();

        String tokenValue = UUID.randomUUID().toString();
        tokenRepository.save(PasswordResetToken.builder()
                .usuarioId(usuarioId)
                .token(tokenValue)
                .expiresAt(new Date(System.currentTimeMillis() + 30 * 60 * 1000L))
                .usado(false)
                .build());

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("token", tokenValue, "nuevaPassword", "nuevaPass123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("POST /reset-password devuelve 400 si el token esta expirado")
    void POST_resetPassword_devuelve400_siTokenExpirado() throws Exception {
        registrarUsuario("testuser", "test@test.com");
        String usuarioId = usuarioRepository.findByEmail("test@test.com").orElseThrow().getId();

        String tokenValue = UUID.randomUUID().toString();
        tokenRepository.save(PasswordResetToken.builder()
                .usuarioId(usuarioId)
                .token(tokenValue)
                .expiresAt(new Date(System.currentTimeMillis() - 30 * 60 * 1000L))
                .usado(false)
                .build());

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("token", tokenValue, "nuevaPassword", "nuevaPass123"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /reset-password devuelve 400 si el token ya fue usado")
    void POST_resetPassword_devuelve400_siTokenYaUsado() throws Exception {
        registrarUsuario("testuser", "test@test.com");
        String usuarioId = usuarioRepository.findByEmail("test@test.com").orElseThrow().getId();

        String tokenValue = UUID.randomUUID().toString();
        tokenRepository.save(PasswordResetToken.builder()
                .usuarioId(usuarioId)
                .token(tokenValue)
                .expiresAt(new Date(System.currentTimeMillis() + 30 * 60 * 1000L))
                .usado(true)
                .build());

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("token", tokenValue, "nuevaPassword", "nuevaPass123"))))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private void registrarUsuario(String nombreUsuario, String email) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                        "nombre", "Test User",
                        "nombreUsuario", nombreUsuario,
                        "email", email,
                        "password", "password123"
                ))));
    }

    private String json(Map<String, String> body) throws Exception {
        return objectMapper.writeValueAsString(body);
    }
}
