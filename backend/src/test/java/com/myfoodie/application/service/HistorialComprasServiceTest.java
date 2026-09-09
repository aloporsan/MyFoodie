package com.myfoodie.application.service;

import com.myfoodie.application.dto.historial.HistorialCompraDTO;
import com.myfoodie.domain.model.ListaCompra;
import com.myfoodie.domain.model.LoteProducto;
import com.myfoodie.domain.model.Producto;
import com.myfoodie.domain.repository.ItemCarritoRepository;
import com.myfoodie.domain.repository.ListaCompraRepository;
import com.myfoodie.domain.repository.LoteProductoRepository;
import com.myfoodie.domain.repository.ProductoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HistorialComprasServiceTest {

    private static final List<String> ESTADOS = List.of("completada", "archivada");

    @Mock private ListaCompraRepository listaCompraRepository;
    @Mock private ItemCarritoRepository itemCarritoRepository;
    @Mock private LoteProductoRepository loteProductoRepository;
    @Mock private ProductoRepository productoRepository;

    @InjectMocks
    private HistorialComprasService historialComprasService;

    private ListaCompra lista(String id, LocalDateTime updatedAt) {
        return ListaCompra.builder()
                .id(id)
                .usuarioId("user-1")
                .nombre("Compra " + id)
                .estado("completada")
                .items(List.of())
                .createdAt(updatedAt)
                .updatedAt(updatedAt)
                .build();
    }

    @Test
    void filtra_por_rango_de_fechas() {
        ListaCompra enero = lista("l-enero", LocalDateTime.of(2025, 1, 10, 12, 0));
        ListaCompra marzo = lista("l-marzo", LocalDateTime.of(2025, 3, 15, 12, 0));
        ListaCompra junio = lista("l-junio", LocalDateTime.of(2025, 6, 20, 12, 0));

        when(listaCompraRepository.findByUsuarioIdAndEstadoIn("user-1", ESTADOS))
                .thenReturn(List.of(enero, marzo, junio));
        when(loteProductoRepository.findByUsuarioIdAndOrigen("user-1", "ocr")).thenReturn(List.of());

        List<HistorialCompraDTO> resultado = historialComprasService.obtenerHistorialCompras(
                "user-1", LocalDate.of(2025, 3, 1), LocalDate.of(2025, 4, 30));

        assertThat(resultado).extracting(HistorialCompraDTO::id).containsExactly("l-marzo");
    }

    @Test
    void incluye_tickets_ocr_en_el_rango() {
        LoteProducto lote = LoteProducto.builder()
                .id("lote-1")
                .usuarioId("user-1")
                .productoId("prod-1")
                .origen("ocr")
                .fechaCompra(LocalDate.of(2025, 3, 12))
                .createdAt(LocalDateTime.of(2025, 3, 12, 18, 0))
                .build();

        when(listaCompraRepository.findByUsuarioIdAndEstadoIn("user-1", ESTADOS)).thenReturn(List.of());
        when(loteProductoRepository.findByUsuarioIdAndOrigen("user-1", "ocr")).thenReturn(List.of(lote));
        when(productoRepository.findAllById(any()))
                .thenReturn(List.of(Producto.builder().id("prod-1").nombre("Leche").build()));

        List<HistorialCompraDTO> resultado = historialComprasService.obtenerHistorialCompras(
                "user-1", LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31));

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).origen()).isEqualTo("ticket");
        assertThat(resultado.get(0).fecha()).isEqualTo(LocalDate.of(2025, 3, 12));
        assertThat(resultado.get(0).items()).containsExactly("Leche");
    }

    @Test
    void ticket_ocr_fuera_del_rango_se_excluye() {
        LoteProducto lote = LoteProducto.builder()
                .id("lote-2")
                .usuarioId("user-1")
                .productoId("prod-2")
                .origen("ocr")
                .fechaCompra(LocalDate.of(2025, 1, 5))
                .createdAt(LocalDateTime.of(2025, 1, 5, 10, 0))
                .build();

        when(listaCompraRepository.findByUsuarioIdAndEstadoIn("user-1", ESTADOS)).thenReturn(List.of());
        when(loteProductoRepository.findByUsuarioIdAndOrigen("user-1", "ocr")).thenReturn(List.of(lote));

        List<HistorialCompraDTO> resultado = historialComprasService.obtenerHistorialCompras(
                "user-1", LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31));

        assertThat(resultado).isEmpty();
    }
}
