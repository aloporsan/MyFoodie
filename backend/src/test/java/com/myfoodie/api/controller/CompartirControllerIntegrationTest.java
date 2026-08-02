package com.myfoodie.api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.myfoodie.domain.repository.BloqueoRepository;
import com.myfoodie.domain.repository.IngredienteRecetaRepository;
import com.myfoodie.domain.repository.PasoRepository;
import com.myfoodie.domain.repository.RecetaCompartidaRepository;
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

import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CompartirControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private RecetaRepository recetaRepository;
    @Autowired private IngredienteRecetaRepository ingredienteRecetaRepository;
    @Autowired private PasoRepository pasoRepository;
    @Autowired private RecetaCompartidaRepository recetaCompartidaRepository;
    @Autowired private BloqueoRepository bloqueoRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String tokenEmisor;
    private String idEmisor;
    private String tokenReceptor;
    private String idReceptor;
    private String tokenBloqueado;
    private String idBloqueado;
    private String recetaId;
    private String recetaBorradorId;

    @BeforeEach
    void setUp() throws Exception {
        recetaCompartidaRepository.deleteAll();
        bloqueoRepository.deleteAll();
        pasoRepository.deleteAll();
        ingredienteRecetaRepository.deleteAll();
        recetaRepository.deleteAll();
        usuarioRepository.deleteAll();

        JsonNode emisor = registrar("compartiremisor", "compartiremisor@myfoodie.com");
        tokenEmisor = emisor.get("token").asText();
        idEmisor = emisor.get("userId").asText();

        JsonNode receptor = registrar("compartirreceptor", "compartirreceptor@myfoodie.com");
        tokenReceptor = receptor.get("token").asText();
        idReceptor = receptor.get("userId").asText();

        JsonNode bloqueado = registrar("compartirbloqueado", "compartirbloqueado@myfoodie.com");
        tokenBloqueado = bloqueado.get("token").asText();
        idBloqueado = bloqueado.get("userId").asText();

        mockMvc.perform(post("/api/social/bloquear/" + idBloqueado)
                        .header("Authorization", "Bearer " + tokenEmisor))
                .andExpect(status().isOk());

        recetaId = crearRecetaPublicadaConDosIngredientes();

        MvcResult borradorResult = mockMvc.perform(post("/api/recetas")
                        .header("Authorization", "Bearer " + tokenEmisor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(recetaJson("Receta sin publicar")))
                .andReturn();
        recetaBorradorId = objectMapper.readTree(borradorResult.getResponse().getContentAsString())
                .get("id").asText();
    }

    // ===== POSITIVOS =====

    @Test
    void POST_compartir_devuelve201_con_un_receptor() throws Exception {
        mockMvc.perform(post("/api/compartir/recetas/" + recetaId)
                        .header("Authorization", "Bearer " + tokenEmisor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(compartirJson(List.of(idReceptor), null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(notNullValue()))
                .andExpect(jsonPath("$[0].emisor.nombreUsuario").value("compartiremisor"))
                .andExpect(jsonPath("$[0].receta.id").value(recetaId))
                .andExpect(jsonPath("$[0].leida").value(false));
    }

    @Test
    void POST_compartir_devuelve201_con_mensaje() throws Exception {
        mockMvc.perform(post("/api/compartir/recetas/" + recetaId)
                        .header("Authorization", "Bearer " + tokenEmisor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(compartirJson(List.of(idReceptor), "Prueba esta receta")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$[0].mensaje").value("Prueba esta receta"));
    }

    @Test
    void GET_recibidas_devuelve200_con_array() throws Exception {
        compartir(tokenEmisor, recetaId, List.of(idReceptor), null);

        mockMvc.perform(get("/api/compartir/recibidas")
                        .header("Authorization", "Bearer " + tokenReceptor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].receta.id").value(recetaId))
                .andExpect(jsonPath("$[0].emisor.nombreUsuario").value("compartiremisor"));
    }

    @Test
    void GET_contador_devuelve200_con_numero() throws Exception {
        compartir(tokenEmisor, recetaId, List.of(idReceptor), null);

        mockMvc.perform(get("/api/compartir/recibidas/contador")
                        .header("Authorization", "Bearer " + tokenReceptor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.noLeidas").value(1));
    }

    @Test
    void PUT_leer_devuelve200_y_marca_leida() throws Exception {
        String recetaCompartidaId = compartir(tokenEmisor, recetaId, List.of(idReceptor), null);

        mockMvc.perform(put("/api/compartir/recibidas/" + recetaCompartidaId + "/leer")
                        .header("Authorization", "Bearer " + tokenReceptor))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/compartir/recibidas")
                        .header("Authorization", "Bearer " + tokenReceptor))
                .andExpect(jsonPath("$[0].leida").value(true));
    }

    @Test
    void POST_guardar_devuelve200_y_añade_a_guardadas() throws Exception {
        String recetaCompartidaId = compartir(tokenEmisor, recetaId, List.of(idReceptor), null);

        mockMvc.perform(post("/api/compartir/recibidas/" + recetaCompartidaId + "/guardar")
                        .header("Authorization", "Bearer " + tokenReceptor))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/recetas/guardadas")
                        .header("Authorization", "Bearer " + tokenReceptor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(recetaId));
    }

    @Test
    void GET_ingredientes_devuelve200_con_faltantes() throws Exception {
        String recetaCompartidaId = compartir(tokenEmisor, recetaId, List.of(idReceptor), null);

        mockMvc.perform(post("/api/despensa/productos")
                        .header("Authorization", "Bearer " + tokenReceptor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nombre", "Tomate", "cantidad", 3, "unidad", "unidades"))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/compartir/recibidas/" + recetaCompartidaId + "/ingredientes")
                        .header("Authorization", "Bearer " + tokenReceptor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nombre").value("Pasta"));
    }

    // ===== NEGATIVOS =====

    @Test
    void POST_compartir_devuelve400_sin_receptores() throws Exception {
        mockMvc.perform(post("/api/compartir/recetas/" + recetaId)
                        .header("Authorization", "Bearer " + tokenEmisor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(compartirJson(List.of(), null)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void POST_compartir_devuelve400_consigo_mismo() throws Exception {
        mockMvc.perform(post("/api/compartir/recetas/" + recetaId)
                        .header("Authorization", "Bearer " + tokenEmisor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(compartirJson(List.of(idEmisor), null)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void POST_compartir_devuelve400_mas_de_10_receptores() throws Exception {
        List<String> receptores = List.of("d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8", "d9", "d10", "d11");

        mockMvc.perform(post("/api/compartir/recetas/" + recetaId)
                        .header("Authorization", "Bearer " + tokenEmisor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(compartirJson(receptores, null)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void POST_compartir_devuelve400_receta_no_publicada() throws Exception {
        mockMvc.perform(post("/api/compartir/recetas/" + recetaBorradorId)
                        .header("Authorization", "Bearer " + tokenEmisor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(compartirJson(List.of(idReceptor), null)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void POST_compartir_devuelve403_receptor_bloqueado() throws Exception {
        mockMvc.perform(post("/api/compartir/recetas/" + recetaId)
                        .header("Authorization", "Bearer " + tokenEmisor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(compartirJson(List.of(idBloqueado), null)))
                .andExpect(status().isForbidden());
    }

    @Test
    void PUT_leer_devuelve403_si_no_es_receptor() throws Exception {
        String recetaCompartidaId = compartir(tokenEmisor, recetaId, List.of(idReceptor), null);

        mockMvc.perform(put("/api/compartir/recibidas/" + recetaCompartidaId + "/leer")
                        .header("Authorization", "Bearer " + tokenBloqueado))
                .andExpect(status().isForbidden());
    }

    @Test
    void GET_recibidas_devuelve401_sin_token() throws Exception {
        mockMvc.perform(get("/api/compartir/recibidas"))
                .andExpect(status().isUnauthorized());
    }

    // ===== Helpers =====

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

    private String crearRecetaPublicadaConDosIngredientes() throws Exception {
        MvcResult recetaResult = mockMvc.perform(post("/api/recetas")
                        .header("Authorization", "Bearer " + tokenEmisor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(recetaJson("Ensalada de tomate")))
                .andReturn();
        String id = objectMapper.readTree(recetaResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(post("/api/recetas/" + id + "/ingredientes")
                        .header("Authorization", "Bearer " + tokenEmisor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nombre", "Tomate", "cantidad", 3, "unidad", "unidades"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/recetas/" + id + "/ingredientes")
                        .header("Authorization", "Bearer " + tokenEmisor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nombre", "Pasta", "cantidad", 200, "unidad", "g"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/recetas/" + id + "/pasos")
                        .header("Authorization", "Bearer " + tokenEmisor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "descripcion", "Cortar el tomate y cocer la pasta"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/recetas/" + id + "/publicar")
                        .header("Authorization", "Bearer " + tokenEmisor))
                .andExpect(status().isOk());

        return id;
    }

    private String compartir(String token, String recetaId, List<String> receptorIds, String mensaje) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/compartir/recetas/" + recetaId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(compartirJson(receptorIds, mensaje)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get(0).get("id").asText();
    }

    private String compartirJson(List<String> receptorIds, String mensaje) throws Exception {
        return objectMapper.writeValueAsString(
                mensaje == null
                        ? Map.of("receptorIds", receptorIds)
                        : Map.of("receptorIds", receptorIds, "mensaje", mensaje));
    }

    private String recetaJson(String titulo) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "titulo", titulo,
                "descripcion", "Descripción de prueba",
                "tiempoEstimado", 10,
                "dificultad", "facil",
                "categoria", "entrante"
        ));
    }
}
