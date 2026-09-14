package com.myfoodie.api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.myfoodie.application.service.OCRService;
import com.myfoodie.domain.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class OCRControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UsuarioRepository usuarioRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Se simula el OCR para no llamar a Google Vision desde los tests.
    @MockitoBean private OCRService ocrService;

    private String token;

    @BeforeEach
    void setUp() throws Exception {
        usuarioRepository.deleteAll();
        token = registrar("ocruser", "ocruser@myfoodie.com").get("token").asText();
    }

    // -------------------------------------------------------------------------
    // POST /api/despensa/ocr/procesar
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("POST /procesar sin imagen devuelve 400")
    void POST_procesar_sinImagen_devuelve400() throws Exception {
        mockMvc.perform(multipart("/api/despensa/ocr/procesar")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /procesar con un formato no soportado devuelve 400")
    void POST_procesar_formatoNoSoportado_devuelve400() throws Exception {
        MockMultipartFile pdf = new MockMultipartFile(
                "imagen", "ticket.pdf", "application/pdf", "no soy una imagen".getBytes());

        mockMvc.perform(multipart("/api/despensa/ocr/procesar")
                        .file(pdf)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /procesar con una imagen válida devuelve 200 con la lista de resultados")
    void POST_procesar_imagenValida_devuelve200() throws Exception {
        when(ocrService.extraerTextoDeImagen(any())).thenReturn("LECHE 1,20");
        when(ocrService.procesarTextoTicket(anyString())).thenReturn(List.of());
        when(ocrService.procesarProductosTicket(anyString(), any())).thenReturn(List.of());

        MockMultipartFile imagen = new MockMultipartFile(
                "imagen", "ticket.jpg", "image/jpeg", new byte[] {1, 2, 3, 4});

        mockMvc.perform(multipart("/api/despensa/ocr/procesar")
                        .file(imagen)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    // -------------------------------------------------------------------------
    // POST /api/despensa/ocr/confirmar
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("POST /confirmar sin productos devuelve 400")
    void POST_confirmar_sinProductos_devuelve400() throws Exception {
        mockMvc.perform(post("/api/despensa/ocr/confirmar")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[]"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /confirmar con productos ignorados devuelve 200 y el resumen correcto")
    void POST_confirmar_ignorados_devuelve200() throws Exception {
        String body = objectMapper.writeValueAsString(List.of(
                Map.of("nombre", "Leche", "accion", "ignorado"),
                Map.of("nombre", "Pan", "accion", "ignorado")));

        mockMvc.perform(post("/api/despensa/ocr/confirmar")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.['añadidos']").value(0))
                .andExpect(jsonPath("$.actualizados").value(0))
                .andExpect(jsonPath("$.ignorados").value(2));
    }

    @Test
    @DisplayName("POST /confirmar con una acción desconocida devuelve 400")
    void POST_confirmar_accionDesconocida_devuelve400() throws Exception {
        String body = objectMapper.writeValueAsString(List.of(
                Map.of("nombre", "Leche", "accion", "teletransportar")));

        mockMvc.perform(post("/api/despensa/ocr/confirmar")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /confirmar con 'nuevo' que rechaza una sugerencia no vuelve a proponer la "
            + "misma fusión en GET /duplicados")
    void POST_confirmar_nuevoConSugerenciaRechazada_noReapareceEnDuplicados() throws Exception {
        String existenteId = añadirProductoYObtenerID("Leche Entera Pascual", 1, "litros");

        // El usuario vio la sugerencia durante la revisión del ticket y decidió crearlo como
        // un producto distinto: el backend recibe igualmente el id sugerido para poder
        // recordar que esa fusión ya se rechazó.
        String body = objectMapper.writeValueAsString(List.of(Map.of(
                "nombre", "Leche Entera Pascual", "cantidad", 1, "unidad", "litros",
                "accion", "nuevo", "productoExistenteId", existenteId)));

        mockMvc.perform(post("/api/despensa/ocr/confirmar")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.añadidos").value(1));

        mockMvc.perform(get("/api/despensa/productos/duplicados")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    private String añadirProductoYObtenerID(String nombre, double cantidad, String unidad) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/despensa/productos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nombre", nombre, "cantidad", cantidad, "unidad", unidad))))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
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
