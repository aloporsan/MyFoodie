package com.myfoodie.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import com.myfoodie.application.dto.perfil.EliminarCuentaDTO;
import com.myfoodie.application.dto.perfil.PerfilUpdateDTO;
import com.myfoodie.application.dto.perfil.PreferenciasUpdateDTO;
import com.myfoodie.application.dto.perfil.PrivacidadUpdateDTO;
import com.myfoodie.domain.model.Preferencias;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.repository.PreferenciasRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.infrastructure.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.MOCK,
        properties = {
                "spring.data.redis.repositories.enabled=false",
                "spring.autoconfigure.exclude=org.springframework.boot.data.redis.autoconfigure.DataRedisReactiveAutoConfiguration"
        }
)
class PerfilControllerIntegrationTest {

    @Autowired private WebApplicationContext wac;
    @Autowired private UsuarioRepository usuarioRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    @Autowired private PreferenciasRepository preferenciasRepository;
    @Autowired private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private RedisConnectionFactory redisConnectionFactory;

    @MockitoBean
    private RedisTemplate<String, String> redisTemplate;

    private MockMvc mockMvc;
    private ValueOperations<String, String> valueOps;
    private String token;
    private String usuarioId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(wac)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        preferenciasRepository.deleteAll();
        usuarioRepository.deleteAll();

        valueOps = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get(anyString())).thenReturn(null);

        Usuario usuario = usuarioRepository.save(Usuario.builder()
                .nombre("Test Usuario")
                .nombreUsuario("testuser")
                .email("test@myfoodie.com")
                .passwordHash("hashed")
                .build());

        usuarioId = usuario.getId();
        token = jwtTokenProvider.generateToken(usuario);

        preferenciasRepository.save(Preferencias.builder()
                .usuarioId(usuarioId)
                .tipoDieta("Mediterránea")
                .build());
    }

    // ===== POSITIVOS =====

    @Test
    void GET_perfil_devuelve200_con_datos_usuario() throws Exception {
        mockMvc.perform(get("/api/perfil")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Test Usuario"))
                .andExpect(jsonPath("$.nombreUsuario").value("testuser"))
                .andExpect(jsonPath("$.email").value("test@myfoodie.com"));
    }

    @Test
    void PUT_perfil_devuelve200_con_datos_actualizados() throws Exception {
        PerfilUpdateDTO dto = new PerfilUpdateDTO("Nuevo Nombre", null, null, "Nueva bio");

        mockMvc.perform(put("/api/perfil")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Nuevo Nombre"))
                .andExpect(jsonPath("$.biografia").value("Nueva bio"));
    }

    @Test
    void GET_preferencias_devuelve200_con_preferencias() throws Exception {
        mockMvc.perform(get("/api/perfil/preferencias")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipoDieta").exists())
                .andExpect(jsonPath("$.alergias").exists());
    }

    @Test
    void PUT_preferencias_devuelve200_con_preferencias_actualizadas() throws Exception {
        PreferenciasUpdateDTO dto = new PreferenciasUpdateDTO(
                "Vegana", List.of("Soja"), null, "Fácil", 45, null);

        mockMvc.perform(put("/api/perfil/preferencias")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipoDieta").value("Vegana"))
                .andExpect(jsonPath("$.nivelDificultad").value("Fácil"));
    }

    @Test
    void PUT_privacidad_devuelve200_con_flags_actualizados() throws Exception {
        PrivacidadUpdateDTO dto = new PrivacidadUpdateDTO(false, true, false, true);

        mockMvc.perform(put("/api/perfil/privacidad")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());
    }

    @Test
    void GET_estadisticas_devuelve200_con_contadores() throws Exception {
        mockMvc.perform(get("/api/perfil/estadisticas")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalProductosRegistrados").isNumber())
                .andExpect(jsonPath("$.totalProductosConsumidos").isNumber())
                .andExpect(jsonPath("$.totalProductosCaducados").isNumber());
    }

    @Test
    void POST_cerrarSesion_devuelve200_e_invalida_token() throws Exception {
        mockMvc.perform(post("/api/perfil/cerrar-sesion")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        verify(valueOps).set(contains("blacklist:"), eq(usuarioId), anyLong(), any());

        // Simular que el token ya está en la blacklist de Redis
        when(redisTemplate.hasKey(anyString())).thenReturn(true);

        mockMvc.perform(get("/api/perfil")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void DELETE_perfil_devuelve204_con_confirmar_true() throws Exception {
        EliminarCuentaDTO dto = new EliminarCuentaDTO(true);

        mockMvc.perform(delete("/api/perfil")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNoContent());
    }

    // ===== NEGATIVOS =====

    @Test
    void GET_perfil_devuelve401_sinToken() throws Exception {
        mockMvc.perform(get("/api/perfil"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void PUT_perfil_devuelve409_conNombreUsuarioDuplicado() throws Exception {
        usuarioRepository.save(Usuario.builder()
                .nombre("Otro Usuario")
                .nombreUsuario("otrouser")
                .email("otro@myfoodie.com")
                .passwordHash("hashed")
                .build());

        PerfilUpdateDTO dto = new PerfilUpdateDTO(null, "otrouser", null, null);

        mockMvc.perform(put("/api/perfil")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }

    @Test
    void PUT_perfil_devuelve400_conNombreVacio() throws Exception {
        PerfilUpdateDTO dto = new PerfilUpdateDTO("", null, null, null);

        mockMvc.perform(put("/api/perfil")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void DELETE_perfil_devuelve400_sinConfirmar() throws Exception {
        mockMvc.perform(delete("/api/perfil")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void DELETE_perfil_devuelve400_conConfirmarFalse() throws Exception {
        EliminarCuentaDTO dto = new EliminarCuentaDTO(false);

        mockMvc.perform(delete("/api/perfil")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void GET_perfil_devuelve401_conTokenEnBlacklist() throws Exception {
        mockMvc.perform(post("/api/perfil/cerrar-sesion")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        when(redisTemplate.hasKey(anyString())).thenReturn(true);

        mockMvc.perform(get("/api/perfil")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }
}
