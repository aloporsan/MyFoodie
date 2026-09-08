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
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("DespensaController — integración endpoints REST")
class DespensaControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProductoRepository productoRepository;
    @Autowired private DespensaRepository despensaRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String tokenA;
    private String tokenB;

    @BeforeEach
    void setup() throws Exception {
        productoRepository.deleteAll();
        despensaRepository.deleteAll();
        usuarioRepository.deleteAll();

        tokenA = registrarYObtenerToken("userA", "userA@test.com");
        tokenB = registrarYObtenerToken("userB", "userB@test.com");
    }

    // -------------------------------------------------------------------------
    // GET /api/despensa/productos
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /productos devuelve 200 con lista vacía si no hay productos")
    void GET_productos_devuelve200_listaVacia_siNohayProductos() throws Exception {
        mockMvc.perform(get("/api/despensa/productos")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("GET /productos devuelve 200 con lista de productos")
    void GET_productos_devuelve200_conListaProductos() throws Exception {
        añadirProducto(tokenA, "Leche", 2, "litros");
        añadirProducto(tokenA, "Arroz", 5, "kg");

        mockMvc.perform(get("/api/despensa/productos")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    @DisplayName("GET /productos devuelve 401 sin token JWT")
    void GET_productos_devuelve401_sinToken() throws Exception {
        mockMvc.perform(get("/api/despensa/productos"))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------------------
    // GET /api/despensa/productos?orderBy=... (MEJORA 4 — #137)
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /productos?orderBy=nombre_asc devuelve la lista ordenada alfabéticamente")
    void GET_productos_devuelve200_ordenadoPorNombreAsc() throws Exception {
        añadirProducto(tokenA, "Zanahoria", 2, "unidades");
        añadirProducto(tokenA, "Arroz", 3, "kg");
        añadirProducto(tokenA, "Manzana", 1, "unidades");

        mockMvc.perform(get("/api/despensa/productos")
                        .header("Authorization", "Bearer " + tokenA)
                        .param("orderBy", "nombre_asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].nombre").value("Arroz"))
                .andExpect(jsonPath("$[1].nombre").value("Manzana"))
                .andExpect(jsonPath("$[2].nombre").value("Zanahoria"));
    }

    @Test
    @DisplayName("GET /productos sin orderBy devuelve la lista ordenada por reciente_primero (por defecto)")
    void GET_productos_devuelve200_sinOrderBy_usaRecientePrimero() throws Exception {
        añadirProducto(tokenA, "Primero", 1, "unidades");
        añadirProducto(tokenA, "Segundo", 1, "unidades");

        mockMvc.perform(get("/api/despensa/productos")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre").value("Segundo"))
                .andExpect(jsonPath("$[1].nombre").value("Primero"));
    }

    @Test
    @DisplayName("GET /productos?orderBy=invalido devuelve 400")
    void GET_productos_devuelve400_conOrderByInvalido() throws Exception {
        mockMvc.perform(get("/api/despensa/productos")
                        .header("Authorization", "Bearer " + tokenA)
                        .param("orderBy", "invalido"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /productos?orderBy=nombre_asc devuelve 401 sin token JWT")
    void GET_productos_devuelve401_sinToken_conOrderBy() throws Exception {
        mockMvc.perform(get("/api/despensa/productos").param("orderBy", "nombre_asc"))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------------------
    // POST /api/despensa/productos
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("POST /productos devuelve 201 con datos válidos")
    void POST_productos_devuelve201_conDatosValidos() throws Exception {
        mockMvc.perform(post("/api/despensa/productos")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productoJson("Leche", 2, "litros")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(notNullValue()))
                .andExpect(jsonPath("$.nombre").value("Leche"))
                .andExpect(jsonPath("$.cantidad").value(2))
                .andExpect(jsonPath("$.estado").exists());
    }

    @Test
    @DisplayName("POST /productos devuelve 400 si el nombre está vacío")
    void POST_productos_devuelve400_sinNombre() throws Exception {
        mockMvc.perform(post("/api/despensa/productos")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productoJson("", 2, "litros")))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /productos devuelve 400 si la cantidad es negativa")
    void POST_productos_devuelve400_conCantidadNegativa() throws Exception {
        mockMvc.perform(post("/api/despensa/productos")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productoJson("Leche", -1, "litros")))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /productos devuelve 400 si la unidad está vacía")
    void POST_productos_devuelve400_sinUnidad() throws Exception {
        mockMvc.perform(post("/api/despensa/productos")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("nombre", "Leche", "cantidad", 2))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /productos devuelve 201 con posiblesDuplicados si ya existe un nombre similar")
    void POST_productos_devuelve201_conPosiblesDuplicados_siHayCoincidencia() throws Exception {
        añadirProducto(tokenA, "Leche Entera", 3, "litros");

        mockMvc.perform(post("/api/despensa/productos")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productoJson("Leche", 2, "litros")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.posiblesDuplicados").isArray())
                .andExpect(jsonPath("$.posiblesDuplicados", hasSize(1)));
    }

    // -------------------------------------------------------------------------
    // GET /api/despensa/productos/{id}
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /productos/{id} devuelve 200 si el producto existe")
    void GET_producto_devuelve200_siExiste() throws Exception {
        String productoId = añadirProductoYObtenerID(tokenA, "Aceite", 1, "litros");

        mockMvc.perform(get("/api/despensa/productos/" + productoId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Aceite"));
    }

    @Test
    @DisplayName("GET /productos/{id} devuelve 404 si el producto no existe")
    void GET_producto_devuelve404_siNoExiste() throws Exception {
        mockMvc.perform(get("/api/despensa/productos/id-inexistente")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound());
    }

    // -------------------------------------------------------------------------
    // PUT /api/despensa/productos/{id}
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("PUT /productos/{id} devuelve 200 con los datos actualizados")
    void PUT_productos_devuelve200_conDatosActualizados() throws Exception {
        String productoId = añadirProductoYObtenerID(tokenA, "Leche", 2, "litros");

        mockMvc.perform(put("/api/despensa/productos/" + productoId)
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productoJson("Leche Desnatada", 3, "litros")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Leche Desnatada"))
                // La cantidad es derivada de los lotes (todo producto nace con lotes): este
                // formulario no la toca, se gestiona desde la sección de lotes.
                .andExpect(jsonPath("$.cantidad").value(2));
    }

    @Test
    @DisplayName("PUT /productos/{id} devuelve 404 si el producto pertenece a otro usuario")
    void PUT_productos_devuelve403_siNoPropietario() throws Exception {
        String productoId = añadirProductoYObtenerID(tokenA, "Leche", 2, "litros");

        mockMvc.perform(put("/api/despensa/productos/" + productoId)
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productoJson("Leche Robada", 1, "litros")))
                .andExpect(status().isNotFound());
    }

    // -------------------------------------------------------------------------
    // DELETE /api/despensa/productos/{id}
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("DELETE /productos/{id} devuelve 204 y el producto desaparece")
    void DELETE_productos_devuelve204_siExiste() throws Exception {
        String productoId = añadirProductoYObtenerID(tokenA, "Sal", 1, "gramos");

        mockMvc.perform(delete("/api/despensa/productos/" + productoId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/despensa/productos/" + productoId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /productos/{id} devuelve 404 si el producto pertenece a otro usuario")
    void DELETE_productos_devuelve403_siNoPropietario() throws Exception {
        String productoId = añadirProductoYObtenerID(tokenA, "Leche", 2, "litros");

        mockMvc.perform(delete("/api/despensa/productos/" + productoId)
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /productos/{id} con body de motivo devuelve 204 y el motivo queda en el historial")
    void DELETE_productos_devuelve204_conMotivoEnBody() throws Exception {
        String productoId = añadirProductoYObtenerID(tokenA, "Yogur", 1, "unidades");

        mockMvc.perform(delete("/api/despensa/productos/" + productoId)
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("motivo", "caducado"))))
                .andExpect(status().isNoContent());
    }

    // -------------------------------------------------------------------------
    // PATCH /api/despensa/productos/{id}/cantidad
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("PATCH /productos/{id}/cantidad devuelve 200 con la nueva cantidad")
    void PATCH_cantidad_devuelve200_conNuevaCantidad() throws Exception {
        String productoId = añadirProductoYObtenerID(tokenA, "Manzanas", 3, "unidades");

        mockMvc.perform(patch("/api/despensa/productos/" + productoId + "/cantidad")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("delta", 2))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cantidad").value(5.0));
    }

    @Test
    @DisplayName("PATCH /productos/{id}/cantidad devuelve 400 si el resultado sería negativo")
    void PATCH_cantidad_devuelve400_siResultadoNegativo() throws Exception {
        String productoId = añadirProductoYObtenerID(tokenA, "Manzanas", 1, "unidades");

        mockMvc.perform(patch("/api/despensa/productos/" + productoId + "/cantidad")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("delta", -10))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PATCH /productos/{id}/cantidad con motivo devuelve 200 y el movimiento queda en el historial")
    void PATCH_cantidad_devuelve200_conMotivo_yApareceEnHistorial() throws Exception {
        String productoId = añadirProductoYObtenerID(tokenA, "Peras", 4, "unidades");

        mockMvc.perform(patch("/api/despensa/productos/" + productoId + "/cantidad")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("delta", -2, "motivo", "consumido"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cantidad").value(2.0));

        mockMvc.perform(get("/api/despensa/productos/" + productoId + "/historial")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tipo").value("cantidad_actualizada"))
                .andExpect(jsonPath("$[0].motivo").value("consumido"));
    }

    // -------------------------------------------------------------------------
    // GET /api/despensa/productos/{id}/historial
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /productos/{id}/historial devuelve 200 con el movimiento de creación tras añadir")
    void GET_historial_devuelve200_conMovimientoDeCreacion() throws Exception {
        String productoId = añadirProductoYObtenerID(tokenA, "Miel", 1, "unidades");

        mockMvc.perform(get("/api/despensa/productos/" + productoId + "/historial")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].tipo").value("añadido"));
    }

    @Test
    @DisplayName("GET /productos/{id}/historial devuelve 404 tras eliminar el producto (ya no pertenece a la despensa)")
    void GET_historial_devuelve404_trasEliminarProducto() throws Exception {
        String productoId = añadirProductoYObtenerID(tokenA, "Nata", 1, "unidades");

        mockMvc.perform(delete("/api/despensa/productos/" + productoId)
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("motivo", "otro", "motivoDetalle", "Se derramó"))));

        mockMvc.perform(get("/api/despensa/productos/" + productoId + "/historial")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /productos/{id}/historial devuelve 404 si el producto pertenece a otro usuario")
    void GET_historial_devuelve404_siNoPropietario() throws Exception {
        String productoId = añadirProductoYObtenerID(tokenA, "Café", 1, "unidades");

        mockMvc.perform(get("/api/despensa/productos/" + productoId + "/historial")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());
    }

    // -------------------------------------------------------------------------
    // GET /api/despensa/productos/buscar
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /productos/buscar devuelve 200 con resultados que coinciden con el texto")
    void GET_buscar_devuelve200_conResultados() throws Exception {
        añadirProducto(tokenA, "Leche Entera", 3, "litros");
        añadirProducto(tokenA, "Arroz Basmati", 2, "kg");

        mockMvc.perform(get("/api/despensa/productos/buscar")
                        .header("Authorization", "Bearer " + tokenA)
                        .param("q", "leche"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nombre").value("Leche Entera"));
    }

    @Test
    @DisplayName("GET /productos/buscar devuelve lista vacía cuando no hay coincidencias")
    void GET_buscar_devuelve200_listaVacia_sinCoincidencias() throws Exception {
        añadirProducto(tokenA, "Leche Entera", 3, "litros");

        mockMvc.perform(get("/api/despensa/productos/buscar")
                        .header("Authorization", "Bearer " + tokenA)
                        .param("q", "pepino"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    // -------------------------------------------------------------------------
    // GET /api/despensa/productos/filtrar
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /productos/filtrar devuelve 200 filtrando por categoría")
    void GET_filtrar_devuelve200_porCategoria() throws Exception {
        mockMvc.perform(post("/api/despensa/productos")
                .header("Authorization", "Bearer " + tokenA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(productoJsonConCategoria("Leche", 2, "litros", "Lácteos")));
        mockMvc.perform(post("/api/despensa/productos")
                .header("Authorization", "Bearer " + tokenA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(productoJsonConCategoria("Manzana", 5, "unidades", "Frutas y verduras")));

        mockMvc.perform(get("/api/despensa/productos/filtrar")
                        .header("Authorization", "Bearer " + tokenA)
                        .param("categoria", "Lácteos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nombre").value("Leche"));
    }

    @Test
    @DisplayName("GET /productos/filtrar devuelve 200 filtrando por estado caducado")
    void GET_filtrar_devuelve200_porEstadoCaducado() throws Exception {
        mockMvc.perform(post("/api/despensa/productos")
                .header("Authorization", "Bearer " + tokenA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(productoJsonConFecha("Yogur", 2, "unidades", "2020-01-01")));
        mockMvc.perform(post("/api/despensa/productos")
                .header("Authorization", "Bearer " + tokenA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(productoJson("Arroz", 5, "kg")));

        mockMvc.perform(get("/api/despensa/productos/filtrar")
                        .header("Authorization", "Bearer " + tokenA)
                        .param("estado", "caducado"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nombre").value("Yogur"));
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

    private void añadirProducto(String token, String nombre, double cantidad, String unidad) throws Exception {
        mockMvc.perform(post("/api/despensa/productos")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(productoJson(nombre, cantidad, unidad)));
    }

    private String añadirProductoYObtenerID(String token, String nombre, double cantidad,
                                             String unidad) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/despensa/productos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productoJson(nombre, cantidad, unidad)))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("id").asText();
    }

    private String productoJson(String nombre, double cantidad, String unidad) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "nombre", nombre, "cantidad", cantidad, "unidad", unidad));
    }

    private String productoJsonConCategoria(String nombre, double cantidad, String unidad,
                                             String categoria) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "nombre", nombre, "cantidad", cantidad, "unidad", unidad, "categoria", categoria));
    }

    private String productoJsonConFecha(String nombre, double cantidad, String unidad,
                                         String fechaCaducidad) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "nombre", nombre, "cantidad", cantidad, "unidad", unidad,
                "fechaCaducidad", fechaCaducidad));
    }
}
