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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class FeedControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UsuarioRepository usuarioRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String tokenAutor;
    private String tokenLector;
    private String recetaId;

    @BeforeEach
    void setUp() throws Exception {
        usuarioRepository.deleteAll();

        tokenAutor = registrar("feedautor", "feedautor@myfoodie.com").get("token").asText();
        tokenLector = registrar("feedlector", "feedlector@myfoodie.com").get("token").asText();
        recetaId = crearRecetaPublicada(tokenAutor);
    }

    // -------------------------------------------------------------------------
    // Lectura del feed
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /api/feed devuelve 200 con la estructura paginada y la receta publicada")
    void GET_feed_devuelve200_conRecetaPublicada() throws Exception {
        mockMvc.perform(get("/api/feed").header("Authorization", "Bearer " + tokenLector))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recetas").isArray())
                .andExpect(jsonPath("$.pagina").value(0))
                .andExpect(jsonPath("$.recetas[0].titulo").value("Gazpacho andaluz"));
    }

    @Test
    @DisplayName("GET /api/feed/buscar devuelve 200 con las coincidencias por texto")
    void GET_buscar_devuelve200() throws Exception {
        mockMvc.perform(get("/api/feed/buscar")
                        .param("q", "gazpacho")
                        .header("Authorization", "Bearer " + tokenLector))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].titulo").value("Gazpacho andaluz"));
    }

    @Test
    @DisplayName("GET /api/feed/recetas/{id} devuelve 200 con el detalle")
    void GET_detalleReceta_devuelve200() throws Exception {
        mockMvc.perform(get("/api/feed/recetas/" + recetaId)
                        .header("Authorization", "Bearer " + tokenLector))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Gazpacho andaluz"));
    }

    // -------------------------------------------------------------------------
    // Acciones sobre recetas
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("POST /api/feed/recetas/{id}/like devuelve 200 y el segundo like devuelve 409")
    void POST_like_yLuegoDuplicado() throws Exception {
        mockMvc.perform(post("/api/feed/recetas/" + recetaId + "/like")
                        .header("Authorization", "Bearer " + tokenLector))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/feed/recetas/" + recetaId + "/like")
                        .header("Authorization", "Bearer " + tokenLector))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("DELETE /api/feed/recetas/{id}/like devuelve 200")
    void DELETE_like_devuelve200() throws Exception {
        mockMvc.perform(post("/api/feed/recetas/" + recetaId + "/like")
                        .header("Authorization", "Bearer " + tokenLector))
                .andExpect(status().isOk());
        mockMvc.perform(delete("/api/feed/recetas/" + recetaId + "/like")
                        .header("Authorization", "Bearer " + tokenLector))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/feed/recetas/{id}/guardar devuelve 200")
    void POST_guardar_devuelve200() throws Exception {
        mockMvc.perform(post("/api/feed/recetas/" + recetaId + "/guardar")
                        .header("Authorization", "Bearer " + tokenLector))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/feed/recetas/{id}/descartar devuelve 200 y el segundo descarte devuelve 409")
    void POST_descartar_yLuegoDuplicado() throws Exception {
        mockMvc.perform(post("/api/feed/recetas/" + recetaId + "/descartar")
                        .header("Authorization", "Bearer " + tokenLector))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/feed/recetas/" + recetaId + "/descartar")
                        .header("Authorization", "Bearer " + tokenLector))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/feed/deshacer revierte la última acción; sin acciones devuelve 404")
    void POST_deshacer() throws Exception {
        mockMvc.perform(post("/api/feed/deshacer").header("Authorization", "Bearer " + tokenLector))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/feed/recetas/" + recetaId + "/guardar")
                        .header("Authorization", "Bearer " + tokenLector))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/feed/deshacer").header("Authorization", "Bearer " + tokenLector))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/feed/descartadas devuelve 204")
    void DELETE_descartadas_devuelve204() throws Exception {
        mockMvc.perform(delete("/api/feed/descartadas").header("Authorization", "Bearer " + tokenLector))
                .andExpect(status().isNoContent());
    }

    // -------------------------------------------------------------------------
    // Perfil de gustos y recetas de seguidos
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /api/feed/perfil-gustos devuelve 200")
    void GET_perfilGustos_devuelve200() throws Exception {
        mockMvc.perform(get("/api/feed/perfil-gustos").header("Authorization", "Bearer " + tokenLector))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuarioId").exists());
    }

    @Test
    @DisplayName("POST /api/feed/inicializar-perfil devuelve 200")
    void POST_inicializarPerfil_devuelve200() throws Exception {
        mockMvc.perform(post("/api/feed/inicializar-perfil")
                        .header("Authorization", "Bearer " + tokenLector)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "tiposCocinaPreferidos", java.util.List.of("mediterranea"),
                                "tiempoDisponible", "poco"))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/feed/perfil-gustos devuelve 204")
    void DELETE_perfilGustos_devuelve204() throws Exception {
        mockMvc.perform(delete("/api/feed/perfil-gustos").header("Authorization", "Bearer " + tokenLector))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("GET /api/feed/recetas-seguidos devuelve 200 con estructura paginada")
    void GET_recetasSeguidos_devuelve200() throws Exception {
        mockMvc.perform(get("/api/feed/recetas-seguidos").header("Authorization", "Bearer " + tokenLector))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recetas").isArray());
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private String crearRecetaPublicada(String token) throws Exception {
        MvcResult creada = mockMvc.perform(post("/api/recetas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "titulo", "Gazpacho andaluz",
                                "descripcion", "Sopa fría de tomate",
                                "tiempoEstimado", 15,
                                "dificultad", "facil",
                                "categoria", "entrante",
                                "imagenUrl", "https://example.com/gazpacho.jpg"))))
                .andReturn();
        String id = objectMapper.readTree(creada.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(post("/api/recetas/" + id + "/ingredientes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nombre", "Tomate", "cantidad", 1, "unidad", "kg"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/recetas/" + id + "/pasos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "descripcion", "Triturar todo y enfriar"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/recetas/" + id + "/publicar")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        return id;
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
