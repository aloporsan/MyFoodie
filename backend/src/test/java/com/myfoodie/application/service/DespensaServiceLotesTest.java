package com.myfoodie.application.service;

import com.myfoodie.application.dto.despensa.ConsumoLoteDTO;
import com.myfoodie.application.dto.despensa.LoteProductoRequestDTO;
import com.myfoodie.application.dto.despensa.LoteProductoResponseDTO;
import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import com.myfoodie.application.dto.despensa.ProductoUpdateCantidadDTO;
import com.myfoodie.application.dto.unidad.UnidadConvertidaDTO;
import com.myfoodie.domain.model.CriterioFechaLote;
import com.myfoodie.domain.model.Despensa;
import com.myfoodie.domain.model.LoteProducto;
import com.myfoodie.domain.model.Producto;
import com.myfoodie.domain.repository.DespensaRepository;
import com.myfoodie.domain.repository.LoteProductoRepository;
import com.myfoodie.domain.repository.MovimientoProductoRepository;
import com.myfoodie.domain.repository.PreferenciasRepository;
import com.myfoodie.domain.repository.ProductoRepository;
import com.myfoodie.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// Cubre la gestión por lotes de DespensaService: activarLotes, añadir/editar/eliminar lote,
// el desglose de consumo FIFO (consumirStockFIFO) y compactarLotes. Nada de esto tenía test
// hasta ahora (arrastrado desde los bloques B3-B6 de matching-recetas-lotes); se cierra aquí,
// en el bloque final de tests, junto con las correcciones de esta misma rama.
@ExtendWith(MockitoExtension.class)
@DisplayName("DespensaService — gestión por lotes")
class DespensaServiceLotesTest {

    @Mock private DespensaRepository despensaRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private PreferenciasRepository preferenciasRepository;
    @Mock private MovimientoProductoRepository movimientoRepository;
    @Mock private LoteProductoRepository loteProductoRepository;
    @Mock private CarritoInteligenteService carritoInteligenteService;
    @Mock private UnidadNormalizadorService unidadNormalizadorService;
    @Mock private NotificacionService notificacionService;

    @InjectMocks private DespensaService despensaService;

    @BeforeEach
    void configurarNormalizadorPorDefecto() {
        lenient().when(unidadNormalizadorService.normalizarUnidades(anyDouble(), anyString()))
                .thenAnswer(inv -> new UnidadConvertidaDTO(inv.getArgument(0), inv.getArgument(1), false));
        lenient().when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(loteProductoRepository.save(any(LoteProducto.class))).thenAnswer(inv -> {
            LoteProducto lote = inv.getArgument(0);
            if (lote.getId() == null) lote.setId("lote-generado");
            return lote;
        });
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private Despensa despensa(String id, String usuarioId) {
        Despensa d = new Despensa();
        d.setId(id);
        d.setUsuarioId(usuarioId);
        return d;
    }

    private Producto producto(String id, double cantidad, LocalDate fechaCaducidad, boolean tieneLotes) {
        return Producto.builder()
                .id(id).despensaId("desp-1").nombre("Leche").cantidad(cantidad)
                .unidad("litros").fechaCaducidad(fechaCaducidad).tieneLotes(tieneLotes)
                .build();
    }

    private LoteProducto lote(String id, float cantidad, LocalDate fechaCaducidad) {
        return LoteProducto.builder()
                .id(id).productoId("prod-1").despensaId("desp-1").usuarioId("user-1")
                .cantidad(cantidad).unidad("litros").fechaCaducidad(fechaCaducidad)
                .fechaCompra(LocalDate.now()).origen("manual")
                .build();
    }

    private void stubProducto(Producto p) {
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(despensa("desp-1", "user-1")));
        when(productoRepository.findByDespensaIdAndId("desp-1", p.getId())).thenReturn(Optional.of(p));
    }

