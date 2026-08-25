package com.myfoodie.application.service;

import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import com.myfoodie.application.dto.matching.MatchProductoDTO;
import com.myfoodie.application.dto.ocr.ProductoTicketDTO;
import com.myfoodie.application.dto.ocr.ResultadoOCRDTO;
import com.myfoodie.domain.model.TipoMatch;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("OCRService — parseo de líneas de ticket y matching contra la despensa")
class OCRServiceTest {

    @Mock private MatchingService matchingService;

    @InjectMocks private OCRService ocrService;

    private ProductoResponseDTO producto(String id, String nombre) {
        return new ProductoResponseDTO(
                id, "despensa-1", nombre, 1, "unidad", null, null,
                null, null, null, null, null, false, "normal", null, null, null, null);
    }

    // -------------------------------------------------------------------------
    // procesarTextoTicket
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("procesarTextoTicket de texto null o vacío devuelve lista vacía")
    void procesarTextoTicket_texto_vacio_devuelve_lista_vacia() {
        assertThat(ocrService.procesarTextoTicket(null)).isEmpty();
        assertThat(ocrService.procesarTextoTicket("")).isEmpty();
        assertThat(ocrService.procesarTextoTicket("   ")).isEmpty();
    }

    @Test
    @DisplayName("procesarTextoTicket descarta líneas de metadatos del ticket (IVA, total, bolsa...)")
    void procesarTextoTicket_descarta_lineas_de_metadatos() {
        String texto = String.join("\n",
                "SUPERMERCADO EJEMPLO",
                "TOTAL 12,50",
                "IVA INCLUIDO",
                "GRACIAS POR SU COMPRA",
                "BOLSA PLASTICO 0,15",
                "TOMATE FRITO");

        List<ProductoTicketDTO> productos = ocrService.procesarTextoTicket(texto);

        assertThat(productos).extracting(ProductoTicketDTO::nombreDetectado)
                .containsExactly("SUPERMERCADO EJEMPLO", "TOMATE FRITO");
    }

    @Test
    @DisplayName("procesarTextoTicket descarta líneas demasiado cortas o solo numéricas")
    void procesarTextoTicket_descarta_lineas_cortas_o_numericas() {
        String texto = String.join("\n", "1,50", "€€", "AB", "YOGUR NATURAL");

        List<ProductoTicketDTO> productos = ocrService.procesarTextoTicket(texto);

        assertThat(productos).extracting(ProductoTicketDTO::nombreDetectado)
                .containsExactly("YOGUR NATURAL");
    }

    @Test
    @DisplayName("procesarTextoTicket detecta cantidad con multiplicador 'N x'")
    void procesarTextoTicket_detecta_cantidad_multiplicador() {
        List<ProductoTicketDTO> productos = ocrService.procesarTextoTicket("2 x TOMATE FRITO 3,00");

        assertThat(productos).hasSize(1);
        ProductoTicketDTO producto = productos.get(0);
        assertThat(producto.cantidadDetectada()).isEqualTo(2f);
        assertThat(producto.nombreDetectado()).isEqualTo("TOMATE FRITO");
    }

    @Test
    @DisplayName("procesarTextoTicket detecta cantidad con unidades 'UD'/'UN'")
    void procesarTextoTicket_detecta_cantidad_con_unidades() {
        List<ProductoTicketDTO> productos = ocrService.procesarTextoTicket("3 UD YOGUR NATURAL");

        assertThat(productos).hasSize(1);
        assertThat(productos.get(0).cantidadDetectada()).isEqualTo(3f);
        assertThat(productos.get(0).nombreDetectado()).isEqualTo("YOGUR NATURAL");
    }

    @Test
    @DisplayName("procesarTextoTicket detecta cantidad suelta al principio sin 'x' ni 'UD'")
    void procesarTextoTicket_detecta_cantidad_inicial_suelta() {
        List<ProductoTicketDTO> productos = ocrService.procesarTextoTicket("2 TOMATE FRITO");

        assertThat(productos).hasSize(1);
        assertThat(productos.get(0).cantidadDetectada()).isEqualTo(2f);
        assertThat(productos.get(0).nombreDetectado()).isEqualTo("TOMATE FRITO");
    }

