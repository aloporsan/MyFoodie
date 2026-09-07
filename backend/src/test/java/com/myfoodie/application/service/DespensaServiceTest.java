package com.myfoodie.application.service;

import com.myfoodie.application.dto.despensa.EliminarProductoRequestDTO;
import com.myfoodie.application.dto.despensa.ProductoFiltroDTO;
import com.myfoodie.application.dto.despensa.ProductoRequestDTO;
import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import com.myfoodie.application.dto.despensa.ProductoUpdateCantidadDTO;
import com.myfoodie.application.dto.unidad.UnidadConvertidaDTO;
import com.myfoodie.domain.model.Despensa;
import com.myfoodie.domain.model.MovimientoProducto;
import com.myfoodie.domain.model.Preferencias;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("DespensaService — CRUD, búsqueda y filtrado")
class DespensaServiceTest {

    @Mock private DespensaRepository despensaRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private PreferenciasRepository preferenciasRepository;
    @Mock private MovimientoProductoRepository movimientoRepository;
    @Mock private LoteProductoRepository loteProductoRepository;
    @Mock private CarritoInteligenteService carritoInteligenteService;
    @Mock private UnidadNormalizadorService unidadNormalizadorService;
    @Mock private NotificacionService notificacionService;
    @Mock private MatchingService matchingService;

    @InjectMocks private DespensaService despensaService;

    // Por defecto, unidadNormalizadorService devuelve la cantidad/unidad tal cual (comportamiento
    // real para unidades ya objetivas, que es lo que usan la mayoría de los tests de este archivo).
    // matchingService.esPosibleDuplicado usa el algoritmo real (no depende de repositorios).
    @BeforeEach
    void configurarNormalizadorPorDefecto() {
        lenient().when(unidadNormalizadorService.normalizarUnidades(anyDouble(), anyString()))
                .thenAnswer(inv -> new UnidadConvertidaDTO(inv.getArgument(0), inv.getArgument(1), false));
        MatchingService matchingReal = new MatchingService(null, null, null, null, null);
        lenient().when(matchingService.esPosibleDuplicado(anyString(), anyString()))
                .thenAnswer(inv -> matchingReal.esPosibleDuplicado(inv.getArgument(0), inv.getArgument(1)));
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

    private Producto producto(String id, String despensaId, String nombre, double cantidad,
                              LocalDate fechaCaducidad) {
        return Producto.builder()
                .id(id)
                .despensaId(despensaId)
                .nombre(nombre)
                .cantidad(cantidad)
                .unidad("unidades")
                .fechaCaducidad(fechaCaducidad)
                .build();
    }

    private ProductoRequestDTO dto(String nombre, double cantidad) {
        return new ProductoRequestDTO(nombre, cantidad, "unidades", null, null, null, null, null, null);
    }

    private ProductoResponseDTO porNombre(List<ProductoResponseDTO> lista, String nombre) {
        return lista.stream()
                .filter(p -> p.nombre().equals(nombre))
                .findFirst()
                .orElseThrow(() -> new AssertionError("No se encontró el producto: " + nombre));
    }

    // -------------------------------------------------------------------------
    // añadirProducto — positivos
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("añadirProducto exitoso devuelve DTO con datos correctos y sin duplicados")
    void añadirProducto_exitoso_conDatosValidos() {
        Despensa d = despensa("desp-1", "user-1");
        Producto guardado = producto("prod-1", "desp-1", "Leche", 2, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of());
        when(productoRepository.save(any(Producto.class))).thenReturn(guardado);
        when(despensaRepository.save(any(Despensa.class))).thenReturn(d);

        ProductoResponseDTO resultado = despensaService.añadirProducto("user-1", dto("Leche", 2));

        assertThat(resultado.nombre()).isEqualTo("Leche");
        assertThat(resultado.cantidad()).isEqualTo(2);
        assertThat(resultado.posiblesDuplicados()).isNull();
    }

    @Test
    @DisplayName("añadirProducto devuelve posiblesDuplicados cuando existe nombre similar")
    void añadirProducto_devuelve_posiblesDuplicados_siExisteProductoSimilar() {
        Despensa d = despensa("desp-1", "user-1");
        Producto existente = producto("prod-0", "desp-1", "Leche Entera", 3, null);
        Producto nuevo = producto("prod-1", "desp-1", "Leche", 2, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(existente));
        when(productoRepository.save(any(Producto.class))).thenReturn(nuevo);
        when(despensaRepository.save(any(Despensa.class))).thenReturn(d);

        ProductoResponseDTO resultado = despensaService.añadirProducto("user-1", dto("Leche", 2));

        assertThat(resultado.posiblesDuplicados()).hasSize(1);
        assertThat(resultado.posiblesDuplicados().get(0).nombre()).isEqualTo("Leche Entera");
    }

    @Test
    @DisplayName("añadirProducto normaliza una unidad subjetiva y conserva la unidad original (RF-DESP-019)")
    void añadirProducto_normalizaUnidadSubjetiva_yConservaUnidadOriginal() {
        Despensa d = despensa("desp-1", "user-1");
        ProductoRequestDTO dtoTaza = new ProductoRequestDTO(
                "Leche", 3, "taza", null, null, null, null, null, null);
        Producto guardado = Producto.builder()
                .id("prod-1").despensaId("desp-1").nombre("Leche")
                .cantidad(750).unidad("ml").unidadOriginal("taza")
                .build();

        when(unidadNormalizadorService.normalizarUnidades(3, "taza"))
                .thenReturn(new UnidadConvertidaDTO(750, "ml", true));
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of());
        when(productoRepository.save(any(Producto.class))).thenReturn(guardado);
        when(despensaRepository.save(any(Despensa.class))).thenReturn(d);

        ProductoResponseDTO resultado = despensaService.añadirProducto("user-1", dtoTaza);

        assertThat(resultado.cantidad()).isEqualTo(750);
        assertThat(resultado.unidad()).isEqualTo("ml");
        assertThat(resultado.unidadOriginal()).isEqualTo("taza");
    }

