package com.myfoodie.application.service;

import com.myfoodie.application.dto.carrito.AñadirItemCarritoResponseDTO;
import com.myfoodie.application.dto.carrito.CarritoDTO;
import com.myfoodie.application.dto.carrito.ItemCarritoRequestDTO;
import com.myfoodie.application.dto.carrito.ItemCarritoResponseDTO;
import com.myfoodie.application.dto.carrito.ItemCompradoAjusteDTO;
import com.myfoodie.application.dto.carrito.ListaCompraResponseDTO;
import com.myfoodie.application.dto.matching.SimilitudResultDTO;
import com.myfoodie.application.dto.unidad.UnidadConvertidaDTO;
import com.myfoodie.domain.model.Despensa;
import com.myfoodie.domain.model.IngredienteReceta;
import com.myfoodie.domain.model.ItemCarrito;
import com.myfoodie.domain.model.ListaCompra;
import com.myfoodie.domain.model.Producto;
import com.myfoodie.domain.model.Receta;
import com.myfoodie.domain.model.RecetaGuardada;
import com.myfoodie.domain.model.TipoMatch;
import com.myfoodie.domain.repository.DespensaRepository;
import com.myfoodie.domain.repository.IngredienteRecetaRepository;
import com.myfoodie.domain.repository.ItemCarritoRepository;
import com.myfoodie.domain.repository.ListaCompraRepository;
import com.myfoodie.domain.repository.LoteProductoRepository;
import com.myfoodie.domain.repository.MovimientoProductoRepository;
import com.myfoodie.domain.repository.PreferenciasRepository;
import com.myfoodie.domain.repository.ProductoRepository;
import com.myfoodie.domain.repository.RecetaGuardadaRepository;
import com.myfoodie.domain.repository.RecetaRepository;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("CarritoInteligenteService — recomendaciones, carrito y listas de compra")
class CarritoInteligenteServiceTest {

    @Mock private ItemCarritoRepository itemCarritoRepository;
    @Mock private ListaCompraRepository listaCompraRepository;
    @Mock private DespensaRepository despensaRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private PreferenciasRepository preferenciasRepository;
    @Mock private MovimientoProductoRepository movimientoRepository;
    @Mock private RecetaGuardadaRepository recetaGuardadaRepository;
    @Mock private IngredienteRecetaRepository ingredienteRecetaRepository;
    @Mock private RecetaRepository recetaRepository;
    @Mock private UnidadNormalizadorService unidadNormalizadorService;
    @Mock private MatchingService matchingService;
    @Mock private LoteProductoRepository loteProductoRepository;

    @InjectMocks private CarritoInteligenteService carritoInteligenteService;

