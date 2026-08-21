package com.myfoodie.api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class UsuarioControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UsuarioRepository usuarioRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String token;
    private String usuarioId;

    @BeforeEach
    void setUp() throws Exception {
        usuarioRepository.deleteAll();

        JsonNode usuario = registrar("pushtokenuser", "pushtokenuser@myfoodie.com");
        token = usuario.get("token").asText();
        usuarioId = usuario.get("userId").asText();
    }

    @Test
    void POST_push_token_devuelve200_y_guarda_el_token_en_el_usuario() throws Exception {
        mockMvc.perform(post("/api/usuarios/push-token")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("token", "ExponentPushToken[abc123]"))))
                .andExpect(status().isOk());

        Usuario actualizado = usuarioRepository.findById(usuarioId).orElseThrow();
        assertThat(actualizado.getExpoPushToken()).isEqualTo("ExponentPushToken[abc123]");
    }

    @Test
    void POST_push_token_falla_sin_autenticacion() throws Exception {
        mockMvc.perform(post("/api/usuarios/push-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("token", "ExponentPushToken[abc123]"))))
                .andExpect(status().isUnauthorized());
    }

    private JsonNode registrar(String nombreUsuario, String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nombre", nombreUsuario,
                                "nombreUsuario", nombreUsuario,
                                "email", email,
                                "password", "password123"
                        ))))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }
}