    // -------------------------------------------------------------------------
    // listarProductos — cálculo de estado
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("calcularEstado devuelve 'caducado' si fechaCaducidad es ayer")
    void listarProductos_calculaEstado_caducado_correctamente() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("p-1", "desp-1", "Yogur", 2, LocalDate.now().minusDays(1));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(lista.get(0).estado()).isEqualTo("caducado");
    }

    @Test
    @DisplayName("calcularEstado devuelve 'caduca_pronto' si fechaCaducidad es mañana")
    void listarProductos_calculaEstado_caduca_pronto_correctamente() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("p-1", "desp-1", "Queso", 2, LocalDate.now().plusDays(1));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(lista.get(0).estado()).isEqualTo("caduca_pronto");
    }

    @Test
    @DisplayName("calcularEstado devuelve 'bajoStock' si cantidad es 1 y sin fecha de caducidad")
    void listarProductos_calculaEstado_bajoStock_correctamente() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("p-1", "desp-1", "Sal", 1, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(lista.get(0).estado()).isEqualTo("bajoStock");
    }

    @Test
    @DisplayName("calcularEstado devuelve 'normal' si fecha es lejana (>30 días) y cantidad alta")
    void listarProductos_calculaEstado_normal_correctamente() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("p-1", "desp-1", "Arroz", 5, LocalDate.now().plusDays(31));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(lista.get(0).estado()).isEqualTo("normal");
    }

    @Test
    @DisplayName("calcularEstado devuelve 'bajoStock' aunque la fecha de caducidad sea lejana (>30 días)")
    void listarProductos_calculaEstado_bajoStock_con_fechaCaducidad_lejana() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("p-1", "desp-1", "Arroz", 1, LocalDate.now().plusDays(31));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(lista.get(0).estado()).isEqualTo("bajoStock");
    }

    // -------------------------------------------------------------------------
    // RF-DESP-018 — Jerarquía de alertas de estado (#160)
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("calcularEstado devuelve 'sin_stock' cuando cantidad es 0, aunque no esté caducado")
    void estado_sin_stock_cuando_cantidad_es_cero_aunque_no_caducado() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("p-1", "desp-1", "Leche", 0, LocalDate.now().plusDays(20));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(lista.get(0).estado()).isEqualTo("sin_stock");
    }

    @Test
    @DisplayName("calcularEstado devuelve 'sin_stock' con prioridad sobre 'caducado' cuando cantidad es 0")
    void estado_sin_stock_tiene_prioridad_sobre_caducado() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("p-1", "desp-1", "Yogur", 0, LocalDate.now().minusDays(5));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(lista.get(0).estado()).isEqualTo("sin_stock");
    }

    @Test
    @DisplayName("calcularEstado devuelve 'sin_stock' con prioridad sobre 'caduca_hoy' cuando cantidad es 0")
    void estado_sin_stock_tiene_prioridad_sobre_caduca_hoy() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("p-1", "desp-1", "Fresas", 0, LocalDate.now());

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(lista.get(0).estado()).isEqualTo("sin_stock");
    }

    @Test
    @DisplayName("calcularEstado devuelve 'caducado' cuando la cantidad es positiva y la fecha ya pasó")
    void estado_caducado_cuando_cantidad_positiva_y_fecha_pasada() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("p-1", "desp-1", "Queso", 2, LocalDate.now().minusDays(1));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(lista.get(0).estado()).isEqualTo("caducado");
    }

    @Test
    @DisplayName("la jerarquía respeta el orden correcto de prioridades: sin_stock > caducado > caduca_hoy > "
            + "caduca_pronto > bajoStock > caduca_semana > caduca_mes > normal")
    void jerarquia_respeta_orden_correcto_de_prioridades() {
        Despensa d = despensa("desp-1", "user-1");
        Producto sinStock    = producto("p-1", "desp-1", "SinStock", 0, null);
        Producto caducado    = producto("p-2", "desp-1", "Caducado", 2, LocalDate.now().minusDays(1));
        Producto caducaHoy   = producto("p-3", "desp-1", "CaducaHoy", 2, LocalDate.now());
        Producto caducaPronto = producto("p-4", "desp-1", "CaducaPronto", 2, LocalDate.now().plusDays(2));
        // cantidad=1 <= umbral por defecto (1), fecha lejana: bajoStock tiene prioridad sobre caduca_mes
        Producto bajoStock   = producto("p-5", "desp-1", "BajoStock", 1, LocalDate.now().plusDays(10));
        Producto caducaSemana = producto("p-6", "desp-1", "CaducaSemana", 5, LocalDate.now().plusDays(5));
        Producto caducaMes   = producto("p-7", "desp-1", "CaducaMes", 5, LocalDate.now().plusDays(20));
        Producto normal      = producto("p-8", "desp-1", "Normal", 5, LocalDate.now().plusDays(40));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(
                sinStock, caducado, caducaHoy, caducaPronto, bajoStock, caducaSemana, caducaMes, normal));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(porNombre(lista, "SinStock").estado()).isEqualTo("sin_stock");
        assertThat(porNombre(lista, "Caducado").estado()).isEqualTo("caducado");
        assertThat(porNombre(lista, "CaducaHoy").estado()).isEqualTo("caduca_hoy");
        assertThat(porNombre(lista, "CaducaPronto").estado()).isEqualTo("caduca_pronto");
        assertThat(porNombre(lista, "BajoStock").estado()).isEqualTo("bajoStock");
        assertThat(porNombre(lista, "CaducaSemana").estado()).isEqualTo("caduca_semana");
        assertThat(porNombre(lista, "CaducaMes").estado()).isEqualTo("caduca_mes");
        assertThat(porNombre(lista, "Normal").estado()).isEqualTo("normal");
    }

    // -------------------------------------------------------------------------
    // editarProducto
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("editarProducto actualiza nombre, cantidad y unidad correctamente")
    void editarProducto_exitoso_conDatosValidos() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("prod-1", "desp-1", "Leche", 2, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaIdAndId("desp-1", "prod-1")).thenReturn(Optional.of(p));
        when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));
        when(despensaRepository.save(any(Despensa.class))).thenReturn(d);

        ProductoRequestDTO nuevoDto = new ProductoRequestDTO(
                "Leche Desnatada", 3, "litros", null, null, null, null, null, null);
        ProductoResponseDTO resultado = despensaService.editarProducto("user-1", "prod-1", nuevoDto);

        assertThat(resultado.nombre()).isEqualTo("Leche Desnatada");
        assertThat(resultado.cantidad()).isEqualTo(3);
        assertThat(resultado.unidad()).isEqualTo("litros");
    }

    // -------------------------------------------------------------------------
    // eliminarProducto
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("eliminarProducto llama a delete en el repositorio cuando el usuario es propietario")
    void eliminarProducto_exitoso_siEsPropietario() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("prod-1", "desp-1", "Aceite", 2, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaIdAndId("desp-1", "prod-1")).thenReturn(Optional.of(p));
        when(despensaRepository.save(any(Despensa.class))).thenReturn(d);

        despensaService.eliminarProducto("user-1", "prod-1", null);

        verify(productoRepository).delete(p);
    }

    @Test
    @DisplayName("eliminarProducto persiste el motivo y motivoDetalle en el movimiento registrado")
    void eliminarProducto_persisteMotivoYMotivoDetalle_enElMovimiento() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("prod-1", "desp-1", "Aceite", 2, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaIdAndId("desp-1", "prod-1")).thenReturn(Optional.of(p));
        when(despensaRepository.save(any(Despensa.class))).thenReturn(d);

        despensaService.eliminarProducto("user-1", "prod-1",
                new EliminarProductoRequestDTO("otro", "Se rompió el envase"));

        ArgumentCaptor<MovimientoProducto> captor = ArgumentCaptor.forClass(MovimientoProducto.class);
        verify(movimientoRepository).save(captor.capture());
        MovimientoProducto movimiento = captor.getValue();

        assertThat(movimiento.getTipo()).isEqualTo("eliminado");
        assertThat(movimiento.getMotivo()).isEqualTo("otro");
        assertThat(movimiento.getMotivoDetalle()).isEqualTo("Se rompió el envase");
        assertThat(movimiento.getCantidadAnterior()).isEqualTo(2.0);
        assertThat(movimiento.getCantidadNueva()).isNull();
    }

    @Test
    @DisplayName("eliminarProducto registra motivo null cuando no se envía body")
    void eliminarProducto_registraMotivoNull_cuandoDtoEsNull() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("prod-1", "desp-1", "Aceite", 2, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaIdAndId("desp-1", "prod-1")).thenReturn(Optional.of(p));
        when(despensaRepository.save(any(Despensa.class))).thenReturn(d);

        despensaService.eliminarProducto("user-1", "prod-1", null);

        ArgumentCaptor<MovimientoProducto> captor = ArgumentCaptor.forClass(MovimientoProducto.class);
        verify(movimientoRepository).save(captor.capture());

        assertThat(captor.getValue().getMotivo()).isNull();
        assertThat(captor.getValue().getMotivoDetalle()).isNull();
    }

    // -------------------------------------------------------------------------
    // actualizarCantidad
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("actualizarCantidad incrementa: 3 + 2 = 5")
    void actualizarCantidad_incrementa_correctamente() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("prod-1", "desp-1", "Manzanas", 3, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaIdAndId("desp-1", "prod-1")).thenReturn(Optional.of(p));
        when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));
        when(despensaRepository.save(any(Despensa.class))).thenReturn(d);

        ProductoResponseDTO resultado = despensaService.actualizarCantidad(
                "user-1", "prod-1", new ProductoUpdateCantidadDTO(2.0, null, null, null));

        assertThat(resultado.cantidad()).isEqualTo(5.0);
    }

    @Test
    @DisplayName("actualizarCantidad decrementa: 3 - 1 = 2")
    void actualizarCantidad_decrementa_correctamente() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("prod-1", "desp-1", "Manzanas", 3, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaIdAndId("desp-1", "prod-1")).thenReturn(Optional.of(p));
        when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));
        when(despensaRepository.save(any(Despensa.class))).thenReturn(d);

        ProductoResponseDTO resultado = despensaService.actualizarCantidad(
                "user-1", "prod-1", new ProductoUpdateCantidadDTO(-1.0, null, null, null));

        assertThat(resultado.cantidad()).isEqualTo(2.0);
    }

    @Test
    @DisplayName("actualizarCantidad lanza 400 si el resultado sería negativo")
    void actualizarCantidad_falla_siResultadoSeriaNegativo() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("prod-1", "desp-1", "Sal", 1, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaIdAndId("desp-1", "prod-1")).thenReturn(Optional.of(p));

        assertThatThrownBy(() -> despensaService.actualizarCantidad(
                "user-1", "prod-1", new ProductoUpdateCantidadDTO(-99.0, null, null, null)))
                .isInstanceOf(ApiException.class)
                .hasMessage("La cantidad no puede ser negativa")
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus())
                        .isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    @DisplayName("actualizarCantidad persiste el motivo y motivoDetalle cuando decrementa (restar)")
    void actualizarCantidad_persisteMotivoYMotivoDetalle_enElMovimiento() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("prod-1", "desp-1", "Manzanas", 3, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaIdAndId("desp-1", "prod-1")).thenReturn(Optional.of(p));
        when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));
        when(despensaRepository.save(any(Despensa.class))).thenReturn(d);

        despensaService.actualizarCantidad("user-1", "prod-1",
                new ProductoUpdateCantidadDTO(-1.0, "consumido", null, null));

        ArgumentCaptor<MovimientoProducto> captor = ArgumentCaptor.forClass(MovimientoProducto.class);
        verify(movimientoRepository).save(captor.capture());
        MovimientoProducto movimiento = captor.getValue();

        assertThat(movimiento.getTipo()).isEqualTo("cantidad_actualizada");
        assertThat(movimiento.getMotivo()).isEqualTo("consumido");
        assertThat(movimiento.getMotivoDetalle()).isNull();
        assertThat(movimiento.getCantidadAnterior()).isEqualTo(3.0);
        assertThat(movimiento.getCantidadNueva()).isEqualTo(2.0);
    }

    @Test
    @DisplayName("actualizarCantidad registra motivo null cuando suma (sin motivo)")
    void actualizarCantidad_registraMotivoNull_cuandoIncrementaSinMotivo() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("prod-1", "desp-1", "Manzanas", 3, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaIdAndId("desp-1", "prod-1")).thenReturn(Optional.of(p));
        when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));
        when(despensaRepository.save(any(Despensa.class))).thenReturn(d);

        despensaService.actualizarCantidad("user-1", "prod-1",
                new ProductoUpdateCantidadDTO(2.0, null, null, null));

        ArgumentCaptor<MovimientoProducto> captor = ArgumentCaptor.forClass(MovimientoProducto.class);
        verify(movimientoRepository).save(captor.capture());

        assertThat(captor.getValue().getMotivo()).isNull();
    }

    // -------------------------------------------------------------------------
    // buscarProductos
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("buscarProductos devuelve coincidencias case-insensitive")
    void buscarProductos_devuelve_coincidencias_caseInsensitive() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("prod-1", "desp-1", "Leche Entera", 3, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaIdAndNombreContainingIgnoreCase("desp-1", "leche"))
                .thenReturn(List.of(p));

        List<ProductoResponseDTO> resultado = despensaService.buscarProductos("user-1", "leche");

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).nombre()).isEqualTo("Leche Entera");
    }

    // -------------------------------------------------------------------------
    // filtrarProductos
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("filtrarProductos por estado 'caducado' devuelve solo los productos caducados")
    void filtrarProductos_porEstado_caducado() {
        Despensa d = despensa("desp-1", "user-1");
        Producto caducado = producto("p-1", "desp-1", "Yogur", 2, LocalDate.now().minusDays(1));
        Producto normal = producto("p-2", "desp-1", "Arroz", 5, LocalDate.now().plusDays(30));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(caducado, normal));

        List<ProductoResponseDTO> resultado = despensaService.filtrarProductos(
                "user-1", new ProductoFiltroDTO(null, "caducado", null));

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).nombre()).isEqualTo("Yogur");
    }

    @Test
    @DisplayName("filtrarProductos por categoría devuelve solo los productos de esa categoría")
    void filtrarProductos_porCategoria() {
        Despensa d = despensa("desp-1", "user-1");
        Producto lacteo = Producto.builder().id("p-1").despensaId("desp-1")
                .nombre("Leche").cantidad(2).unidad("litros").categoria("Lácteos").build();
        Producto fruta = Producto.builder().id("p-2").despensaId("desp-1")
                .nombre("Manzana").cantidad(5).unidad("unidades").categoria("Frutas y verduras").build();

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(lacteo, fruta));

        List<ProductoResponseDTO> resultado = despensaService.filtrarProductos(
                "user-1", new ProductoFiltroDTO("Lácteos", null, null));

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).nombre()).isEqualTo("Leche");
    }

    @Test
    @DisplayName("filtrarProductos combinado por categoría y estado devuelve la intersección")
    void filtrarProductos_combinado_categoriaYEstado() {
        Despensa d = despensa("desp-1", "user-1");
        Producto lacteoNormal = Producto.builder().id("p-1").despensaId("desp-1")
                .nombre("Leche").cantidad(5).unidad("litros").categoria("Lácteos")
                .fechaCaducidad(LocalDate.now().plusDays(20)).build();
        Producto lacteoCaducado = Producto.builder().id("p-2").despensaId("desp-1")
                .nombre("Queso").cantidad(2).unidad("kg").categoria("Lácteos")
                .fechaCaducidad(LocalDate.now().minusDays(1)).build();

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(lacteoNormal, lacteoCaducado));

        List<ProductoResponseDTO> resultado = despensaService.filtrarProductos(
                "user-1", new ProductoFiltroDTO("Lácteos", "caducado", null));

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).nombre()).isEqualTo("Queso");
    }

    // -------------------------------------------------------------------------
    // Tests negativos
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("añadirProducto lanza 404 si la despensa no existe para el usuario")
    void añadirProducto_falla_siDespensaNoExiste() {
        when(despensaRepository.findByUsuarioId("user-sin-despensa")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> despensaService.añadirProducto("user-sin-despensa", dto("Leche", 2)))
                .isInstanceOf(ApiException.class)
                .hasMessage("Despensa no encontrada")
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    @DisplayName("editarProducto lanza 404 si el producto no existe en la despensa")
    void editarProducto_falla_siProductoNoExiste() {
        Despensa d = despensa("desp-1", "user-1");
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaIdAndId("desp-1", "no-existe"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> despensaService.editarProducto("user-1", "no-existe", dto("X", 1)))
                .isInstanceOf(ApiException.class)
                .hasMessage("Producto no encontrado")
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    @DisplayName("eliminarProducto lanza 404 si el producto no existe en la despensa")
    void eliminarProducto_falla_siProductoNoExiste() {
        Despensa d = despensa("desp-1", "user-1");
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaIdAndId("desp-1", "no-existe"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> despensaService.eliminarProducto("user-1", "no-existe", null))
                .isInstanceOf(ApiException.class)
                .hasMessage("Producto no encontrado")
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    @DisplayName("actualizarCantidad lanza 404 si el producto no existe en la despensa")
    void actualizarCantidad_falla_siProductoNoExiste() {
        Despensa d = despensa("desp-1", "user-1");
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaIdAndId("desp-1", "no-existe"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> despensaService.actualizarCantidad(
                "user-1", "no-existe", new ProductoUpdateCantidadDTO(1.0, null, null, null)))
                .isInstanceOf(ApiException.class)
                .hasMessage("Producto no encontrado")
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }

    // -------------------------------------------------------------------------
    // MEJORA 1 — Stock mínimo personalizable (#132)
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("resolverUmbral usa stockMinimo del producto cuando está definido, ignorando el global")
    void stockMinimo_resolverUmbral_usaStockMinimoDelProducto_cuandoEstaDefinido() {
        Despensa d = despensa("desp-1", "user-1");
        // cantidad=3, stockMinimo propio=5 → bajoStock (3≤5); con global=1 sería normal (3>1)
        Producto p = Producto.builder()
                .id("p-1").despensaId("desp-1").nombre("Agua").cantidad(3).unidad("litros")
                .stockMinimo(5)
                .build();

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(lista.get(0).estado()).isEqualTo("bajoStock");
        assertThat(lista.get(0).alertaCompra()).isTrue();
    }

    @Test
    @DisplayName("resolverUmbral usa stockMinimoGlobal como fallback cuando el producto no tiene stockMinimo propio")
    void stockMinimo_resolverUmbral_usaGlobalComoFallback_cuandoProductoSinStockMinimo() {
        Despensa d = despensa("desp-1", "user-1");
        Preferencias prefs = Preferencias.builder().usuarioId("user-1").stockMinimoGlobal(5).build();
        // cantidad=3, sin stockMinimo propio → usa global=5 → bajoStock (3≤5)
        Producto p = producto("p-1", "desp-1", "Arroz", 3, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(preferenciasRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(prefs));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(lista.get(0).estado()).isEqualTo("bajoStock");
        assertThat(lista.get(0).alertaCompra()).isTrue();
    }

    @Test
    @DisplayName("obtenerGlobalUmbral devuelve 1 como fallback cuando el usuario no tiene preferencias")
    void stockMinimo_obtenerGlobalUmbral_devuelve1_cuandoSinPreferencias() {
        Despensa d = despensa("desp-1", "user-1");
        // preferenciasRepository devuelve Optional.empty() por defecto → umbral fallback = 1
        Producto p = producto("p-1", "desp-1", "Sal", 1, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        // cantidad=1, umbral=1 → bajoStock (1≤1)
        assertThat(lista.get(0).estado()).isEqualTo("bajoStock");
        assertThat(lista.get(0).alertaCompra()).isTrue();
    }

    @Test
    @DisplayName("obtenerGlobalUmbral devuelve el stockMinimoGlobal definido en las preferencias del usuario")
    void stockMinimo_obtenerGlobalUmbral_devuelveValorDePreferencias() {
        Despensa d = despensa("desp-1", "user-1");
        Preferencias prefs = Preferencias.builder().usuarioId("user-1").stockMinimoGlobal(4).build();
        // cantidad=3, sin stockMinimo propio → usa global=4 → bajoStock (3≤4)
        Producto p = producto("p-1", "desp-1", "Azúcar", 3, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(preferenciasRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(prefs));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(lista.get(0).estado()).isEqualTo("bajoStock");
    }

    @Test
    @DisplayName("alertaCompra es true cuando la cantidad es exactamente igual al umbral efectivo")
    void stockMinimo_alertaCompra_esTrue_cuandoCantidadIgualAlUmbral() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = Producto.builder()
                .id("p-1").despensaId("desp-1").nombre("Leche").cantidad(2).unidad("litros")
                .stockMinimo(2)
                .build();

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(lista.get(0).alertaCompra()).isTrue();
        assertThat(lista.get(0).estado()).isEqualTo("bajoStock");
    }

    @Test
    @DisplayName("alertaCompra es false cuando la cantidad supera el umbral efectivo")
    void stockMinimo_alertaCompra_esFalse_cuandoCantidadSuperaUmbral() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = Producto.builder()
                .id("p-1").despensaId("desp-1").nombre("Pasta").cantidad(5).unidad("kg")
                .stockMinimo(2)
                .build();

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(lista.get(0).alertaCompra()).isFalse();
        assertThat(lista.get(0).estado()).isEqualTo("normal");
    }

    @Test
    @DisplayName("stockMinimo del producto tiene prioridad sobre un stockMinimoGlobal más alto")
    void stockMinimo_productoTienePrioridad_sobreGlobalMasAlto() {
        Despensa d = despensa("desp-1", "user-1");
        Preferencias prefs = Preferencias.builder().usuarioId("user-1").stockMinimoGlobal(10).build();
        // cantidad=4, stockMinimo propio=2, global=10 → usa el propio → normal (4>2)
        // Si usase el global (10), sería bajoStock (4≤10)
        Producto p = Producto.builder()
                .id("p-1").despensaId("desp-1").nombre("Huevos").cantidad(4).unidad("unidades")
                .stockMinimo(2)
                .build();

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(preferenciasRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(prefs));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(lista.get(0).estado()).isEqualTo("normal");
        assertThat(lista.get(0).alertaCompra()).isFalse();
    }

    @Test
    @DisplayName("añadirProducto acepta y persiste stockMinimo=0 (FIX-006)")
    void stockMinimo_aceptaValorCero_yLoPersiste() {
        Despensa d = despensa("desp-1", "user-1");
        ProductoRequestDTO dto = new ProductoRequestDTO(
                "Sal", 5, "kg", null, null, null, null, null, 0);
        Producto guardado = Producto.builder()
                .id("prod-1").despensaId("desp-1").nombre("Sal").cantidad(5).unidad("kg")
                .stockMinimo(0)
                .build();

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of());
        when(productoRepository.save(any(Producto.class))).thenReturn(guardado);
        when(despensaRepository.save(any(Despensa.class))).thenReturn(d);

        ProductoResponseDTO resultado = despensaService.añadirProducto("user-1", dto);

        assertThat(resultado.stockMinimo()).isEqualTo(0);
    }

    // -------------------------------------------------------------------------
    // MEJORA 2 — Granularidad de caducidad (#133 + #136)
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("calcularEstado devuelve 'caduca_hoy' y diasHastaCaducidad=0 cuando vence hoy")
    void mejora2_estado_caduca_hoy_y_dias_cero() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("p-1", "desp-1", "Fresas", 2, LocalDate.now());

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(lista.get(0).estado()).isEqualTo("caduca_hoy");
        assertThat(lista.get(0).diasHastaCaducidad()).isEqualTo(0);
    }

    @Test
    @DisplayName("calcularEstado devuelve 'caduca_semana' cuando quedan 5 días")
    void mejora2_estado_caduca_semana_correctamente() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("p-1", "desp-1", "Tomates", 3, LocalDate.now().plusDays(5));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(lista.get(0).estado()).isEqualTo("caduca_semana");
        assertThat(lista.get(0).diasHastaCaducidad()).isEqualTo(5);
    }

    @Test
    @DisplayName("calcularEstado devuelve 'caduca_mes' cuando quedan 15 días")
    void mejora2_estado_caduca_mes_correctamente() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("p-1", "desp-1", "Mantequilla", 2, LocalDate.now().plusDays(15));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(lista.get(0).estado()).isEqualTo("caduca_mes");
        assertThat(lista.get(0).diasHastaCaducidad()).isEqualTo(15);
    }

    @Test
    @DisplayName("diasHastaCaducidad es null cuando el producto no tiene fecha de caducidad")
    void mejora2_diasHastaCaducidad_esNull_sinFechaCaducidad() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("p-1", "desp-1", "Sal", 5, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(lista.get(0).diasHastaCaducidad()).isNull();
    }

    @Test
    @DisplayName("diasHastaCaducidad es negativo cuando el producto está caducado")
    void mejora2_diasHastaCaducidad_esNegativo_cuandoCaducado() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("p-1", "desp-1", "Yogur", 2, LocalDate.now().minusDays(3));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(lista.get(0).diasHastaCaducidad()).isEqualTo(-3);
    }

    @Test
    @DisplayName("límite exacto: 7 días devuelve 'caduca_semana', 8 días devuelve 'caduca_mes'")
    void mejora2_limite_exacto_entre_semana_y_mes() {
        Despensa d = despensa("desp-1", "user-1");
        Producto enSemana = producto("p-1", "desp-1", "Queso semana", 2, LocalDate.now().plusDays(7));
        Producto enMes    = producto("p-2", "desp-1", "Queso mes",    2, LocalDate.now().plusDays(8));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(enSemana, enMes));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(porNombre(lista, "Queso semana").estado()).isEqualTo("caduca_semana");
        assertThat(porNombre(lista, "Queso mes").estado()).isEqualTo("caduca_mes");
    }

    @Test
    @DisplayName("límite exacto: 30 días devuelve 'caduca_mes', 31 días devuelve 'normal'")
    void mejora2_limite_exacto_entre_mes_y_normal() {
        Despensa d = despensa("desp-1", "user-1");
        Producto enMes    = producto("p-1", "desp-1", "Leche mes",    3, LocalDate.now().plusDays(30));
        Producto normal   = producto("p-2", "desp-1", "Leche normal", 3, LocalDate.now().plusDays(31));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(enMes, normal));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(porNombre(lista, "Leche mes").estado()).isEqualTo("caduca_mes");
        assertThat(porNombre(lista, "Leche normal").estado()).isEqualTo("normal");
    }

    @Test
    @DisplayName("filtrarProductos por 'caduca_hoy' devuelve solo los que vencen hoy")
    void mejora2_filtrarProductos_porEstado_caduca_hoy() {
        Despensa d = despensa("desp-1", "user-1");
        Producto hoy   = producto("p-1", "desp-1", "Fresas", 2, LocalDate.now());
        Producto manana = producto("p-2", "desp-1", "Peras",  2, LocalDate.now().plusDays(1));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(hoy, manana));

        List<ProductoResponseDTO> resultado = despensaService.filtrarProductos(
                "user-1", new ProductoFiltroDTO(null, "caduca_hoy", null));

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).nombre()).isEqualTo("Fresas");
    }

    @Test
    @DisplayName("filtrarProductos por 'caduca_semana' devuelve solo los que caducan entre 4 y 7 días")
    void mejora2_filtrarProductos_porEstado_caduca_semana() {
        Despensa d = despensa("desp-1", "user-1");
        Producto pronto  = producto("p-1", "desp-1", "Yogur",   2, LocalDate.now().plusDays(2));
        Producto semana  = producto("p-2", "desp-1", "Queso",   2, LocalDate.now().plusDays(6));
        Producto mes     = producto("p-3", "desp-1", "Aceite",  2, LocalDate.now().plusDays(20));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(pronto, semana, mes));

        List<ProductoResponseDTO> resultado = despensaService.filtrarProductos(
                "user-1", new ProductoFiltroDTO(null, "caduca_semana", null));

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).nombre()).isEqualTo("Queso");
    }

    @Test
    @DisplayName("filtrarProductos por 'caduca_mes' devuelve solo los que caducan entre 8 y 30 días")
    void mejora2_filtrarProductos_porEstado_caduca_mes() {
        Despensa d = despensa("desp-1", "user-1");
        Producto semana  = producto("p-1", "desp-1", "Fresa",  2, LocalDate.now().plusDays(5));
        Producto mes     = producto("p-2", "desp-1", "Pasta",  4, LocalDate.now().plusDays(25));
        Producto normal  = producto("p-3", "desp-1", "Arroz",  5, LocalDate.now().plusDays(60));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(semana, mes, normal));

        List<ProductoResponseDTO> resultado = despensaService.filtrarProductos(
                "user-1", new ProductoFiltroDTO(null, "caduca_mes", null));

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).nombre()).isEqualTo("Pasta");
    }

    @Test
    @DisplayName("filtrarProductos por 'bajoStock' devuelve solo los productos con cantidad <= umbral")
    void mejora2_filtrarProductos_porEstado_bajoStock() {
        Despensa d = despensa("desp-1", "user-1");
        Producto bajo   = producto("p-1", "desp-1", "Sal",   1, null);
        Producto normal = producto("p-2", "desp-1", "Arroz", 5, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(bajo, normal));

        List<ProductoResponseDTO> resultado = despensaService.filtrarProductos(
                "user-1", new ProductoFiltroDTO(null, "bajoStock", null));

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).nombre()).isEqualTo("Sal");
    }

    @Test
    @DisplayName("filtrarProductos sin filtros devuelve todos los productos")
    void mejora2_filtrarProductos_sinFiltros_devuelveTodos() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p1 = producto("p-1", "desp-1", "Leche",  3, null);
        Producto p2 = producto("p-2", "desp-1", "Huevos", 6, LocalDate.now().plusDays(10));
        Producto p3 = producto("p-3", "desp-1", "Yogur",  1, LocalDate.now().minusDays(2));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p1, p2, p3));

        List<ProductoResponseDTO> resultado = despensaService.filtrarProductos(
                "user-1", new ProductoFiltroDTO(null, null, null));

        assertThat(resultado).hasSize(3);
    }

    // -------------------------------------------------------------------------
    // MEJORA 4 — Ordenación de productos (#137)
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("listarProductos ordena por nombre ascendente (A-Z)")
    void listarProductos_ordenado_por_nombre_asc_correctamente() {
        Despensa d = despensa("desp-1", "user-1");
        Producto zanahoria = producto("p-1", "desp-1", "Zanahoria", 2, null);
        Producto arroz     = producto("p-2", "desp-1", "Arroz", 3, null);
        Producto manzana   = producto("p-3", "desp-1", "Manzana", 1, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1"))
                .thenReturn(List.of(zanahoria, arroz, manzana));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1", "nombre_asc");

        assertThat(lista).extracting(ProductoResponseDTO::nombre)
                .containsExactly("Arroz", "Manzana", "Zanahoria");
    }

    @Test
    @DisplayName("listarProductos ordena por nombre descendente (Z-A)")
    void listarProductos_ordenado_por_nombre_desc_correctamente() {
        Despensa d = despensa("desp-1", "user-1");
        Producto zanahoria = producto("p-1", "desp-1", "Zanahoria", 2, null);
        Producto arroz     = producto("p-2", "desp-1", "Arroz", 3, null);
        Producto manzana   = producto("p-3", "desp-1", "Manzana", 1, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1"))
                .thenReturn(List.of(zanahoria, arroz, manzana));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1", "nombre_desc");

        assertThat(lista).extracting(ProductoResponseDTO::nombre)
                .containsExactly("Zanahoria", "Manzana", "Arroz");
    }

    @Test
    @DisplayName("listarProductos ordena por caducidad ascendente, dejando los productos sin fecha al final")
    void listarProductos_ordenado_por_caducidad_asc_correctamente() {
        Despensa d = despensa("desp-1", "user-1");
        Producto sinFecha = producto("p-1", "desp-1", "Sal", 5, null);
        Producto lejana   = producto("p-2", "desp-1", "Arroz", 5, LocalDate.now().plusDays(20));
        Producto cercana  = producto("p-3", "desp-1", "Yogur", 2, LocalDate.now().plusDays(2));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1"))
                .thenReturn(List.of(sinFecha, lejana, cercana));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1", "caducidad_asc");

        assertThat(lista).extracting(ProductoResponseDTO::nombre)
                .containsExactly("Yogur", "Arroz", "Sal");
    }

    @Test
    @DisplayName("listarProductos ordena por cantidad descendente (mayor a menor)")
    void listarProductos_ordenado_por_cantidad_desc_correctamente() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p1 = producto("p-1", "desp-1", "A", 2, null);
        Producto p2 = producto("p-2", "desp-1", "B", 8, null);
        Producto p3 = producto("p-3", "desp-1", "C", 5, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p1, p2, p3));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1", "cantidad_desc");

        assertThat(lista).extracting(ProductoResponseDTO::cantidad)
                .containsExactly(8.0, 5.0, 2.0);
    }

    @Test
    @DisplayName("listarProductos ordena por cantidad ascendente (menor a mayor)")
    void listarProductos_ordenado_por_cantidad_asc_correctamente() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p1 = producto("p-1", "desp-1", "A", 2, null);
        Producto p2 = producto("p-2", "desp-1", "B", 8, null);
        Producto p3 = producto("p-3", "desp-1", "C", 5, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p1, p2, p3));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1", "cantidad_asc");

        assertThat(lista).extracting(ProductoResponseDTO::cantidad)
                .containsExactly(2.0, 5.0, 8.0);
    }

    @Test
    @DisplayName("listarProductos ordena por fecha de añadido, el más reciente primero")
    void listarProductos_ordenado_por_reciente_primero_correctamente() {
        Despensa d = despensa("desp-1", "user-1");
        LocalDateTime base = LocalDateTime.now();
        Producto antiguo  = Producto.builder().id("p-1").despensaId("desp-1")
                .nombre("Antiguo").cantidad(1).unidad("unidades")
                .createdAt(base.minusDays(2)).build();
        Producto reciente = Producto.builder().id("p-2").despensaId("desp-1")
                .nombre("Reciente").cantidad(1).unidad("unidades")
                .createdAt(base).build();
        Producto medio    = Producto.builder().id("p-3").despensaId("desp-1")
                .nombre("Medio").cantidad(1).unidad("unidades")
                .createdAt(base.minusDays(1)).build();

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1"))
                .thenReturn(List.of(antiguo, reciente, medio));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1", "reciente_primero");

        assertThat(lista).extracting(ProductoResponseDTO::nombre)
                .containsExactly("Reciente", "Medio", "Antiguo");
    }

    @Test
    @DisplayName("listarProductos ordena por categoría alfabéticamente, dejando los sin categoría al final")
    void listarProductos_ordenado_por_categoria_correctamente() {
        Despensa d = despensa("desp-1", "user-1");
        Producto verduras = Producto.builder().id("p-1").despensaId("desp-1")
                .nombre("Zanahoria").cantidad(2).unidad("unidades").categoria("Verduras").build();
        Producto lacteos  = Producto.builder().id("p-2").despensaId("desp-1")
                .nombre("Leche").cantidad(2).unidad("litros").categoria("Lácteos").build();
        Producto sinCategoria = Producto.builder().id("p-3").despensaId("desp-1")
                .nombre("Varios").cantidad(1).unidad("unidades").build();

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1"))
                .thenReturn(List.of(verduras, lacteos, sinCategoria));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1", "categoria");

        assertThat(lista).extracting(ProductoResponseDTO::nombre)
                .containsExactly("Leche", "Zanahoria", "Varios");
    }

    @Test
    @DisplayName("listarProductos sin orderBy usa 'reciente_primero' por defecto")
    void listarProductos_sin_orderBy_usa_reciente_primero() {
        Despensa d = despensa("desp-1", "user-1");
        LocalDateTime base = LocalDateTime.now();
        Producto antiguo  = Producto.builder().id("p-1").despensaId("desp-1")
                .nombre("Antiguo").cantidad(1).unidad("unidades")
                .createdAt(base.minusDays(2)).build();
        Producto reciente = Producto.builder().id("p-2").despensaId("desp-1")
                .nombre("Reciente").cantidad(1).unidad("unidades")
                .createdAt(base).build();

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1"))
                .thenReturn(List.of(antiguo, reciente));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(lista).extracting(ProductoResponseDTO::nombre)
                .containsExactly("Reciente", "Antiguo");
    }

    @Test
    @DisplayName("listarProductos combina el cálculo de estado con la ordenación solicitada")
    void listarProductos_filtro_estado_combinable_con_ordenacion() {
        Despensa d = despensa("desp-1", "user-1");
        Producto caducado  = producto("p-1", "desp-1", "Zanahoria caducada", 2, LocalDate.now().minusDays(1));
        Producto bajoStock = producto("p-2", "desp-1", "Arroz bajo", 1, null);
        Producto normal    = producto("p-3", "desp-1", "Manzana normal", 10, LocalDate.now().plusDays(60));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1"))
                .thenReturn(List.of(caducado, bajoStock, normal));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1", "nombre_asc");

        assertThat(lista).extracting(ProductoResponseDTO::nombre)
                .containsExactly("Arroz bajo", "Manzana normal", "Zanahoria caducada");
        assertThat(lista.get(0).estado()).isEqualTo("bajoStock");
        assertThat(lista.get(1).estado()).isEqualTo("normal");
        assertThat(lista.get(2).estado()).isEqualTo("caducado");
    }

    @Test
    @DisplayName("listarProductos lanza 400 si orderBy no es un valor válido")
    void listarProductos_devuelve_400_con_orderBy_invalido() {
        Despensa d = despensa("desp-1", "user-1");
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));

        assertThatThrownBy(() -> despensaService.listarProductos("user-1", "invalido"))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus())
                        .isEqualTo(HttpStatus.BAD_REQUEST));
    }
}
