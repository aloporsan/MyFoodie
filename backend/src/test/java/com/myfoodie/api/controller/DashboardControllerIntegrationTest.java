package com.myfoodie.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.myfoodie.domain.repository.DespensaRepository;
import com.myfoodie.domain.repository.ProductoRepository;
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
import static org.hamcrest.Matchers.lessThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("DashboardController — integración endpoints REST")
class DashboardControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProductoRepository productoRepository;
    @Autowired private DespensaRepository despensaRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private String token;

    @BeforeEach
    void setup() throws Exception {
        productoRepository.deleteAll();
        despensaRepository.deleteAll();
        usuarioRepository.deleteAll();
        token = registrarYObtenerToken("dashuser", "dash@test.com");
    }

    // -------------------------------------------------------------------------
    // GET /api/dashboard — endpoint combinado
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /dashboard devuelve 200 con todos los campos")
    void GET_dashboard_devuelve200_con_todos_los_campos() throws Exception {
        mockMvc.perform(get("/api/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resumen").exists())
                .andExpect(jsonPath("$.alertas").exists())
                .andExpect(jsonPath("$.prioritarios").exists())
                .andExpect(jsonPath("$.estadisticas").exists())
                .andExpect(jsonPath("$.carrito").exists())
                .andExpect(jsonPath("$.recetas").exists());
    }

    @Test
    @DisplayName("GET /dashboard devuelve contadores a 0 si la despensa está vacía")
    void GET_dashboard_devuelve_vacios_si_despensa_sin_productos() throws Exception {
        mockMvc.perform(get("/api/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resumen.totalProductos").value(0))
                .andExpect(jsonPath("$.resumen.caducados").value(0))
                .andExpect(jsonPath("$.resumen.caduca_pronto").value(0))
                .andExpect(jsonPath("$.resumen.caduca_semana").value(0))
                .andExpect(jsonPath("$.resumen.caduca_mes").value(0))
                .andExpect(jsonPath("$.resumen.bajoStock").value(0));
    }

    // -------------------------------------------------------------------------
    // GET /api/dashboard/resumen
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /dashboard/resumen devuelve 200 con contadores")
    void GET_dashboard_resumen_devuelve200_con_contadores() throws Exception {
        mockMvc.perform(get("/api/dashboard/resumen")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalProductos").exists())
                .andExpect(jsonPath("$.caducados").exists())
                .andExpect(jsonPath("$.caduca_pronto").exists())
                .andExpect(jsonPath("$.caduca_semana").exists())
                .andExpect(jsonPath("$.caduca_mes").exists())
                .andExpect(jsonPath("$.bajoStock").exists());
    }

    // -------------------------------------------------------------------------
    // GET /api/dashboard/alertas
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /dashboard/alertas devuelve 200 con array")
    void GET_dashboard_alertas_devuelve200_con_array() throws Exception {
        mockMvc.perform(get("/api/dashboard/alertas")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    // -------------------------------------------------------------------------
    // GET /api/dashboard/prioritarios
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /dashboard/prioritarios devuelve 200 con array de máximo 5")
    void GET_dashboard_prioritarios_devuelve200_maximo_cinco() throws Exception {
        // Añadir 6 productos caducados
        for (int i = 1; i <= 6; i++) {
            añadirProducto(token, "Producto " + i, 1, "unidades", "2020-01-01");
        }

        mockMvc.perform(get("/api/dashboard/prioritarios")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(lessThanOrEqualTo(5)));
    }

    // -------------------------------------------------------------------------
    // GET /api/dashboard/estadisticas
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /dashboard/estadisticas devuelve 200 con aprovechamiento")
    void GET_dashboard_estadisticas_devuelve200_con_aprovechamiento() throws Exception {
        mockMvc.perform(get("/api/dashboard/estadisticas")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.aprovechamiento").exists())
                .andExpect(jsonPath("$.totalRegistrados").exists());
    }

    // -------------------------------------------------------------------------
    // GET /api/dashboard/carrito y /recetas
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /dashboard/carrito devuelve 200 con disponible=false")
    void GET_dashboard_carrito_devuelve200_con_disponible_false() throws Exception {
        mockMvc.perform(get("/api/dashboard/carrito")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.disponible").value(false));
    }

    @Test
    @DisplayName("GET /dashboard/recetas devuelve 200 con disponible=false")
    void GET_dashboard_recetas_devuelve200_con_disponible_false() throws Exception {
        mockMvc.perform(get("/api/dashboard/recetas")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.disponible").value(false));
    }

    // -------------------------------------------------------------------------
    // Negativos — 401
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /dashboard devuelve 401 sin token")
    void GET_dashboard_devuelve401_sinToken() throws Exception {
        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /dashboard/resumen devuelve 401 sin token")
    void GET_dashboard_resumen_devuelve401_sinToken() throws Exception {
        mockMvc.perform(get("/api/dashboard/resumen"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /dashboard/alertas devuelve 401 sin token")
    void GET_dashboard_alertas_devuelve401_sinToken() throws Exception {
        mockMvc.perform(get("/api/dashboard/alertas"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /dashboard devuelve 401 con token inválido")
    void GET_dashboard_devuelve401_conTokenExpirado() throws Exception {
        mockMvc.perform(get("/api/dashboard")
                        .header("Authorization", "Bearer token.invalido.aqui"))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private String registrarYObtenerToken(String nombreUsuario, String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nombre", "Test User",
                                "nombreUsuario", nombreUsuario,
                                "email", email,
                                "password", "password123"
                        ))))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("token").asText();
    }

    private void añadirProducto(String tkn, String nombre, double cantidad, String unidad,
                                 String fechaCaducidad) throws Exception {
        mockMvc.perform(post("/api/despensa/productos")
                .header("Authorization", "Bearer " + tkn)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "nombre", nombre, "cantidad", cantidad,
                        "unidad", unidad, "fechaCaducidad", fechaCaducidad
                ))));
    }
}