    // -------------------------------------------------------------------------
    // activarLotes
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("activarLotes envuelve el stock actual en un primer lote sin duplicar cantidad")
    void activarLotes_envuelveStockActualEnPrimerLote() {
        Producto p = producto("prod-1", 3, LocalDate.now().plusDays(5), false);
        stubProducto(p);

        LoteProductoResponseDTO resultado = despensaService.activarLotes("user-1", "prod-1");

        assertThat(resultado.cantidad()).isEqualTo(3f);
        assertThat(resultado.fechaCaducidad()).isEqualTo(p.getFechaCaducidad());
        assertThat(p.getTieneLotes()).isTrue();
        assertThat(p.getCantidad()).isEqualTo(3); // no se duplica: sigue siendo la misma cantidad
        verify(loteProductoRepository).save(any(LoteProducto.class));
    }

    @Test
    @DisplayName("activarLotes falla si el producto ya tiene lotes activados")
    void activarLotes_falla_siYaTieneLotes() {
        Producto p = producto("prod-1", 3, null, true);
        stubProducto(p);

        assertThatThrownBy(() -> despensaService.activarLotes("user-1", "prod-1"))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(loteProductoRepository, never()).save(any());
    }

    // -------------------------------------------------------------------------
    // añadirLote
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("añadirLote recalcula la cantidad del producto sumando todos sus lotes activos")
    void añadirLote_recalculaCantidadSumandoLotes() {
        Producto p = producto("prod-1", 0, null, false);
        stubProducto(p);
        when(loteProductoRepository.findByProductoIdAndCantidadGreaterThan("prod-1", 0f))
                .thenReturn(List.of(lote("lote-1", 2f, LocalDate.now().plusDays(10))));
        when(loteProductoRepository.sumCantidadByProductoId("prod-1")).thenReturn(2f);

        LoteProductoRequestDTO dto = new LoteProductoRequestDTO(2f, "litros", LocalDate.now().plusDays(10), null, "manual");
        despensaService.añadirLote("user-1", "prod-1", dto);

        assertThat(p.getTieneLotes()).isTrue();
        assertThat(p.getCantidad()).isEqualTo(2);
    }

    // -------------------------------------------------------------------------
    // consumirStockFIFO (vía actualizarCantidad con delta negativo)
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("restar cantidad con lotes consume del que caduca antes y devuelve el desglose")
    void consumirStockFIFO_consumeDelLoteQueCaducaAntes() {
        Producto p = producto("prod-1", 5, LocalDate.now().plusDays(3), true);
        stubProducto(p);
        LoteProducto proximo = lote("lote-1", 3f, LocalDate.now().plusDays(3));
        LoteProducto lejano = lote("lote-2", 2f, LocalDate.now().plusDays(20));
        when(loteProductoRepository.findByProductoIdOrderByFechaCaducidadAsc("prod-1"))
                .thenReturn(List.of(proximo, lejano));
        when(loteProductoRepository.findByProductoIdAndCantidadGreaterThan("prod-1", 0f))
                .thenReturn(List.of(lejano)); // tras consumir, "lote-1" queda a 0 (se borra) y solo queda "lote-2"

        ProductoResponseDTO resultado = despensaService.actualizarCantidad("user-1", "prod-1",
                new ProductoUpdateCantidadDTO(-3.0, null, null, null));

        assertThat(resultado.consumosFifo()).hasSize(1);
        ConsumoLoteDTO consumo = resultado.consumosFifo().get(0);
        assertThat(consumo.loteId()).isEqualTo("lote-1");
        assertThat(consumo.cantidadConsumida()).isEqualTo(3f);
        assertThat(consumo.loteEliminado()).isTrue();
        verify(loteProductoRepository).delete(proximo);
        verify(loteProductoRepository, never()).delete(lejano);
    }

