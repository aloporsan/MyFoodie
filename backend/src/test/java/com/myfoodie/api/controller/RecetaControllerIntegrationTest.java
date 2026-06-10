package com.myfoodie.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.myfoodie.domain.repository.IngredienteRecetaRepository;
import com.myfoodie.domain.repository.PasoRepository;
import com.myfoodie.domain.repository.RecetaRepository;
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

import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("RecetaController — integración endpoints REST")
class RecetaControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private RecetaRepository recetaRepository;
    @Autowired private IngredienteRecetaRepository ingredienteRecetaRepository;
    @Autowired private PasoRepository pasoRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String tokenA;
    private String tokenB;

    @BeforeEach
    void setup() throws Exception {
        pasoRepository.deleteAll();
        ingredienteRecetaRepository.deleteAll();
        recetaRepository.deleteAll();
        usuarioRepository.deleteAll();

        tokenA = registrarYObtenerToken("userA", "userA@receta.com");
        tokenB = registrarYObtenerToken("userB", "userB@receta.com");
    }

    // -------------------------------------------------------------------------
    // POST /api/recetas
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("POST /api/recetas devuelve 201 con datos válidos")
    void POST_recetas_devuelve201_conDatosValidos() throws Exception {
        mockMvc.perform(post("/api/recetas")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(recetaJson("Paella valenciana", "Receta tradicional", 60, "Difícil", "Arroces")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(notNullValue()))
                .andExpect(jsonPath("$.titulo").value("Paella valenciana"))
                .andExpect(jsonPath("$.estado").value("borrador"));
    }

    @Test
    @DisplayName("POST /api/recetas devuelve 400 si el título está vacío")
    void POST_recetas_devuelve400_sinTitulo() throws Exception {
        mockMvc.perform(post("/api/recetas")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(recetaJson("", "Descripción", 30, "Fácil", "Pasta")))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------
    // GET /api/recetas/{id}
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /api/recetas/{id} devuelve 200 si la receta existe")
    void GET_receta_devuelve200_siExiste() throws Exception {
        String recetaId = crearRecetaYObtenerID(tokenA);

        mockMvc.perform(get("/api/recetas/" + recetaId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(recetaId))
                .andExpect(jsonPath("$.titulo").value("Paella valenciana"));
    }

    @Test
    @DisplayName("GET /api/recetas/{id} devuelve 401 sin token JWT")
    void GET_receta_devuelve401_sinToken() throws Exception {
        String recetaId = crearRecetaYObtenerID(tokenA);

        mockMvc.perform(get("/api/recetas/" + recetaId))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/recetas/{id} devuelve 404 si la receta no existe")
    void GET_receta_devuelve404_siNoExiste() throws Exception {
        mockMvc.perform(get("/api/recetas/id-inexistente")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound());
    }

    // -------------------------------------------------------------------------
    // PUT /api/recetas/{id}
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("PUT /api/recetas/{id} devuelve 200 con datos actualizados")
    void PUT_receta_devuelve200_conDatosActualizados() throws Exception {
        String recetaId = crearRecetaYObtenerID(tokenA);

        mockMvc.perform(put("/api/recetas/" + recetaId)
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(recetaJson("Paella Valenciana Mejorada", "Nueva desc", 90, "Difícil", "Arroces")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Paella Valenciana Mejorada"));
    }

    @Test
    @DisplayName("PUT /api/recetas/{id} devuelve 403 si no es el autor")
    void PUT_receta_devuelve403_siNoPropietario() throws Exception {
        String recetaId = crearRecetaYObtenerID(tokenA);

        mockMvc.perform(put("/api/recetas/" + recetaId)
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(recetaJson("Receta robada", "desc", 10, "Fácil", "Otros")))
                .andExpect(status().isForbidden());
    }

    // -------------------------------------------------------------------------
    // DELETE /api/recetas/{id}
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("DELETE /api/recetas/{id} devuelve 204 y la receta desaparece")
    void DELETE_receta_devuelve204_yDesaparece() throws Exception {
        String recetaId = crearRecetaYObtenerID(tokenA);

        mockMvc.perform(delete("/api/recetas/" + recetaId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/recetas/" + recetaId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /api/recetas/{id} devuelve 403 si no es el autor")
    void DELETE_receta_devuelve403_siNoPropietario() throws Exception {
        String recetaId = crearRecetaYObtenerID(tokenA);

        mockMvc.perform(delete("/api/recetas/" + recetaId)
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());
    }

    // -------------------------------------------------------------------------
    // POST /api/recetas/{id}/publicar
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("POST /api/recetas/{id}/publicar devuelve 200 y estado publicada")
    void POST_publicar_devuelve200_estadoPublicada() throws Exception {
        String recetaId = crearRecetaCompletaYObtenerID(tokenA);

        mockMvc.perform(post("/api/recetas/" + recetaId + "/publicar")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("publicada"));
    }

    @Test
    @DisplayName("POST /api/recetas/{id}/publicar devuelve 400 si receta incompleta")
    void POST_publicar_devuelve400_siIncompleta() throws Exception {
        String recetaId = crearRecetaYObtenerID(tokenA);

        mockMvc.perform(post("/api/recetas/" + recetaId + "/publicar")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------
    // POST /api/recetas/{id}/borrador
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("POST /api/recetas/{id}/borrador devuelve 200 y estado borrador")
    void POST_borrador_devuelve200_estadoBorrador() throws Exception {
        String recetaId = crearRecetaCompletaYObtenerID(tokenA);

        mockMvc.perform(post("/api/recetas/" + recetaId + "/publicar")
                        .header("Authorization", "Bearer " + tokenA));

        mockMvc.perform(post("/api/recetas/" + recetaId + "/borrador")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("borrador"));
    }

    // -------------------------------------------------------------------------
    // POST /api/recetas/{id}/ingredientes
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("POST /api/recetas/{id}/ingredientes devuelve 201 con ingrediente añadido")
    void POST_ingredientes_devuelve201_conIngrediente() throws Exception {
        String recetaId = crearRecetaYObtenerID(tokenA);

        mockMvc.perform(post("/api/recetas/" + recetaId + "/ingredientes")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(ingredienteJson("Arroz", 200, "g")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ingredientes", hasSize(1)))
                .andExpect(jsonPath("$.ingredientes[0].nombre").value("Arroz"));
    }

    @Test
    @DisplayName("POST /api/recetas/{id}/ingredientes devuelve 400 sin nombre")
    void POST_ingredientes_devuelve400_sinNombre() throws Exception {
        String recetaId = crearRecetaYObtenerID(tokenA);

        mockMvc.perform(post("/api/recetas/" + recetaId + "/ingredientes")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(ingredienteJson("", 200, "g")))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------
    // DELETE /api/recetas/{id}/ingredientes/{ingredienteId}
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("DELETE /api/recetas/{id}/ingredientes/{ingredienteId} devuelve 204")
    void DELETE_ingrediente_devuelve204() throws Exception {
        String recetaId = crearRecetaYObtenerID(tokenA);
        String ingredienteId = añadirIngredienteYObtenerID(tokenA, recetaId, "Sal", 5, "g");

        mockMvc.perform(delete("/api/recetas/" + recetaId + "/ingredientes/" + ingredienteId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNoContent());
    }

    // -------------------------------------------------------------------------
    // POST /api/recetas/{id}/pasos
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("POST /api/recetas/{id}/pasos devuelve 201 con paso añadido")
    void POST_pasos_devuelve201_conPaso() throws Exception {
        String recetaId = crearRecetaYObtenerID(tokenA);

        mockMvc.perform(post("/api/recetas/" + recetaId + "/pasos")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(pasoJson("Calentar el agua hasta hervir")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.pasos", hasSize(1)))
                .andExpect(jsonPath("$.pasos[0].orden").value(1));
    }

    @Test
    @DisplayName("POST /api/recetas/{id}/pasos devuelve 400 sin descripción")
    void POST_pasos_devuelve400_sinDescripcion() throws Exception {
        String recetaId = crearRecetaYObtenerID(tokenA);

        mockMvc.perform(post("/api/recetas/" + recetaId + "/pasos")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(pasoJson("")))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------
    // PUT /api/recetas/{id}/pasos/reordenar
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("PUT /api/recetas/{id}/pasos/reordenar devuelve 200 y pasos reordenados")
    void PUT_reordenarPasos_devuelve200_conPasosReordenados() throws Exception {
        String recetaId = crearRecetaYObtenerID(tokenA);
        String paso1Id = añadirPasoYObtenerID(tokenA, recetaId, "Primer paso");
        String paso2Id = añadirPasoYObtenerID(tokenA, recetaId, "Segundo paso");

        mockMvc.perform(put("/api/recetas/" + recetaId + "/pasos/reordenar")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(paso2Id, paso1Id))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pasos[0].descripcion").value("Segundo paso"))
                .andExpect(jsonPath("$.pasos[0].orden").value(1));
    }

    // -------------------------------------------------------------------------
    // DELETE /api/recetas/{id}/pasos/{pasoId}
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("DELETE /api/recetas/{id}/pasos/{pasoId} devuelve 204")
    void DELETE_paso_devuelve204() throws Exception {
        String recetaId = crearRecetaYObtenerID(tokenA);
        String pasoId = añadirPasoYObtenerID(tokenA, recetaId, "Paso a eliminar");

        mockMvc.perform(delete("/api/recetas/" + recetaId + "/pasos/" + pasoId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNoContent());
    }

    // -------------------------------------------------------------------------
    // PUT /api/recetas/{id}/etiquetas
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("PUT /api/recetas/{id}/etiquetas devuelve 200 con etiquetas actualizadas")
    void PUT_etiquetas_devuelve200_conEtiquetasActualizadas() throws Exception {
        String recetaId = crearRecetaYObtenerID(tokenA);

        mockMvc.perform(put("/api/recetas/" + recetaId + "/etiquetas")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of("vegano", "saludable"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.etiquetas", hasSize(2)))
                .andExpect(jsonPath("$.etiquetas", hasItems("vegano", "saludable")));
    }

    // -------------------------------------------------------------------------
    // GET /api/recetas/mis-recetas y mis-borradores
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /api/recetas/mis-recetas devuelve 200 con lista de recetas")
    void GET_misRecetas_devuelve200_conLista() throws Exception {
        crearRecetaYObtenerID(tokenA);
        crearRecetaYObtenerID(tokenA);

        mockMvc.perform(get("/api/recetas/mis-recetas")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    @DisplayName("GET /api/recetas/mis-borradores devuelve 200 con solo borradores")
    void GET_misBorradores_devuelve200_conSoloBorradores() throws Exception {
        String recetaId = crearRecetaCompletaYObtenerID(tokenA);
        mockMvc.perform(post("/api/recetas/" + recetaId + "/publicar")
                .header("Authorization", "Bearer " + tokenA));

        crearRecetaYObtenerID(tokenA);

        mockMvc.perform(get("/api/recetas/mis-borradores")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private String registrarYObtenerToken(String nombreUsuario, String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nombre", nombreUsuario,
                                "nombreUsuario", nombreUsuario,
                                "email", email,
                                "password", "password123"
                        ))))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("token").asText();
    }

    private String crearRecetaYObtenerID(String token) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/recetas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(recetaJson("Paella valenciana", "Receta tradicional", 60, "Difícil", "Arroces")))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("id").asText();
    }

    private String crearRecetaCompletaYObtenerID(String token) throws Exception {
        String recetaId = crearRecetaYObtenerID(token);
        añadirIngredienteYObtenerID(token, recetaId, "Arroz", 200, "g");
        añadirPasoYObtenerID(token, recetaId, "Preparar el caldo");
        return recetaId;
    }

    private String añadirIngredienteYObtenerID(String token, String recetaId,
                                                String nombre, double cantidad,
                                                String unidad) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/recetas/" + recetaId + "/ingredientes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(ingredienteJson(nombre, cantidad, unidad)))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("ingredientes").get(0).get("id").asText();
    }

    private String añadirPasoYObtenerID(String token, String recetaId, String descripcion) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/recetas/" + recetaId + "/pasos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(pasoJson(descripcion)))
                .andReturn();
        var pasos = objectMapper.readTree(result.getResponse().getContentAsString()).get("pasos");
        return pasos.get(pasos.size() - 1).get("id").asText();
    }

    private String recetaJson(String titulo, String descripcion, int tiempo,
                               String dificultad, String categoria) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "titulo", titulo,
                "descripcion", descripcion,
                "tiempoEstimado", tiempo,
                "dificultad", dificultad,
                "categoria", categoria
        ));
    }

    private String ingredienteJson(String nombre, double cantidad, String unidad) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "nombre", nombre,
                "cantidad", cantidad,
                "unidad", unidad
        ));
    }

    private String pasoJson(String descripcion) throws Exception {
        return objectMapper.writeValueAsString(Map.of("descripcion", descripcion));
    }
}
