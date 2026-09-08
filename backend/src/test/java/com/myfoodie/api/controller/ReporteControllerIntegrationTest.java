package com.myfoodie.api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.myfoodie.domain.repository.ReporteRepository;
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

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ReporteControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ReporteRepository reporteRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String tokenDenunciante;
    private String idDenunciado;

    @BeforeEach
    void setUp() throws Exception {
        reporteRepository.deleteAll();
        usuarioRepository.deleteAll();

        tokenDenunciante = registrar("denunciante", "denunciante@myfoodie.com").get("token").asText();
        idDenunciado = registrar("denunciado", "denunciado@myfoodie.com").get("userId").asText();
    }

    @Test
    @DisplayName("POST /api/reportes crea un reporte de perfil y devuelve 201 en estado PENDIENTE")
    void POST_reportes_creaReporteDePerfil_devuelve201() throws Exception {
        mockMvc.perform(post("/api/reportes")
                        .header("Authorization", "Bearer " + tokenDenunciante)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reporteJson("PERFIL", idDenunciado, "SPAM", "Perfil claramente falso")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.tipoContenido").value("PERFIL"))
                .andExpect(jsonPath("$.motivo").value("SPAM"))
                .andExpect(jsonPath("$.estado").value("PENDIENTE"));
    }

    @Test
    @DisplayName("POST /api/reportes duplicado del mismo usuario sobre el mismo contenido devuelve 409")
    void POST_reportes_duplicado_devuelve409() throws Exception {
        mockMvc.perform(post("/api/reportes")
                        .header("Authorization", "Bearer " + tokenDenunciante)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reporteJson("PERFIL", idDenunciado, "OTRO", null)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/reportes")
                        .header("Authorization", "Bearer " + tokenDenunciante)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reporteJson("PERFIL", idDenunciado, "OTRO", null)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/reportes reportándote a ti mismo devuelve 400")
    void POST_reportes_aTiMismo_devuelve400() throws Exception {
        JsonNode yo = registrar("mismo", "mismo@myfoodie.com");
        mockMvc.perform(post("/api/reportes")
                        .header("Authorization", "Bearer " + yo.get("token").asText())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reporteJson("PERFIL", yo.get("userId").asText(), "OTRO", null)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/reportes sin motivo devuelve 400 (validación del DTO)")
    void POST_reportes_sinMotivo_devuelve400() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("tipoContenido", "PERFIL");
        body.put("contenidoId", idDenunciado);

        mockMvc.perform(post("/api/reportes")
                        .header("Authorization", "Bearer " + tokenDenunciante)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/reportes sobre un contenido inexistente devuelve 404")
    void POST_reportes_contenidoInexistente_devuelve404() throws Exception {
        mockMvc.perform(post("/api/reportes")
                        .header("Authorization", "Bearer " + tokenDenunciante)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reporteJson("PERFIL", "id-que-no-existe", "SPAM", null)))
                .andExpect(status().isNotFound());
    }

    private String reporteJson(String tipo, String contenidoId, String motivo, String descripcion) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("tipoContenido", tipo);
        body.put("contenidoId", contenidoId);
        body.put("motivo", motivo);
        if (descripcion != null) {
            body.put("descripcionAdicional", descripcion);
        }
        return objectMapper.writeValueAsString(body);
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