    @Test
    @DisplayName("restar cantidad con lotes reparte el consumo entre varios lotes si el primero no basta")
    void consumirStockFIFO_repartaEntreVariosLotesSiHaceFalta() {
        Producto p = producto("prod-1", 5, LocalDate.now().plusDays(3), true);
        stubProducto(p);
        LoteProducto proximo = lote("lote-1", 2f, LocalDate.now().plusDays(3));
        LoteProducto lejano = lote("lote-2", 3f, LocalDate.now().plusDays(20));
        when(loteProductoRepository.findByProductoIdOrderByFechaCaducidadAsc("prod-1"))
                .thenReturn(List.of(proximo, lejano));
        when(loteProductoRepository.findByProductoIdAndCantidadGreaterThan("prod-1", 0f))
                .thenReturn(List.of(lejano));

        ProductoResponseDTO resultado = despensaService.actualizarCantidad("user-1", "prod-1",
                new ProductoUpdateCantidadDTO(-4.0, null, null, null));

        assertThat(resultado.consumosFifo()).hasSize(2);
        assertThat(resultado.consumosFifo().get(0).loteId()).isEqualTo("lote-1");
        assertThat(resultado.consumosFifo().get(0).cantidadConsumida()).isEqualTo(2f);
        assertThat(resultado.consumosFifo().get(0).loteEliminado()).isTrue();
        assertThat(resultado.consumosFifo().get(1).loteId()).isEqualTo("lote-2");
        assertThat(resultado.consumosFifo().get(1).cantidadConsumida()).isEqualTo(2f);
        assertThat(resultado.consumosFifo().get(1).cantidadRestante()).isEqualTo(1f);
        assertThat(resultado.consumosFifo().get(1).loteEliminado()).isFalse();
    }

    @Test
    @DisplayName("restar más cantidad de la disponible en lotes lanza BAD_REQUEST sin tocar nada")
    void consumirStockFIFO_falla_siPideMasDeLoDisponible() {
        Producto p = producto("prod-1", 2, LocalDate.now().plusDays(3), true);
        stubProducto(p);
        when(loteProductoRepository.findByProductoIdOrderByFechaCaducidadAsc("prod-1"))
                .thenReturn(List.of(lote("lote-1", 2f, LocalDate.now().plusDays(3))));

        assertThatThrownBy(() -> despensaService.actualizarCantidad("user-1", "prod-1",
                new ProductoUpdateCantidadDTO(-5.0, null, null, null)))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(loteProductoRepository, never()).delete(any());
        verify(loteProductoRepository, never()).save(any());
    }

    @Test
    @DisplayName("sumar cantidad en un producto con lotes va a un lote existente, no al descuento FIFO")
    void actualizarCantidad_conDeltaPositivo_noUsaFIFO() {
        Producto p = producto("prod-1", 2, LocalDate.now().plusDays(3), true);
        stubProducto(p);
        LoteProducto loteExistente = lote("lote-1", 2f, LocalDate.now().plusDays(3));
        when(loteProductoRepository.findByProductoIdOrderByFechaCaducidadAsc("prod-1"))
                .thenReturn(List.of(loteExistente));
        when(loteProductoRepository.findByProductoIdAndCantidadGreaterThan("prod-1", 0f))
                .thenReturn(List.of(loteExistente));
        when(loteProductoRepository.sumCantidadByProductoId("prod-1")).thenReturn(3f);

        ProductoResponseDTO resultado = despensaService.actualizarCantidad("user-1", "prod-1",
                new ProductoUpdateCantidadDTO(1.0, null, null, null));

        assertThat(resultado.cantidad()).isEqualTo(3);
        assertThat(resultado.consumosFifo()).isNull();
        // El +1 se suma al lote menos urgente; nunca dispara consumo/borrado FIFO.
        assertThat(loteExistente.getCantidad()).isEqualTo(3f);
        verify(loteProductoRepository, never()).delete(any());
    }