    // Por defecto, unidadNormalizadorService devuelve la cantidad/unidad tal cual (comportamiento
    // real para unidades ya objetivas), tanto para comparar disponibilidad como para el carrito.
    // matchingService, al ser un mock, no reproduce el algoritmo real: para estos tests basta con
    // que considere "coincidencia fuerte" cuando los nombres son exactamente iguales (que es el
    // comportamiento exacto que tenían antes de introducir MatchingService en este servicio).
    @BeforeEach
    void configurarNormalizadorPorDefecto() {
        lenient().when(unidadNormalizadorService.normalizarUnidades(anyDouble(), anyString()))
                .thenAnswer(inv -> new UnidadConvertidaDTO(inv.getArgument(0), inv.getArgument(1), false));
        lenient().when(unidadNormalizadorService.convertirAUnidadDeCompra(anyDouble(), anyString()))
                .thenAnswer(inv -> new UnidadConvertidaDTO(inv.getArgument(0), inv.getArgument(1), false));
        // cantidadComparable: comportamiento real (compara por familia de unidad), suficiente para
        // estos tests, que usan unidades objetivas iguales.
        UnidadNormalizadorService unidadesReal = new UnidadNormalizadorService();
        lenient().when(unidadNormalizadorService.cantidadComparable(anyDouble(), any(), any()))
                .thenAnswer(inv -> unidadesReal.cantidadComparable(
                        inv.getArgument(0), inv.getArgument(1), inv.getArgument(2)));
        lenient().when(matchingService.calcularSimilitud(anyString(), anyString())).thenAnswer(inv -> {
            String a = inv.getArgument(0);
            String b = inv.getArgument(1);
            boolean iguales = a != null && b != null && a.trim().equalsIgnoreCase(b.trim());
            return new SimilitudResultDTO(iguales ? 1.0 : 0.0, a, b, false);
        });
        lenient().when(matchingService.clasificarMatch(anyDouble())).thenAnswer(inv -> {
            double puntuacion = inv.getArgument(0);
            if (puntuacion >= 0.99) return TipoMatch.AUTOMATICO;
            if (puntuacion >= 0.60) return TipoMatch.PROPONER;
            return TipoMatch.NUEVO;
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

    private Producto producto(String id, String nombre, double cantidad, LocalDate fechaCaducidad) {
        return Producto.builder()
                .id(id).despensaId("desp-1").nombre(nombre).cantidad(cantidad)
                .unidad("unidades").fechaCaducidad(fechaCaducidad)
                .build();
    }

    private ItemCarrito item(String id, String usuarioId, String nombre, String prioridad, String estado) {
        return ItemCarrito.builder()
                .id(id).usuarioId(usuarioId).nombre(nombre).cantidad(1f).unidad("unidades")
                .prioridad(prioridad).estado(estado).noVolver(false)
                .build();
    }

    private ListaCompra lista(String id, String usuarioId, String estado, List<String> itemIds) {
        return ListaCompra.builder()
                .id(id).usuarioId(usuarioId).nombre("Mi lista").estado(estado).items(itemIds)
                .build();
    }

    private void guardarItemsComoLlegan() {
        when(itemCarritoRepository.save(any(ItemCarrito.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    // -------------------------------------------------------------------------
    // generarRecomendaciones
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("generarRecomendaciones devuelve lista vacía si el usuario no tiene despensa")
    void generarRecomendaciones_devuelveListaVacia_siNoHayDespensa() {
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.empty());

        List<ItemCarrito> resultado = carritoInteligenteService.generarRecomendaciones("user-1");

        assertThat(resultado).isEmpty();
    }

    @Test
    @DisplayName("generarRecomendaciones genera prioridad ALTA con motivo 'agotado' cuando el stock es 0")
    void generarRecomendaciones_prioridadAlta_stockAgotado() {
        Despensa d = despensa("desp-1", "user-1");
        Producto agotado = producto("p-1", "Leche", 0, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(agotado));
        guardarItemsComoLlegan();

        List<ItemCarrito> resultado = carritoInteligenteService.generarRecomendaciones("user-1");

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getPrioridad()).isEqualTo("alta");
        assertThat(resultado.get(0).getMotivo()).contains("se ha agotado");
    }

    @Test
    @DisplayName("generarRecomendaciones genera prioridad ALTA con motivo 'bajo' cuando la cantidad está bajo el umbral")
    void generarRecomendaciones_prioridadAlta_stockBajoUmbral() {
        Despensa d = despensa("desp-1", "user-1");
        Producto bajo = producto("p-1", "Sal", 1, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(bajo));
        guardarItemsComoLlegan();

        List<ItemCarrito> resultado = carritoInteligenteService.generarRecomendaciones("user-1");

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getPrioridad()).isEqualTo("alta");
        assertThat(resultado.get(0).getMotivo()).contains("es bajo");
    }

    @Test
    @DisplayName("generarRecomendaciones genera prioridad MEDIA cuando el producto caduca en 3 días o menos")
    void generarRecomendaciones_prioridadMedia_caducaPronto() {
        Despensa d = despensa("desp-1", "user-1");
        Producto caducaPronto = producto("p-1", "Yogur", 5, LocalDate.now().plusDays(2));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(caducaPronto));
        guardarItemsComoLlegan();

        List<ItemCarrito> resultado = carritoInteligenteService.generarRecomendaciones("user-1");

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getPrioridad()).isEqualTo("media");
        assertThat(resultado.get(0).getMotivo()).contains("caduca pronto");
    }

    @Test
    @DisplayName("generarRecomendaciones no duplica candidatos: si un producto cae en varias prioridades, prevalece la más alta")
    void generarRecomendaciones_noDuplicaCandidatos_prevaleceMayorPrioridad() {
        Despensa d = despensa("desp-1", "user-1");
        // Agotado (dispara alta) y además caduca mañana (dispararía media)
        Producto p = producto("p-1", "Leche", 0, LocalDate.now().plusDays(1));

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(p));
        guardarItemsComoLlegan();

        List<ItemCarrito> resultado = carritoInteligenteService.generarRecomendaciones("user-1");

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getPrioridad()).isEqualTo("alta");
    }

    @Test
    @DisplayName("generarRecomendaciones excluye productos marcados como 'no volver a recomendar'")
    void generarRecomendaciones_excluyeCandidato_siEstaMarcadoNoVolver() {
        Despensa d = despensa("desp-1", "user-1");
        Producto agotado = producto("p-1", "Leche", 0, null);
        ItemCarrito noVolver = item("item-viejo", "user-1", "Leche", "alta", "rechazado");
        noVolver.setNoVolver(true);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(agotado));
        when(itemCarritoRepository.findByUsuarioIdAndNoVolverTrue("user-1")).thenReturn(List.of(noVolver));

        List<ItemCarrito> resultado = carritoInteligenteService.generarRecomendaciones("user-1");

