package com.myfoodie.api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.myfoodie.domain.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class HistorialControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UsuarioRepository usuarioRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String token;

    @BeforeEach
    void setUp() throws Exception {
        usuarioRepository.deleteAll();
        token = registrar("histuser", "histuser@myfoodie.com").get("token").asText();
    }

    @Test
    @DisplayName("GET /api/historial/compras devuelve 200 con lista vacía para un usuario nuevo")
    void GET_compras_devuelve200_listaVacia() throws Exception {
        mockMvc.perform(get("/api/historial/compras")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("GET /api/historial/compras acepta filtros de fecha")
    void GET_compras_conFiltrosDeFecha_devuelve200() throws Exception {
        mockMvc.perform(get("/api/historial/compras")
                        .header("Authorization", "Bearer " + token)
                        .param("fechaDesde", "2026-01-01")
                        .param("fechaHasta", "2026-12-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /api/historial/compras sin token devuelve 401/403")
    void GET_compras_sinToken_noAutorizado() throws Exception {
        mockMvc.perform(get("/api/historial/compras"))
                .andExpect(status().is4xxClientError());
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