    // -------------------------------------------------------------------------
    // compactarLotes
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("compactarLotes fusiona todos los lotes activos en uno con la fecha más próxima")
    void compactarLotes_masTemprana_sumaYUsaFechaMasProxima() {
        Producto p = producto("prod-1", 5, null, true);
        stubProducto(p);
        LocalDate fechaProxima = LocalDate.now().plusDays(2);
        LocalDate fechaLejana = LocalDate.now().plusDays(30);
        LoteProducto a = lote("lote-1", 2f, fechaProxima);
        LoteProducto b = lote("lote-2", 3f, fechaLejana);
        when(loteProductoRepository.findByProductoIdAndCantidadGreaterThan("prod-1", 0f))
                .thenReturn(List.of(a, b));

        LoteProductoResponseDTO resultado = despensaService.compactarLotes("user-1", "prod-1", CriterioFechaLote.MAS_TEMPRANA);

        assertThat(resultado.cantidad()).isEqualTo(5f);
        assertThat(resultado.fechaCaducidad()).isEqualTo(fechaProxima);
        verify(loteProductoRepository).deleteAll(List.of(a, b));
    }

    @Test
    @DisplayName("compactarLotes con MAS_TARDIA usa la fecha más lejana de los lotes activos")
    void compactarLotes_masTardia_usaFechaMasLejana() {
        Producto p = producto("prod-1", 5, null, true);
        stubProducto(p);
        LocalDate fechaProxima = LocalDate.now().plusDays(2);
        LocalDate fechaLejana = LocalDate.now().plusDays(30);
        when(loteProductoRepository.findByProductoIdAndCantidadGreaterThan("prod-1", 0f))
                .thenReturn(List.of(lote("lote-1", 2f, fechaProxima), lote("lote-2", 3f, fechaLejana)));

        LoteProductoResponseDTO resultado = despensaService.compactarLotes("user-1", "prod-1", CriterioFechaLote.MAS_TARDIA);

        assertThat(resultado.fechaCaducidad()).isEqualTo(fechaLejana);
    }

    @Test
    @DisplayName("compactarLotes falla si el producto no tiene lotes activos")
    void compactarLotes_falla_siNoHayLotesActivos() {
        Producto p = producto("prod-1", 0, null, true);
        stubProducto(p);
        when(loteProductoRepository.findByProductoIdAndCantidadGreaterThan("prod-1", 0f)).thenReturn(List.of());

        assertThatThrownBy(() -> despensaService.compactarLotes("user-1", "prod-1", CriterioFechaLote.MAS_TEMPRANA))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    // -------------------------------------------------------------------------
    // editarLote / eliminarLote
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("editarLote recalcula la cantidad total del producto tras el cambio")
    void editarLote_recalculaCantidadDelProducto() {
        Producto p = producto("prod-1", 2, null, true);
        stubProducto(p);
        LoteProducto existente = lote("lote-1", 2f, LocalDate.now().plusDays(5));
        when(loteProductoRepository.findById("lote-1")).thenReturn(Optional.of(existente));
        when(loteProductoRepository.findByProductoIdAndCantidadGreaterThan("prod-1", 0f))
                .thenReturn(List.of(existente));
        when(loteProductoRepository.sumCantidadByProductoId("prod-1")).thenReturn(5f);

        LoteProductoRequestDTO dto = new LoteProductoRequestDTO(5f, "litros", LocalDate.now().plusDays(5), null, "manual");
        despensaService.editarLote("user-1", "prod-1", "lote-1", dto);

        assertThat(existente.getCantidad()).isEqualTo(5f);
        assertThat(p.getCantidad()).isEqualTo(5f);
    }

    @Test
    @DisplayName("eliminarLote de otro producto devuelve NOT_FOUND (lote no pertenece al producto)")
    void eliminarLote_deOtroProducto_devuelveNotFound() {
        Producto p = producto("prod-1", 2, null, true);
        stubProducto(p);
        LoteProducto deOtroProducto = LoteProducto.builder()
                .id("lote-ajeno").productoId("prod-OTRO").despensaId("desp-1").usuarioId("user-1")
                .cantidad(1f).unidad("litros").build();
        when(loteProductoRepository.findById("lote-ajeno")).thenReturn(Optional.of(deOtroProducto));

        assertThatThrownBy(() -> despensaService.eliminarLote("user-1", "prod-1", "lote-ajeno"))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        verify(loteProductoRepository, never()).delete(any());
    }
}