        assertThat(resultado).isEmpty();
        verify(itemCarritoRepository, never()).save(any());
    }

    @Test
    @DisplayName("generarRecomendaciones excluye productos que ya están pendientes o aceptados en el carrito")
    void generarRecomendaciones_excluyeCandidato_siYaEstaEnElCarrito() {
        Despensa d = despensa("desp-1", "user-1");
        Producto agotado = producto("p-1", "Leche", 0, null);
        ItemCarrito yaEnCarrito = item("item-existente", "user-1", "Leche", "alta", "pendiente");

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(agotado));
        when(itemCarritoRepository.findByUsuarioId("user-1")).thenReturn(List.of(yaEnCarrito));

        List<ItemCarrito> resultado = carritoInteligenteService.generarRecomendaciones("user-1");

        assertThat(resultado).isEmpty();
        verify(itemCarritoRepository, never()).save(any());
    }

    @Test
    @DisplayName("generarRecomendaciones asigna el usuarioId a cada candidato antes de guardarlo")
    void generarRecomendaciones_asignaUsuarioId_antesDeGuardar() {
        Despensa d = despensa("desp-1", "user-1");
        Producto agotado = producto("p-1", "Leche", 0, null);

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(agotado));
        guardarItemsComoLlegan();

        carritoInteligenteService.generarRecomendaciones("user-1");

        ArgumentCaptor<ItemCarrito> captor = ArgumentCaptor.forClass(ItemCarrito.class);
        verify(itemCarritoRepository).save(captor.capture());
        assertThat(captor.getValue().getUsuarioId()).isEqualTo("user-1");
    }

    // -------------------------------------------------------------------------
    // obtenerCarrito
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("obtenerCarrito excluye los items marcados como comprados")
    void obtenerCarrito_excluyeItemsComprados() {
        ItemCarrito pendiente = item("i-1", "user-1", "Arroz", "media", "pendiente");
        ItemCarrito comprado = item("i-2", "user-1", "Pasta", "media", "comprado");

        when(itemCarritoRepository.findByUsuarioId("user-1")).thenReturn(List.of(pendiente, comprado));

        CarritoDTO carrito = carritoInteligenteService.obtenerCarrito("user-1");

        assertThat(carrito.items()).hasSize(1);
        assertThat(carrito.items().get(0).nombre()).isEqualTo("Arroz");
    }

    @Test
    @DisplayName("obtenerCarrito calcula el resumen contando solo pendientes en los totales por prioridad y aceptados aparte")
    void obtenerCarrito_calculaResumen_correctamente() {
        ItemCarrito pendienteAlta1 = item("i-1", "user-1", "Leche", "alta", "pendiente");
        ItemCarrito pendienteAlta2 = item("i-2", "user-1", "Huevos", "alta", "pendiente");
        ItemCarrito pendienteBaja = item("i-3", "user-1", "Arroz", "baja", "pendiente");
        ItemCarrito aceptadoMedia = item("i-4", "user-1", "Pasta", "media", "aceptado");
        ItemCarrito comprado = item("i-5", "user-1", "Sal", "baja", "comprado");

        when(itemCarritoRepository.findByUsuarioId("user-1"))
                .thenReturn(List.of(pendienteAlta1, pendienteAlta2, pendienteBaja, aceptadoMedia, comprado));

        CarritoDTO carrito = carritoInteligenteService.obtenerCarrito("user-1");

        assertThat(carrito.items()).hasSize(4);
        assertThat(carrito.resumen().totalItems()).isEqualTo(3);
        assertThat(carrito.resumen().itemsAlta()).isEqualTo(2);
        assertThat(carrito.resumen().itemsBaja()).isEqualTo(1);
        assertThat(carrito.resumen().itemsMedia()).isEqualTo(0);
        assertThat(carrito.resumen().itemsAceptados()).isEqualTo(1);
    }

    @Test
    @DisplayName("obtenerCarrito ordena los items por prioridad: alta, media, baja")
    void obtenerCarrito_ordenaPorPrioridad() {
        ItemCarrito baja = item("i-1", "user-1", "Z", "baja", "pendiente");
        ItemCarrito alta = item("i-2", "user-1", "A", "alta", "pendiente");
        ItemCarrito media = item("i-3", "user-1", "M", "media", "pendiente");

        when(itemCarritoRepository.findByUsuarioId("user-1")).thenReturn(List.of(baja, alta, media));

        CarritoDTO carrito = carritoInteligenteService.obtenerCarrito("user-1");

        assertThat(carrito.items()).extracting(ItemCarritoResponseDTO::prioridad)
                .containsExactly("alta", "media", "baja");
    }

    @Test
    @DisplayName("obtenerCarrito marca productoEnDespensa=true si el nombre coincide (case-insensitive) con un producto en la despensa")
    void obtenerCarrito_marcaProductoEnDespensa_siCoincideConLaDespensa() {
        ItemCarrito item = item("i-1", "user-1", "leche", "alta", "pendiente");
        Despensa d = despensa("desp-1", "user-1");
        Producto enDespensa = producto("p-1", "Leche", 2, null);

        when(itemCarritoRepository.findByUsuarioId("user-1")).thenReturn(List.of(item));
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(enDespensa));

        CarritoDTO carrito = carritoInteligenteService.obtenerCarrito("user-1");

        assertThat(carrito.items().get(0).productoEnDespensa()).isTrue();
    }

    // -------------------------------------------------------------------------
    // aceptarItem / rechazarItem / marcarNoVolver / recuperarItem
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("aceptarItem cambia el estado del item a 'aceptado'")
    void aceptarItem_cambiaEstado_aAceptado() {
        ItemCarrito i = item("i-1", "user-1", "Leche", "alta", "pendiente");
        when(itemCarritoRepository.findById("i-1")).thenReturn(Optional.of(i));
        guardarItemsComoLlegan();

        ItemCarritoResponseDTO resultado = carritoInteligenteService.aceptarItem("user-1", "i-1");

        assertThat(resultado.estado()).isEqualTo("aceptado");
    }

    @Test
    @DisplayName("rechazarItem cambia el estado del item a 'rechazado'")
    void rechazarItem_cambiaEstado_aRechazado() {
        ItemCarrito i = item("i-1", "user-1", "Leche", "alta", "pendiente");
        when(itemCarritoRepository.findById("i-1")).thenReturn(Optional.of(i));
        guardarItemsComoLlegan();

        ItemCarritoResponseDTO resultado = carritoInteligenteService.rechazarItem("user-1", "i-1");

        assertThat(resultado.estado()).isEqualTo("rechazado");
    }

    @Test
    @DisplayName("marcarNoVolver marca noVolver=true y pasa el estado a 'rechazado'")
    void marcarNoVolver_marcaNoVolver_yRechaza() {
        ItemCarrito i = item("i-1", "user-1", "Leche", "alta", "pendiente");
        when(itemCarritoRepository.findById("i-1")).thenReturn(Optional.of(i));
        guardarItemsComoLlegan();

        ItemCarritoResponseDTO resultado = carritoInteligenteService.marcarNoVolver("user-1", "i-1");

        assertThat(resultado.estado()).isEqualTo("rechazado");
        assertThat(resultado.noVolver()).isTrue();
    }

    @Test
    @DisplayName("recuperarItem vuelve el estado a 'pendiente' y quita el noVolver")
    void recuperarItem_vuelveAPendiente_yQuitaNoVolver() {
        ItemCarrito i = item("i-1", "user-1", "Leche", "alta", "rechazado");
        i.setNoVolver(true);
        when(itemCarritoRepository.findById("i-1")).thenReturn(Optional.of(i));
        guardarItemsComoLlegan();

        ItemCarritoResponseDTO resultado = carritoInteligenteService.recuperarItem("user-1", "i-1");

        assertThat(resultado.estado()).isEqualTo("pendiente");
        assertThat(resultado.noVolver()).isFalse();
    }

    // -------------------------------------------------------------------------
    // modificarCantidad
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("modificarCantidad actualiza la cantidad y la unidad cuando se especifica")
    void modificarCantidad_actualizaCantidadYUnidad() {
        ItemCarrito i = item("i-1", "user-1", "Harina", "media", "pendiente");
        i.setCantidad(1f);
        i.setUnidad("kg");
        when(itemCarritoRepository.findById("i-1")).thenReturn(Optional.of(i));
        guardarItemsComoLlegan();

        ItemCarritoResponseDTO resultado = carritoInteligenteService.modificarCantidad("user-1", "i-1", 500f, "g");

        assertThat(resultado.cantidad()).isEqualTo(500f);
        assertThat(resultado.unidad()).isEqualTo("g");
    }

    @Test
    @DisplayName("modificarCantidad no cambia la unidad si se envía null o en blanco")
    void modificarCantidad_noCambiaUnidad_siEsNullOBlank() {
        ItemCarrito i = item("i-1", "user-1", "Harina", "media", "pendiente");
        i.setCantidad(1f);
        i.setUnidad("kg");
        when(itemCarritoRepository.findById("i-1")).thenReturn(Optional.of(i));
        guardarItemsComoLlegan();

        ItemCarritoResponseDTO resultado = carritoInteligenteService.modificarCantidad("user-1", "i-1", 2f, "  ");

        assertThat(resultado.cantidad()).isEqualTo(2f);
        assertThat(resultado.unidad()).isEqualTo("kg");
    }

    // -------------------------------------------------------------------------
    // añadirItemManual / eliminarItem
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("añadirItemManual crea el item con estado 'pendiente' y prioridad 'media'")
    void añadirItemManual_creaItemPendienteYPrioridadMedia() {
        guardarItemsComoLlegan();
        ItemCarritoRequestDTO dto = new ItemCarritoRequestDTO("Café", 1f, "paquetes", "Otros");

        AñadirItemCarritoResponseDTO resultado = carritoInteligenteService.añadirItemManual("user-1", dto);

        assertThat(resultado.accion()).isEqualTo("creado");
        assertThat(resultado.item().estado()).isEqualTo("pendiente");
        assertThat(resultado.item().prioridad()).isEqualTo("media");
        assertThat(resultado.item().nombre()).isEqualTo("Café");
    }

    // -------------------------------------------------------------------------
    // FIX-004 — Categorización automática de ingredientes (#152)
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("inferirCategoria devuelve 'lácteos' para 'leche'")
    void inferirCategoria_devuelve_lacteos_para_leche() {
        assertThat(carritoInteligenteService.inferirCategoria("Leche")).isEqualTo("lácteos");
    }

    @Test
    @DisplayName("inferirCategoria devuelve 'verduras' para 'tomate'")
    void inferirCategoria_devuelve_verduras_para_tomate() {
        assertThat(carritoInteligenteService.inferirCategoria("Tomate")).isEqualTo("verduras");
    }

    @Test
    @DisplayName("inferirCategoria devuelve 'otros' si no hay coincidencia en la tabla de mapeo")
    void inferirCategoria_devuelve_otros_si_no_hay_coincidencia() {
        assertThat(carritoInteligenteService.inferirCategoria("Kombucha")).isEqualTo("otros");
    }

    @Test
    @DisplayName("añadirItemManual sin categoría infiere la categoría automáticamente a partir del nombre")
    void añadirItemManual_sinCategoria_infiereCategoriaAutomaticamente() {
        guardarItemsComoLlegan();
        ItemCarritoRequestDTO dto = new ItemCarritoRequestDTO("Tomate", 3f, "unidades", null);

        AñadirItemCarritoResponseDTO resultado = carritoInteligenteService.añadirItemManual("user-1", dto);

        assertThat(resultado.item().categoria()).isEqualTo("verduras");
    }

    @Test
    @DisplayName("item desde receta (ingrediente faltante) tiene categoría asignada automáticamente")
    void item_desde_receta_tiene_categoria_asignada_automaticamente() {
        Despensa d = despensa("desp-1", "user-1");
        Receta receta = Receta.builder().id("receta-1").titulo("Tortilla").build();
        RecetaGuardada guardada = RecetaGuardada.builder().id("rg-1").usuarioId("user-1").recetaId("receta-1").build();
        IngredienteReceta ingrediente = IngredienteReceta.builder()
                .id("ing-1").recetaId("receta-1").nombre("Leche").cantidad(1).unidad("litros").build();

        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of());
        when(recetaGuardadaRepository.findByUsuarioId("user-1")).thenReturn(List.of(guardada));
        when(recetaRepository.findAllById(any())).thenReturn(List.of(receta));
        when(ingredienteRecetaRepository.findByRecetaIdIn(any())).thenReturn(List.of(ingrediente));
        guardarItemsComoLlegan();

        List<ItemCarrito> resultado = carritoInteligenteService.generarRecomendaciones("user-1");

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getNombre()).isEqualTo("Leche");
        assertThat(resultado.get(0).getCategoria()).isEqualTo("lácteos");
    }

    @Test
    @DisplayName("recomendación desde ingrediente de receta usa la unidad de compra (litros/kilos), no la subjetiva original")
    void item_desde_receta_usa_unidad_de_compra_paraLaRecomendacion() {
        Despensa d = despensa("desp-1", "user-1");
        Receta receta = Receta.builder().id("receta-1").titulo("Tarta").build();
        RecetaGuardada guardada = RecetaGuardada.builder().id("rg-1").usuarioId("user-1").recetaId("receta-1").build();
        IngredienteReceta ingrediente = IngredienteReceta.builder()
                .id("ing-1").recetaId("receta-1").nombre("Leche").cantidad(3).unidad("taza").build();

        when(unidadNormalizadorService.convertirAUnidadDeCompra(3, "taza"))
                .thenReturn(new UnidadConvertidaDTO(0.75, "l", true));
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(d));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of());
        when(recetaGuardadaRepository.findByUsuarioId("user-1")).thenReturn(List.of(guardada));
        when(recetaRepository.findAllById(any())).thenReturn(List.of(receta));
        when(ingredienteRecetaRepository.findByRecetaIdIn(any())).thenReturn(List.of(ingrediente));
        guardarItemsComoLlegan();

        List<ItemCarrito> resultado = carritoInteligenteService.generarRecomendaciones("user-1");

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getCantidad()).isEqualTo(0.75f);
        assertThat(resultado.get(0).getUnidad()).isEqualTo("l");
    }

    @Test
    @DisplayName("eliminarItem elimina el item del repositorio si pertenece al usuario")
    void eliminarItem_eliminaDelRepositorio_siEsPropietario() {
        ItemCarrito i = item("i-1", "user-1", "Leche", "alta", "pendiente");
        when(itemCarritoRepository.findById("i-1")).thenReturn(Optional.of(i));

        carritoInteligenteService.eliminarItem("user-1", "i-1");

        verify(itemCarritoRepository).delete(i);
    }

    @Test
    @DisplayName("eliminarItemsRechazados borra en bloque solo los items rechazados y devuelve cuántos")
    void eliminarItemsRechazados_borraEnBloque() {
        List<ItemCarrito> rechazados = List.of(
                item("i-1", "user-1", "Leche", "alta", "rechazado"),
                item("i-2", "user-1", "Pan", "media", "rechazado"));
        when(itemCarritoRepository.findByUsuarioIdAndEstado("user-1", "rechazado")).thenReturn(rechazados);

        int borrados = carritoInteligenteService.eliminarItemsRechazados("user-1");

        assertThat(borrados).isEqualTo(2);
        verify(itemCarritoRepository).deleteAll(rechazados);
    }

    // -------------------------------------------------------------------------
    // generarListaCompra
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("generarListaCompra lanza 400 si no hay items aceptados")
    void generarListaCompra_lanza400_siNoHayAceptados() {
        when(itemCarritoRepository.findByUsuarioIdAndEstado("user-1", "aceptado")).thenReturn(List.of());

        assertThatThrownBy(() -> carritoInteligenteService.generarListaCompra("user-1", null))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    @DisplayName("generarListaCompra archiva cualquier lista activa anterior antes de crear la nueva")
    void generarListaCompra_archivaListaActivaAnterior() {
        ItemCarrito aceptado = item("i-1", "user-1", "Leche", "alta", "aceptado");
        ListaCompra listaVieja = lista("lista-vieja", "user-1", "activa", List.of());

        when(itemCarritoRepository.findByUsuarioIdAndEstado("user-1", "aceptado")).thenReturn(List.of(aceptado));
        when(listaCompraRepository.findByUsuarioIdAndEstado("user-1", "activa")).thenReturn(List.of(listaVieja));
        when(listaCompraRepository.save(any(ListaCompra.class))).thenAnswer(inv -> inv.getArgument(0));

        carritoInteligenteService.generarListaCompra("user-1", "Compra semanal");

        ArgumentCaptor<ListaCompra> captor = ArgumentCaptor.forClass(ListaCompra.class);
        verify(listaCompraRepository, times(2)).save(captor.capture());
        assertThat(captor.getAllValues().get(0).getId()).isEqualTo("lista-vieja");
        assertThat(captor.getAllValues().get(0).getEstado()).isEqualTo("archivada");
        assertThat(captor.getAllValues().get(1).getEstado()).isEqualTo("activa");
    }

    @Test
    @DisplayName("generarListaCompra usa un nombre por defecto con la fecha cuando no se especifica nombre")
    void generarListaCompra_usaNombrePorDefecto_siNoSeEspecifica() {
        ItemCarrito aceptado = item("i-1", "user-1", "Leche", "alta", "aceptado");
        when(itemCarritoRepository.findByUsuarioIdAndEstado("user-1", "aceptado")).thenReturn(List.of(aceptado));
        when(listaCompraRepository.save(any(ListaCompra.class))).thenAnswer(inv -> inv.getArgument(0));

        ListaCompraResponseDTO resultado = carritoInteligenteService.generarListaCompra("user-1", null);

        assertThat(resultado.nombre()).startsWith("Lista del ");
    }

    @Test
    @DisplayName("generarListaCompra usa el nombre personalizado cuando se especifica")
    void generarListaCompra_usaNombrePersonalizado() {
        ItemCarrito aceptado = item("i-1", "user-1", "Leche", "alta", "aceptado");
        when(itemCarritoRepository.findByUsuarioIdAndEstado("user-1", "aceptado")).thenReturn(List.of(aceptado));
        when(listaCompraRepository.save(any(ListaCompra.class))).thenAnswer(inv -> inv.getArgument(0));

        ListaCompraResponseDTO resultado = carritoInteligenteService.generarListaCompra("user-1", "Compra del mes");

        assertThat(resultado.nombre()).isEqualTo("Compra del mes");
    }

    // -------------------------------------------------------------------------
    // obtenerListaActiva
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("obtenerListaActiva devuelve null si el usuario no tiene ninguna lista activa")
    void obtenerListaActiva_devuelveNull_siNoHayNinguna() {
        when(listaCompraRepository.findByUsuarioIdAndEstado("user-1", "activa")).thenReturn(List.of());

        ListaCompraResponseDTO resultado = carritoInteligenteService.obtenerListaActiva("user-1");

        assertThat(resultado).isNull();
    }

    @Test
    @DisplayName("obtenerListaActiva devuelve la lista activa del usuario si existe")
    void obtenerListaActiva_devuelveLaLista_siExiste() {
        ListaCompra activa = lista("lista-1", "user-1", "activa", List.of());
        when(listaCompraRepository.findByUsuarioIdAndEstado("user-1", "activa")).thenReturn(List.of(activa));

        ListaCompraResponseDTO resultado = carritoInteligenteService.obtenerListaActiva("user-1");

        assertThat(resultado).isNotNull();
        assertThat(resultado.id()).isEqualTo("lista-1");
    }

    // -------------------------------------------------------------------------
    // marcarItemComoComprado
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("marcarItemComoComprado cambia el estado del item a 'comprado'")
    void marcarItemComoComprado_cambiaEstado() {
        ItemCarrito i = item("i-1", "user-1", "Leche", "alta", "aceptado");
        when(itemCarritoRepository.findById("i-1")).thenReturn(Optional.of(i));
        guardarItemsComoLlegan();

        ItemCarritoResponseDTO resultado = carritoInteligenteService.marcarItemComoComprado("user-1", "i-1");

        assertThat(resultado.estado()).isEqualTo("comprado");
    }

    // -------------------------------------------------------------------------
    // añadirProductosCompradosADespensa
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("añadirProductosCompradosADespensa lanza 400 si la lista no tiene productos comprados")
    void añadirCompradosADespensa_lanza400_siNoHayComprados() {
        ItemCarrito aceptado = item("i-1", "user-1", "Leche", "alta", "aceptado");
        ListaCompra lista = lista("lista-1", "user-1", "activa", List.of("i-1"));

        when(listaCompraRepository.findById("lista-1")).thenReturn(Optional.of(lista));
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(despensa("desp-1", "user-1")));
        when(itemCarritoRepository.findAllById(any())).thenReturn(List.of(aceptado));

        assertThatThrownBy(() ->
                carritoInteligenteService.añadirProductosCompradosADespensa("user-1", "lista-1", null))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    @DisplayName("añadirProductosCompradosADespensa lanza 404 si el usuario no tiene despensa")
    void añadirCompradosADespensa_lanza404_siNoHayDespensa() {
        ListaCompra lista = lista("lista-1", "user-1", "activa", List.of("i-1"));
        when(listaCompraRepository.findById("lista-1")).thenReturn(Optional.of(lista));
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                carritoInteligenteService.añadirProductosCompradosADespensa("user-1", "lista-1", null))
                .isInstanceOf(ApiException.class)
                .hasMessage("Despensa no encontrada")
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    @DisplayName("añadirProductosCompradosADespensa usa cantidad/unidad/fecha del ajuste cuando se especifica")
    void añadirCompradosADespensa_usaDatosDelAjuste_siSeEspecifica() {
        ItemCarrito comprado = item("i-1", "user-1", "Leche", "alta", "comprado");
        comprado.setCantidad(2f);
        comprado.setUnidad("litros");
        ListaCompra lista = lista("lista-1", "user-1", "activa", List.of("i-1"));
        LocalDate caducidad = LocalDate.now().plusDays(10);

        when(listaCompraRepository.findById("lista-1")).thenReturn(Optional.of(lista));
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(despensa("desp-1", "user-1")));
        when(itemCarritoRepository.findAllById(any())).thenReturn(List.of(comprado));
        when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));

        carritoInteligenteService.añadirProductosCompradosADespensa("user-1", "lista-1",
                List.of(new ItemCompradoAjusteDTO("i-1", 500f, "g", caducidad)));

        ArgumentCaptor<Producto> captor = ArgumentCaptor.forClass(Producto.class);
        verify(productoRepository).save(captor.capture());
        assertThat(captor.getValue().getCantidad()).isEqualTo(500);
        assertThat(captor.getValue().getUnidad()).isEqualTo("g");
        assertThat(captor.getValue().getFechaCaducidad()).isEqualTo(caducidad);
    }

    @Test
    @DisplayName("añadirProductosCompradosADespensa usa cantidad/unidad del item cuando no hay ajuste")
    void añadirCompradosADespensa_usaDatosDelItem_siNoHayAjuste() {
        ItemCarrito comprado = item("i-1", "user-1", "Leche", "alta", "comprado");
        comprado.setCantidad(2f);
        comprado.setUnidad("litros");
        ListaCompra lista = lista("lista-1", "user-1", "activa", List.of("i-1"));

        when(listaCompraRepository.findById("lista-1")).thenReturn(Optional.of(lista));
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(despensa("desp-1", "user-1")));
        when(itemCarritoRepository.findAllById(any())).thenReturn(List.of(comprado));
        when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));

        carritoInteligenteService.añadirProductosCompradosADespensa("user-1", "lista-1", null);

        ArgumentCaptor<Producto> captor = ArgumentCaptor.forClass(Producto.class);
        verify(productoRepository).save(captor.capture());
        assertThat(captor.getValue().getCantidad()).isEqualTo(2);
        assertThat(captor.getValue().getUnidad()).isEqualTo("litros");
        assertThat(captor.getValue().getFechaCaducidad()).isNull();
    }

    @Test
    @DisplayName("añadirProductosCompradosADespensa marca la lista como 'completada'")
    void añadirCompradosADespensa_marcaListaComoCompletada() {
        ItemCarrito comprado = item("i-1", "user-1", "Leche", "alta", "comprado");
        ListaCompra lista = lista("lista-1", "user-1", "activa", List.of("i-1"));

        when(listaCompraRepository.findById("lista-1")).thenReturn(Optional.of(lista));
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(despensa("desp-1", "user-1")));
        when(itemCarritoRepository.findAllById(any())).thenReturn(List.of(comprado));
        when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));
        when(listaCompraRepository.save(any(ListaCompra.class))).thenAnswer(inv -> inv.getArgument(0));

        carritoInteligenteService.añadirProductosCompradosADespensa("user-1", "lista-1", null);

        ArgumentCaptor<ListaCompra> captor = ArgumentCaptor.forClass(ListaCompra.class);
        verify(listaCompraRepository).save(captor.capture());
        assertThat(captor.getValue().getEstado()).isEqualTo("completada");
    }

    // -------------------------------------------------------------------------
    // cancelarListaCompra
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("cancelarListaCompra archiva una lista activa")
    void cancelarListaCompra_archivaListaActiva() {
        ListaCompra lista = lista("lista-1", "user-1", "activa", List.of("i-1"));
        when(listaCompraRepository.findById("lista-1")).thenReturn(Optional.of(lista));
        when(listaCompraRepository.save(any(ListaCompra.class))).thenAnswer(inv -> inv.getArgument(0));

        carritoInteligenteService.cancelarListaCompra("user-1", "lista-1");

        ArgumentCaptor<ListaCompra> captor = ArgumentCaptor.forClass(ListaCompra.class);
        verify(listaCompraRepository).save(captor.capture());
        assertThat(captor.getValue().getEstado()).isEqualTo("archivada");
    }

    @Test
    @DisplayName("cancelarListaCompra lanza 400 si la lista no está activa")
    void cancelarListaCompra_lanza400_siNoEstaActiva() {
        ListaCompra lista = lista("lista-1", "user-1", "completada", List.of("i-1"));
        when(listaCompraRepository.findById("lista-1")).thenReturn(Optional.of(lista));

        assertThatThrownBy(() -> carritoInteligenteService.cancelarListaCompra("user-1", "lista-1"))
                .isInstanceOf(ApiException.class)
                .hasMessage("Solo se puede cancelar una lista activa")
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

        verify(listaCompraRepository, never()).save(any());
    }

    // -------------------------------------------------------------------------
    // Permisos — items y listas de otros usuarios
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Operar sobre un item inexistente lanza 404")
    void item_lanza404_siNoExiste() {
        when(itemCarritoRepository.findById("no-existe")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> carritoInteligenteService.aceptarItem("user-1", "no-existe"))
                .isInstanceOf(ApiException.class)
                .hasMessage("Item no encontrado")
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    @DisplayName("Operar sobre un item de otro usuario lanza 403")
    void item_lanza403_siPerteneceAOtroUsuario() {
        ItemCarrito deOtro = item("i-1", "user-2", "Leche", "alta", "pendiente");
        when(itemCarritoRepository.findById("i-1")).thenReturn(Optional.of(deOtro));

        assertThatThrownBy(() -> carritoInteligenteService.aceptarItem("user-1", "i-1"))
                .isInstanceOf(ApiException.class)
                .hasMessage("No tienes permiso sobre este item")
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    @DisplayName("Operar sobre una lista inexistente lanza 404")
    void lista_lanza404_siNoExiste() {
        when(listaCompraRepository.findById("no-existe")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> carritoInteligenteService.obtenerListaCompra("user-1", "no-existe"))
                .isInstanceOf(ApiException.class)
                .hasMessage("Lista no encontrada")
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    @DisplayName("Operar sobre una lista de otro usuario lanza 403")
    void lista_lanza403_siPerteneceAOtroUsuario() {
        ListaCompra deOtro = lista("lista-1", "user-2", "activa", List.of());
        when(listaCompraRepository.findById("lista-1")).thenReturn(Optional.of(deOtro));

        assertThatThrownBy(() -> carritoInteligenteService.obtenerListaCompra("user-1", "lista-1"))
                .isInstanceOf(ApiException.class)
                .hasMessage("No tienes permiso sobre esta lista")
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }
}
