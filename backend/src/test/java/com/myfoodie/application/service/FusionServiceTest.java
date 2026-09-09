package com.myfoodie.application.service;

import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import com.myfoodie.domain.model.Despensa;
import com.myfoodie.domain.model.Producto;
import com.myfoodie.domain.repository.DespensaRepository;
import com.myfoodie.domain.repository.FusionIgnoradaRepository;
import com.myfoodie.domain.repository.MovimientoProductoRepository;
import com.myfoodie.domain.repository.PreferenciasRepository;
import com.myfoodie.domain.repository.ProductoRepository;
import com.myfoodie.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("FusionService — fusión de productos duplicados con conversión de unidades (RF-DESP-022)")
class FusionServiceTest {

    @Mock private DespensaRepository despensaRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private PreferenciasRepository preferenciasRepository;
    @Mock private MovimientoProductoRepository movimientoRepository;
    @Mock private FusionIgnoradaRepository fusionIgnoradaRepository;
    @Mock private MatchingService matchingService;
    private final UnidadNormalizadorService unidadNormalizadorService = new UnidadNormalizadorService();

    private FusionService fusionService;

    private final Despensa despensa = Despensa.builder().id("despensa-1").usuarioId("usuario-1").build();

    @BeforeEach
    void setUp() {
        fusionService = new FusionService(despensaRepository, productoRepository, preferenciasRepository,
                movimientoRepository, fusionIgnoradaRepository, matchingService, unidadNormalizadorService);
        lenient().when(despensaRepository.findByUsuarioId("usuario-1")).thenReturn(Optional.of(despensa));
        lenient().when(preferenciasRepository.findByUsuarioId("usuario-1")).thenReturn(Optional.empty());
        lenient().when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private Producto producto(String id, String nombre, double cantidad, String unidad) {
        return Producto.builder().id(id).despensaId("despensa-1").nombre(nombre).cantidad(cantidad).unidad(unidad).build();
    }

    // -------------------------------------------------------------------------
    // fusionarProductos — suma de cantidades con conversión de unidad
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("fusiona dos productos en la misma unidad sumando cantidades directamente")
    void fusionarProductos_misma_unidad_suma_cantidades() {
        Producto mantener = producto("p1", "Leche", 1, "l");
        Producto eliminar = producto("p2", "Leche entera", 2, "l");
        when(productoRepository.findById("p1")).thenReturn(Optional.of(mantener));
        when(productoRepository.findById("p2")).thenReturn(Optional.of(eliminar));

        ProductoResponseDTO resultado = fusionService.fusionarProductos("usuario-1", "p1", "p2");

        assertThat(resultado.cantidad()).isEqualTo(3.0);
        assertThat(resultado.unidad()).isEqualTo("l");
        verify(productoRepository).delete(eliminar);
    }

    @Test
    @DisplayName("fusiona convirtiendo unidades de la misma familia (2 l + 500 ml = 2.5 l, no 502)")
    void fusionarProductos_convierte_unidades_distintas_antes_de_sumar() {
        Producto mantener = producto("p1", "Leche", 2, "l");
        Producto eliminar = producto("p2", "Leche entera", 500, "ml");
        when(productoRepository.findById("p1")).thenReturn(Optional.of(mantener));
        when(productoRepository.findById("p2")).thenReturn(Optional.of(eliminar));

        ProductoResponseDTO resultado = fusionService.fusionarProductos("usuario-1", "p1", "p2");

        assertThat(resultado.cantidad()).isEqualTo(2.5);
        assertThat(resultado.unidad()).isEqualTo("l");
    }

    @Test
    @DisplayName("respeta la unidad elegida explícitamente por el usuario, aunque no sea la del producto que se mantiene")
    void fusionarProductos_respeta_unidad_elegida_por_el_usuario() {
        Producto mantener = producto("p1", "Leche", 2, "l");
        Producto eliminar = producto("p2", "Leche entera", 500, "ml");
        when(productoRepository.findById("p1")).thenReturn(Optional.of(mantener));
        when(productoRepository.findById("p2")).thenReturn(Optional.of(eliminar));

        ProductoResponseDTO resultado = fusionService.fusionarProductos(
                "usuario-1", "p1", "p2", "ml", null);

        assertThat(resultado.cantidad()).isEqualTo(2500.0);
        assertThat(resultado.unidad()).isEqualTo("ml");
    }

    @Test
    @DisplayName("si las unidades no son de la misma familia, suma en crudo como fallback")
    void fusionarProductos_unidades_no_convertibles_suma_en_crudo() {
        Producto mantener = producto("p1", "Huevos", 6, "unidad");
        Producto eliminar = producto("p2", "Huevos", 4, "manojo");
        when(productoRepository.findById("p1")).thenReturn(Optional.of(mantener));
        when(productoRepository.findById("p2")).thenReturn(Optional.of(eliminar));

        ProductoResponseDTO resultado = fusionService.fusionarProductos("usuario-1", "p1", "p2");

        // "manojo" no pertenece a ninguna familia de conversión: se suma en crudo (4) sin transformar.
        assertThat(resultado.cantidad()).isEqualTo(10.0);
        assertThat(resultado.unidad()).isEqualTo("unidad");
    }

    @Test
    @DisplayName("respeta la fecha de caducidad elegida por el usuario cuando difieren")
    void fusionarProductos_respeta_fecha_elegida_por_el_usuario() {
        Producto mantener = producto("p1", "Leche", 1, "l");
        mantener.setFechaCaducidad(LocalDate.of(2026, 1, 10));
        Producto eliminar = producto("p2", "Leche entera", 1, "l");
        eliminar.setFechaCaducidad(LocalDate.of(2026, 3, 1));
        when(productoRepository.findById("p1")).thenReturn(Optional.of(mantener));
        when(productoRepository.findById("p2")).thenReturn(Optional.of(eliminar));

        ProductoResponseDTO resultado = fusionService.fusionarProductos(
                "usuario-1", "p1", "p2", null, LocalDate.of(2026, 3, 1));

        assertThat(resultado.fechaCaducidad()).isEqualTo(LocalDate.of(2026, 3, 1));
    }

    @Test
    @DisplayName("sin override de fecha, conserva automáticamente la más próxima")
    void fusionarProductos_sin_override_conserva_fecha_mas_proxima() {
        Producto mantener = producto("p1", "Leche", 1, "l");
        mantener.setFechaCaducidad(LocalDate.of(2026, 3, 1));
        Producto eliminar = producto("p2", "Leche entera", 1, "l");
        eliminar.setFechaCaducidad(LocalDate.of(2026, 1, 10));
        when(productoRepository.findById("p1")).thenReturn(Optional.of(mantener));
        when(productoRepository.findById("p2")).thenReturn(Optional.of(eliminar));

        ProductoResponseDTO resultado = fusionService.fusionarProductos("usuario-1", "p1", "p2");

        assertThat(resultado.fechaCaducidad()).isEqualTo(LocalDate.of(2026, 1, 10));
    }

    @Test
    @DisplayName("registra un movimiento de tipo fusionado con la cantidad anterior y la nueva")
    void fusionarProductos_registra_movimiento() {
        Producto mantener = producto("p1", "Leche", 1, "l");
        Producto eliminar = producto("p2", "Leche entera", 1, "l");
        when(productoRepository.findById("p1")).thenReturn(Optional.of(mantener));
        when(productoRepository.findById("p2")).thenReturn(Optional.of(eliminar));

        fusionService.fusionarProductos("usuario-1", "p1", "p2");

        ArgumentCaptor<com.myfoodie.domain.model.MovimientoProducto> captor =
                ArgumentCaptor.forClass(com.myfoodie.domain.model.MovimientoProducto.class);
        verify(movimientoRepository).save(captor.capture());
        assertThat(captor.getValue().getTipo()).isEqualTo("fusionado");
        assertThat(captor.getValue().getCantidadAnterior()).isEqualTo(1.0);
        assertThat(captor.getValue().getCantidadNueva()).isEqualTo(2.0);
    }

    @Test
    @DisplayName("lanza 400 si se intenta fusionar un producto consigo mismo")
    void fusionarProductos_lanza_400_si_es_el_mismo_producto() {
        assertThatThrownBy(() -> fusionService.fusionarProductos("usuario-1", "p1", "p1"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    @DisplayName("lanza 403 si el producto no pertenece a la despensa del usuario")
    void fusionarProductos_lanza_403_si_el_producto_es_de_otra_despensa() {
        Producto deOtraDespensa = producto("p2", "Leche", 1, "l");
        deOtraDespensa.setDespensaId("otra-despensa");
        when(productoRepository.findById("p1")).thenReturn(Optional.of(producto("p1", "Leche", 1, "l")));
        when(productoRepository.findById("p2")).thenReturn(Optional.of(deOtraDespensa));

        assertThatThrownBy(() -> fusionService.fusionarProductos("usuario-1", "p1", "p2"))
                .isInstanceOf(ApiException.class);
    }

    // -------------------------------------------------------------------------
    // ignorarSugerenciaFusion
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("ignorarSugerenciaFusion guarda el par normalizado para no volver a sugerirlo")
    void ignorarSugerenciaFusion_guarda_el_par_normalizado() {
        Producto a = producto("p1", "Aceitunas Gordales", 1, "unidad");
        Producto b = producto("p2", "Aceitunas Gordale", 1, "unidad");
        when(productoRepository.findById("p1")).thenReturn(Optional.of(a));
        when(productoRepository.findById("p2")).thenReturn(Optional.of(b));
        when(matchingService.normalizar("Aceitunas Gordales")).thenReturn("aceitunas gordales");
        when(matchingService.normalizar("Aceitunas Gordale")).thenReturn("aceitunas gordale");

        fusionService.ignorarSugerenciaFusion("usuario-1", "p1", "p2");

        ArgumentCaptor<com.myfoodie.domain.model.FusionIgnorada> captor =
                ArgumentCaptor.forClass(com.myfoodie.domain.model.FusionIgnorada.class);
        verify(fusionIgnoradaRepository).save(captor.capture());
        assertThat(captor.getValue().getProductoANombre()).isEqualTo("aceitunas gordales");
        assertThat(captor.getValue().getProductoBNombre()).isEqualTo("aceitunas gordale");
    }
}