    @Test
    @DisplayName("procesarTextoTicket no confunde un código de producto largo con una cantidad")
    void procesarTextoTicket_elimina_codigo_de_producto() {
        List<ProductoTicketDTO> productos = ocrService.procesarTextoTicket("1234567 LECHE ENTERA");

        assertThat(productos).hasSize(1);
        assertThat(productos.get(0).cantidadDetectada()).isNull();
        assertThat(productos.get(0).nombreDetectado()).isEqualTo("LECHE ENTERA");
    }

    @Test
    @DisplayName("procesarTextoTicket detecta la unidad de medida embebida y quita el precio final")
    void procesarTextoTicket_detecta_unidad_medida_y_quita_precio() {
        List<ProductoTicketDTO> productos = ocrService.procesarTextoTicket("COCA COLA 2L 1,80");

        assertThat(productos).hasSize(1);
        ProductoTicketDTO producto = productos.get(0);
        assertThat(producto.unidadDetectada()).isEqualTo("l");
        assertThat(producto.nombreDetectado()).isEqualTo("COCA COLA");
    }

    @Test
    @DisplayName("procesarTextoTicket conserva la línea original tal cual venía del OCR")
    void procesarTextoTicket_conserva_linea_original() {
        List<ProductoTicketDTO> productos = ocrService.procesarTextoTicket("  Tomate Frito  ");

        assertThat(productos).hasSize(1);
        assertThat(productos.get(0).lineaOriginal()).isEqualTo("  Tomate Frito  ");
    }

