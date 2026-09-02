package com.myfoodie.api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.myfoodie.domain.repository.ComentarioRepository;
import com.myfoodie.domain.repository.IngredienteRecetaRepository;
import com.myfoodie.domain.repository.PasoRepository;
import com.myfoodie.domain.repository.RecetaRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ComentarioControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private RecetaRepository recetaRepository;
    @Autowired private IngredienteRecetaRepository ingredienteRecetaRepository;
    @Autowired private PasoRepository pasoRepository;
    @Autowired private ComentarioRepository comentarioRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String tokenAutor;
    private String tokenOtro;
    private String recetaId;

    @BeforeEach
    void setUp() throws Exception {
        comentarioRepository.deleteAll();
        pasoRepository.deleteAll();
        ingredienteRecetaRepository.deleteAll();
        recetaRepository.deleteAll();
        usuarioRepository.deleteAll();

        tokenAutor = registrar("comentarioautor", "comentarioautor@myfoodie.com").get("token").asText();
        tokenOtro = registrar("comentariootro", "comentariootro@myfoodie.com").get("token").asText();
        recetaId = crearRecetaPublicada();
    }

    @Test
    void POST_comentarios_devuelve201() throws Exception {
        mockMvc.perform(post("/api/recetas/" + recetaId + "/comentarios")
                        .header("Authorization", "Bearer " + tokenAutor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"texto\":\"Buenísima receta\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.texto").value("Buenísima receta"))
                .andExpect(jsonPath("$.esAutor").value(true));
    }

    @Test
    void DELETE_comentarios_devuelve404_si_no_es_propietario() throws Exception {
        MvcResult creado = mockMvc.perform(post("/api/recetas/" + recetaId + "/comentarios")
                        .header("Authorization", "Bearer " + tokenAutor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"texto\":\"Mi comentario\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        String comentarioId = objectMapper.readTree(creado.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(delete("/api/recetas/" + recetaId + "/comentarios/" + comentarioId)
                        .header("Authorization", "Bearer " + tokenOtro))
                .andExpect(status().isNotFound());
    }

    @Test
    void GET_comentarios_devuelve401_sin_token() throws Exception {
        mockMvc.perform(get("/api/recetas/" + recetaId + "/comentarios"))
                .andExpect(status().isUnauthorized());
    }

    private JsonNode registrar(String nombreUsuario, String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nombre", nombreUsuario,
                                "nombreUsuario", nombreUsuario,
                                "email", email,
                                "password", "password123"))))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private String crearRecetaPublicada() throws Exception {
        MvcResult recetaResult = mockMvc.perform(post("/api/recetas")
                        .header("Authorization", "Bearer " + tokenAutor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "titulo", "Receta comentada",
                                "descripcion", "Descripción",
                                "tiempoEstimado", 20,
                                "dificultad", "fácil",
                                "categoria", "principal"))))
                .andReturn();
        String id = objectMapper.readTree(recetaResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(post("/api/recetas/" + id + "/ingredientes")
                        .header("Authorization", "Bearer " + tokenAutor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nombre", "Tomate", "cantidad", 2, "unidad", "unidades"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/recetas/" + id + "/pasos")
                        .header("Authorization", "Bearer " + tokenAutor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("descripcion", "Cortar el tomate"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/recetas/" + id + "/publicar")
                        .header("Authorization", "Bearer " + tokenAutor))
                .andExpect(status().isOk());

        return id;
    }
}
