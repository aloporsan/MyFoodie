package com.myfoodie.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.myfoodie.domain.repository.DespensaRepository;
import com.myfoodie.domain.repository.ItemCarritoRepository;
import com.myfoodie.domain.repository.ListaCompraRepository;
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

import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("CarritoController — integración endpoints REST")
class CarritoControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ItemCarritoRepository itemCarritoRepository;
    @Autowired private ListaCompraRepository listaCompraRepository;
    @Autowired private DespensaRepository despensaRepository;
    @Autowired private ProductoRepository productoRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String tokenA;
    private String tokenB;

    @BeforeEach
    void setup() throws Exception {
        listaCompraRepository.deleteAll();
        itemCarritoRepository.deleteAll();
        productoRepository.deleteAll();
        despensaRepository.deleteAll();
        usuarioRepository.deleteAll();

        tokenA = registrarYObtenerToken("userA", "userA@test.com");
        tokenB = registrarYObtenerToken("userB", "userB@test.com");
    }

    // -------------------------------------------------------------------------
    // GET /api/carrito
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /carrito devuelve 200 con lista vacía y resumen en cero si no hay items")
    void GET_carrito_devuelve200_vacio() throws Exception {
        mockMvc.perform(get("/api/carrito").header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items").isEmpty())
                .andExpect(jsonPath("$.resumen.totalItems").value(0));
    }

    @Test
    @DisplayName("GET /carrito devuelve 401 sin token JWT")
    void GET_carrito_devuelve401_sinToken() throws Exception {
        mockMvc.perform(get("/api/carrito"))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------------------
    // POST /api/carrito/items
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("POST /items devuelve 201 con el item creado como pendiente")
    void POST_items_devuelve201_conDatosValidos() throws Exception {
        mockMvc.perform(post("/api/carrito/items")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(itemJson("Café", 1, "paquetes")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.nombre").value("Café"))
                .andExpect(jsonPath("$.estado").value("pendiente"));
    }

    @Test
    @DisplayName("POST /items devuelve 400 si el nombre está vacío")
    void POST_items_devuelve400_sinNombre() throws Exception {
        mockMvc.perform(post("/api/carrito/items")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(itemJson("", 1, "paquetes")))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /items devuelve 400 si la unidad está vacía")
    void POST_items_devuelve400_sinUnidad() throws Exception {
        mockMvc.perform(post("/api/carrito/items")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("nombre", "Café", "cantidad", 1))))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------
    // PUT /api/carrito/items/{id}/aceptar | rechazar | no-volver | recuperar
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("PUT /items/{id}/aceptar devuelve 200 y cambia el estado a 'aceptado'")
    void PUT_aceptar_devuelve200_yCambiaEstado() throws Exception {
        String itemId = añadirItemYObtenerId(tokenA, "Leche", 2, "litros");

        mockMvc.perform(put("/api/carrito/items/" + itemId + "/aceptar")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("aceptado"));
    }

    @Test
    @DisplayName("PUT /items/{id}/rechazar devuelve 200 y cambia el estado a 'rechazado'")
    void PUT_rechazar_devuelve200_yCambiaEstado() throws Exception {
        String itemId = añadirItemYObtenerId(tokenA, "Leche", 2, "litros");

        mockMvc.perform(put("/api/carrito/items/" + itemId + "/rechazar")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("rechazado"));
    }

    @Test
    @DisplayName("PUT /items/{id}/no-volver devuelve 200, marca noVolver=true y rechaza el item")
    void PUT_noVolver_devuelve200_yMarcaNoVolver() throws Exception {
        String itemId = añadirItemYObtenerId(tokenA, "Leche", 2, "litros");

        mockMvc.perform(put("/api/carrito/items/" + itemId + "/no-volver")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("rechazado"))
                .andExpect(jsonPath("$.noVolver").value(true));
    }

    @Test
    @DisplayName("PUT /items/{id}/recuperar devuelve 200 y vuelve el item a 'pendiente'")
    void PUT_recuperar_devuelve200_yVuelveAPendiente() throws Exception {
        String itemId = añadirItemYObtenerId(tokenA, "Leche", 2, "litros");
        mockMvc.perform(put("/api/carrito/items/" + itemId + "/rechazar")
                .header("Authorization", "Bearer " + tokenA));

        mockMvc.perform(put("/api/carrito/items/" + itemId + "/recuperar")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("pendiente"));
    }

    @Test
    @DisplayName("PUT /items/{id}/aceptar devuelve 403 si el item pertenece a otro usuario")
    void PUT_aceptar_devuelve403_siNoEsPropietario() throws Exception {
        String itemId = añadirItemYObtenerId(tokenA, "Leche", 2, "litros");

        mockMvc.perform(put("/api/carrito/items/" + itemId + "/aceptar")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());
    }

    // -------------------------------------------------------------------------
    // PUT /api/carrito/items/{id}/cantidad
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("PUT /items/{id}/cantidad devuelve 200 con la nueva cantidad y unidad")
    void PUT_cantidad_devuelve200_conNuevaCantidadYUnidad() throws Exception {
        String itemId = añadirItemYObtenerId(tokenA, "Harina", 1, "kg");

        mockMvc.perform(put("/api/carrito/items/" + itemId + "/cantidad")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("cantidad", 500, "unidad", "g"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cantidad").value(500))
                .andExpect(jsonPath("$.unidad").value("g"));
    }

    @Test
    @DisplayName("PUT /items/{id}/cantidad devuelve 400 si la cantidad es negativa")
    void PUT_cantidad_devuelve400_conCantidadNegativa() throws Exception {
        String itemId = añadirItemYObtenerId(tokenA, "Harina", 1, "kg");

        mockMvc.perform(put("/api/carrito/items/" + itemId + "/cantidad")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("cantidad", -1))))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------
    // DELETE /api/carrito/items/{id}
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("DELETE /items/{id} devuelve 204 y el item desaparece del carrito")
    void DELETE_item_devuelve204_yDesaparece() throws Exception {
        String itemId = añadirItemYObtenerId(tokenA, "Sal", 1, "paquetes");

        mockMvc.perform(delete("/api/carrito/items/" + itemId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/carrito").header("Authorization", "Bearer " + tokenA))
                .andExpect(jsonPath("$.items").isEmpty());
    }

    // -------------------------------------------------------------------------
    // POST /api/carrito/lista
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("POST /lista devuelve 201 con los items aceptados y archiva la lista activa previa")
    void POST_lista_devuelve201_yArchivaListaActivaPrevia() throws Exception {
        String item1 = añadirItemYObtenerId(tokenA, "Leche", 2, "litros");
        aceptarItem(tokenA, item1);
        MvcResult primera = mockMvc.perform(post("/api/carrito/lista")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("activa"))
                .andReturn();
        String primeraId = idDe(primera);

        String item2 = añadirItemYObtenerId(tokenA, "Pasta", 1, "kg");
        aceptarItem(tokenA, item2);
        mockMvc.perform(post("/api/carrito/lista")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("nombre", "Compra semanal"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre").value("Compra semanal"))
                .andExpect(jsonPath("$.estado").value("activa"));

        mockMvc.perform(get("/api/carrito/listas/" + primeraId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(jsonPath("$.estado").value("archivada"));
    }

    @Test
    @DisplayName("POST /lista devuelve 400 si no hay items aceptados")
    void POST_lista_devuelve400_siNoHayAceptados() throws Exception {
        mockMvc.perform(post("/api/carrito/lista")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------
    // GET /api/carrito/listas | /listas/activa | /listas/{id}
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /listas devuelve 200 con las listas generadas por el usuario")
    void GET_listas_devuelve200_conListasGeneradas() throws Exception {
        generarListaConUnItemAceptado(tokenA, "Leche");

        mockMvc.perform(get("/api/carrito/listas").header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @DisplayName("GET /listas/activa devuelve 204 si el usuario no tiene ninguna lista activa")
    void GET_listaActiva_devuelve204_siNoHayNinguna() throws Exception {
        mockMvc.perform(get("/api/carrito/listas/activa").header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("GET /listas/activa devuelve 200 con la lista activa cuando existe")
    void GET_listaActiva_devuelve200_conLaListaActiva() throws Exception {
        generarListaConUnItemAceptado(tokenA, "Leche");

        mockMvc.perform(get("/api/carrito/listas/activa").header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("activa"));
    }

    @Test
    @DisplayName("GET /listas/{id} devuelve 403 si la lista pertenece a otro usuario")
    void GET_lista_devuelve403_siNoEsPropietario() throws Exception {
        String listaId = generarListaConUnItemAceptado(tokenA, "Leche");

        mockMvc.perform(get("/api/carrito/listas/" + listaId).header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());
    }

    // -------------------------------------------------------------------------
    // PUT /api/carrito/listas/{id}/items/{itemId}/comprado
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("PUT /listas/{id}/items/{itemId}/comprado devuelve 200 y marca el item como comprado")
    void PUT_comprado_devuelve200_yMarcaComoComprado() throws Exception {
        String itemId = añadirItemYObtenerId(tokenA, "Leche", 2, "litros");
        aceptarItem(tokenA, itemId);
        MvcResult listaResult = mockMvc.perform(post("/api/carrito/lista")
                        .header("Authorization", "Bearer " + tokenA))
                .andReturn();
        String listaId = idDe(listaResult);

        mockMvc.perform(put("/api/carrito/listas/" + listaId + "/items/" + itemId + "/comprado")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("comprado"));
    }

    // -------------------------------------------------------------------------
    // POST /api/carrito/listas/{id}/añadir-despensa
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("POST /listas/{id}/añadir-despensa devuelve 200, completa la lista y libera la lista en curso")
    void POST_añadirDespensa_devuelve200_yCompletaLaLista() throws Exception {
        String itemId = añadirItemYObtenerId(tokenA, "Leche", 2, "litros");
        aceptarItem(tokenA, itemId);
        MvcResult listaResult = mockMvc.perform(post("/api/carrito/lista")
                        .header("Authorization", "Bearer " + tokenA))
                .andReturn();
        String listaId = idDe(listaResult);

        mockMvc.perform(put("/api/carrito/listas/" + listaId + "/items/" + itemId + "/comprado")
                .header("Authorization", "Bearer " + tokenA));

        mockMvc.perform(post("/api/carrito/listas/" + listaId + "/añadir-despensa")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lista.estado").value("completada"));

        mockMvc.perform(get("/api/carrito/listas/activa").header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/despensa/productos").header("Authorization", "Bearer " + tokenA))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nombre").value("Leche"));
    }

    @Test
    @DisplayName("POST /listas/{id}/añadir-despensa devuelve 400 si la lista no tiene productos comprados")
    void POST_añadirDespensa_devuelve400_siNoHayComprados() throws Exception {
        String itemId = añadirItemYObtenerId(tokenA, "Leche", 2, "litros");
        aceptarItem(tokenA, itemId);
        MvcResult listaResult = mockMvc.perform(post("/api/carrito/lista")
                        .header("Authorization", "Bearer " + tokenA))
                .andReturn();
        String listaId = idDe(listaResult);

        mockMvc.perform(post("/api/carrito/listas/" + listaId + "/añadir-despensa")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isBadRequest());
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

    private String itemJson(String nombre, double cantidad, String unidad) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "nombre", nombre, "cantidad", cantidad, "unidad", unidad));
    }

    private String añadirItemYObtenerId(String token, String nombre, double cantidad, String unidad) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/carrito/items")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(itemJson(nombre, cantidad, unidad)))
                .andReturn();
        return idDe(result);
    }

    private void aceptarItem(String token, String itemId) throws Exception {
        mockMvc.perform(put("/api/carrito/items/" + itemId + "/aceptar")
                .header("Authorization", "Bearer " + token));
    }

    private String generarListaConUnItemAceptado(String token, String nombreProducto) throws Exception {
        String itemId = añadirItemYObtenerId(token, nombreProducto, 1, "unidades");
        aceptarItem(token, itemId);
        MvcResult result = mockMvc.perform(post("/api/carrito/lista")
                        .header("Authorization", "Bearer " + token))
                .andReturn();
        return idDe(result);
    }

    private String idDe(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }
}