    // -------------------------------------------------------------------------
    // procesarProductosTicket
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("procesarProductosTicket fusiona líneas duplicadas del mismo ticket sumando cantidades")
    void procesarProductosTicket_fusiona_lineas_duplicadas() {
        List<ProductoTicketDTO> detectados = List.of(
                new ProductoTicketDTO("Cerveza", 6f, null, "6 CERVEZA"),
                new ProductoTicketDTO("cerveza", 6f, null, "6 CERVEZA"));

        when(matchingService.productosDeDespensa("user-1")).thenReturn(List.of());
        when(matchingService.umbralGlobal("user-1")).thenReturn(1);
        when(matchingService.aplicarSinonimos(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(matchingService.normalizar("Cerveza")).thenReturn("cerveza");
        when(matchingService.normalizar("cerveza")).thenReturn("cerveza");
        when(matchingService.buscarProductoSimilarEnDespensa(anyList(), anyInt(), anyString()))
                .thenReturn(List.of());

        List<ResultadoOCRDTO> resultados = ocrService.procesarProductosTicket("user-1", detectados);

        assertThat(resultados).hasSize(1);
        assertThat(resultados.get(0).productoTicket().cantidadDetectada()).isEqualTo(12f);
        verify(matchingService, times(1))
                .buscarProductoSimilarEnDespensa(anyList(), anyInt(), anyString());
    }

    @Test
    @DisplayName("procesarProductosTicket no fusiona productos con nombres distintos")
    void procesarProductosTicket_no_fusiona_productos_distintos() {
        List<ProductoTicketDTO> detectados = List.of(
                new ProductoTicketDTO("Tomate", 1f, null, "TOMATE"),
                new ProductoTicketDTO("Cebolla", 1f, null, "CEBOLLA"));

        when(matchingService.productosDeDespensa("user-1")).thenReturn(List.of());
        when(matchingService.umbralGlobal("user-1")).thenReturn(1);
        when(matchingService.aplicarSinonimos(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(matchingService.normalizar("Tomate")).thenReturn("tomate");
        when(matchingService.normalizar("Cebolla")).thenReturn("cebolla");
        when(matchingService.buscarProductoSimilarEnDespensa(anyList(), anyInt(), anyString()))
                .thenReturn(List.of());

        List<ResultadoOCRDTO> resultados = ocrService.procesarProductosTicket("user-1", detectados);

        assertThat(resultados).hasSize(2);
    }

    @Test
    @DisplayName("procesarProductosTicket marca 'nuevo' cuando no hay ningún match en la despensa")
    void procesarProductosTicket_sin_match_marca_nuevo() {
        List<ProductoTicketDTO> detectados = List.of(new ProductoTicketDTO("Piña", 1f, null, "PIÑA"));

        when(matchingService.productosDeDespensa("user-1")).thenReturn(List.of());
        when(matchingService.umbralGlobal("user-1")).thenReturn(1);
        when(matchingService.aplicarSinonimos(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(matchingService.normalizar("Piña")).thenReturn("pina");
        when(matchingService.buscarProductoSimilarEnDespensa(anyList(), anyInt(), eq("Piña")))
                .thenReturn(List.of());

        List<ResultadoOCRDTO> resultados = ocrService.procesarProductosTicket("user-1", detectados);

        assertThat(resultados).hasSize(1);
        assertThat(resultados.get(0).accion()).isEqualTo("nuevo");
        assertThat(resultados.get(0).productoExistente()).isNull();
    }

    @Test
    @DisplayName("procesarProductosTicket marca 'actualizado' cuando el mejor match es AUTOMATICO")
    void procesarProductosTicket_match_automatico_marca_actualizado() {
        List<ProductoTicketDTO> detectados = List.of(new ProductoTicketDTO("Tomate", 1f, null, "TOMATE"));
        ProductoResponseDTO existente = producto("prod-1", "Tomate");
        MatchProductoDTO match = new MatchProductoDTO(existente, 0.95, TipoMatch.AUTOMATICO, "¿Es lo mismo?");

        when(matchingService.productosDeDespensa("user-1")).thenReturn(List.of());
        when(matchingService.umbralGlobal("user-1")).thenReturn(1);
        when(matchingService.aplicarSinonimos(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(matchingService.normalizar("Tomate")).thenReturn("tomate");
        when(matchingService.buscarProductoSimilarEnDespensa(anyList(), anyInt(), eq("Tomate")))
                .thenReturn(List.of(match));

        List<ResultadoOCRDTO> resultados = ocrService.procesarProductosTicket("user-1", detectados);

        assertThat(resultados).hasSize(1);
        assertThat(resultados.get(0).accion()).isEqualTo("actualizado");
        assertThat(resultados.get(0).productoExistente()).isEqualTo(existente);
    }

    @Test
    @DisplayName("procesarProductosTicket marca 'sugerencia' cuando el mejor match es PROPONER")
    void procesarProductosTicket_match_proponer_marca_sugerencia() {
        List<ProductoTicketDTO> detectados = List.of(new ProductoTicketDTO("Tomate ensalada", 1f, null, "TOMATE ENSALADA"));
        ProductoResponseDTO existente = producto("prod-1", "Tomate");
        MatchProductoDTO match = new MatchProductoDTO(existente, 0.70, TipoMatch.PROPONER, "¿Es lo mismo que 'Tomate'?");

        when(matchingService.productosDeDespensa("user-1")).thenReturn(List.of());
        when(matchingService.umbralGlobal("user-1")).thenReturn(1);
        when(matchingService.aplicarSinonimos(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(matchingService.normalizar("Tomate ensalada")).thenReturn("tomate ensalada");
        when(matchingService.buscarProductoSimilarEnDespensa(anyList(), anyInt(), eq("Tomate ensalada")))
                .thenReturn(List.of(match));

        List<ResultadoOCRDTO> resultados = ocrService.procesarProductosTicket("user-1", detectados);

        assertThat(resultados).hasSize(1);
        assertThat(resultados.get(0).accion()).isEqualTo("sugerencia");
        assertThat(resultados.get(0).mensajeSugerencia()).isEqualTo("¿Es lo mismo que 'Tomate'?");
    }
}
