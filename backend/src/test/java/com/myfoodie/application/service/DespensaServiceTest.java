package com.myfoodie.application.service;

import com.myfoodie.application.dto.despensa.ProductoFiltroDTO;
import com.myfoodie.application.dto.despensa.ProductoRequestDTO;
import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import com.myfoodie.application.dto.despensa.ProductoUpdateCantidadDTO;
import com.myfoodie.domain.model.Despensa;
import com.myfoodie.domain.model.Preferencias;
import com.myfoodie.domain.model.Producto;
import com.myfoodie.domain.repository.DespensaRepository;
import com.myfoodie.domain.repository.PreferenciasRepository;
import com.myfoodie.domain.repository.ProductoRepository;
import com.myfoodie.exception.ApiException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("DespensaService — CRUD, búsqueda y filtrado")
class DespensaServiceTest {

    @Mock private DespensaRepository despensaRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private PreferenciasRepository preferenciasRepository;

    @InjectMocks private DespensaService despensaService;

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

    // -------------------------------------------------------------------------
    // añadirProducto — positivos
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("añadirProducto exitoso devuelve DTO con datos correctos y sin duplicados")
    void añadirProducto_exitoso_conDatosValidos() {
        Despensa d = despensa("desp-1", "user-1");
        Producto guardado = producto("prod-1", "desp-1", "Leche", 2, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaIdAndNombreContainingIgnoreCase("desp-1", "Leche"))
                .thenReturn(List.of());
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
        when(productoRepository.findByDespensaIdAndNombreContainingIgnoreCase("desp-1", "Leche"))
                .thenReturn(List.of(existente));
        when(productoRepository.save(any(Producto.class))).thenReturn(nuevo);
        when(despensaRepository.save(any(Despensa.class))).thenReturn(d);

        ProductoResponseDTO resultado = despensaService.añadirProducto("user-1", dto("Leche", 2));

        assertThat(resultado.posiblesDuplicados()).hasSize(1);
        assertThat(resultado.posiblesDuplicados().get(0).nombre()).isEqualTo("Leche Entera");
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
    @DisplayName("calcularEstado devuelve 'normal' si fecha es lejana y cantidad alta")
    void listarProductos_calculaEstado_normal_correctamente() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("p-1", "desp-1", "Arroz", 5, LocalDate.now().plusDays(30));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));

        List<ProductoResponseDTO> lista = despensaService.listarProductos("user-1");

        assertThat(lista.get(0).estado()).isEqualTo("normal");
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

        despensaService.eliminarProducto("user-1", "prod-1");

        verify(productoRepository).delete(p);
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
                "user-1", "prod-1", new ProductoUpdateCantidadDTO(2.0));

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
                "user-1", "prod-1", new ProductoUpdateCantidadDTO(-1.0));

        assertThat(resultado.cantidad()).isEqualTo(2.0);
    }

    @Test
    @DisplayName("actualizarCantidad clampea a 0 si el resultado sería negativo")
    void actualizarCantidad_clampea_a_cero_siResultadoNegativo() {
        Despensa d = despensa("desp-1", "user-1");
        Producto p = producto("prod-1", "desp-1", "Sal", 1, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaIdAndId("desp-1", "prod-1")).thenReturn(Optional.of(p));
        when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));
        when(despensaRepository.save(any(Despensa.class))).thenReturn(d);

        ProductoResponseDTO resultado = despensaService.actualizarCantidad(
                "user-1", "prod-1", new ProductoUpdateCantidadDTO(-99.0));

        assertThat(resultado.cantidad()).isEqualTo(0.0);
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

        assertThatThrownBy(() -> despensaService.eliminarProducto("user-1", "no-existe"))
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
                "user-1", "no-existe", new ProductoUpdateCantidadDTO(1.0)))
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
}
