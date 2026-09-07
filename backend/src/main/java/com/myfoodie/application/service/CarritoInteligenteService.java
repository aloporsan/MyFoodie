package com.myfoodie.application.service;

import com.myfoodie.application.dto.carrito.AñadirItemCarritoResponseDTO;
import com.myfoodie.application.dto.carrito.CarritoDTO;
import com.myfoodie.application.dto.carrito.CarritoResumenDTO;
import com.myfoodie.application.dto.carrito.ItemCarritoRequestDTO;
import com.myfoodie.application.dto.carrito.ItemCompradoAjusteDTO;
import com.myfoodie.application.dto.carrito.ItemCarritoResponseDTO;
import com.myfoodie.application.dto.carrito.ListaCompraResponseDTO;
import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import com.myfoodie.application.dto.matching.MatchItemCarritoDTO;
import com.myfoodie.application.dto.matching.MatchProductoDTO;
import com.myfoodie.application.dto.matching.ResultadoAñadirDespensaDTO;
import com.myfoodie.application.dto.unidad.UnidadConvertidaDTO;
import com.myfoodie.domain.model.Despensa;
import com.myfoodie.domain.model.IngredienteReceta;
import com.myfoodie.domain.model.ItemCarrito;
import com.myfoodie.domain.model.ListaCompra;
import com.myfoodie.domain.model.LoteProducto;
import com.myfoodie.domain.model.MovimientoProducto;
import com.myfoodie.domain.model.Preferencias;
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
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CarritoInteligenteService {

    private static final int DIAS_CADUCA_PRONTO = 3;
    private static final int DIAS_CONSUMIDO_RECIENTE = 7;
    private static final int DIAS_CONSUMIDO_HABITUAL = 30;
    private static final double RATIO_INSUFICIENTE = 0.5;
    private static final double COMPLETITUD_RECETA_CASI_LISTA = 0.7;
    private static final DateTimeFormatter FORMATO_FECHA_LISTA =
            DateTimeFormatter.ofPattern("d 'de' MMMM", new Locale("es", "ES"));

    private static final Map<String, String> CATEGORIAS_INGREDIENTES = Map.ofEntries(
            // Lácteos
            Map.entry("leche", "lácteos"), Map.entry("queso", "lácteos"),
            Map.entry("yogur", "lácteos"), Map.entry("mantequilla", "lácteos"),
            // Verduras
            Map.entry("tomate", "verduras"), Map.entry("cebolla", "verduras"),
            Map.entry("ajo", "verduras"), Map.entry("pimiento", "verduras"),
            Map.entry("zanahoria", "verduras"), Map.entry("lechuga", "verduras"),
            Map.entry("patata", "verduras"),
            // Frutas
            Map.entry("manzana", "frutas"), Map.entry("naranja", "frutas"),
            Map.entry("limon", "frutas"), Map.entry("platano", "frutas"),
            // Carnes
            Map.entry("pollo", "carnes"), Map.entry("ternera", "carnes"),
            Map.entry("cerdo", "carnes"), Map.entry("jamon", "carnes"),
            // Pescados
            Map.entry("salmon", "pescados"), Map.entry("atun", "pescados"),
            Map.entry("merluza", "pescados"),
            // Huevos
            Map.entry("huevo", "huevos"),
            // Legumbres
            Map.entry("lenteja", "legumbres"), Map.entry("garbanzo", "legumbres"),
            Map.entry("judia", "legumbres"),
            // Cereales
            Map.entry("arroz", "cereales"), Map.entry("pasta", "cereales"),
            Map.entry("harina", "cereales"), Map.entry("pan", "cereales"),
            // Aceites y condimentos
            Map.entry("aceite", "aceites"), Map.entry("vinagre", "condimentos"),
            Map.entry("sal", "condimentos"), Map.entry("azucar", "condimentos")
    );

    private final ItemCarritoRepository itemCarritoRepository;
    private final ListaCompraRepository listaCompraRepository;
    private final DespensaRepository despensaRepository;
    private final ProductoRepository productoRepository;
    private final PreferenciasRepository preferenciasRepository;
    private final MovimientoProductoRepository movimientoRepository;
    private final RecetaGuardadaRepository recetaGuardadaRepository;
    private final IngredienteRecetaRepository ingredienteRecetaRepository;
    private final RecetaRepository recetaRepository;
    private final UnidadNormalizadorService unidadNormalizadorService;
    private final MatchingService matchingService;
    private final LoteProductoRepository loteProductoRepository;

    // -------------------------------------------------------------------------
    // Generación de recomendaciones
    // -------------------------------------------------------------------------

    public List<ItemCarrito> generarRecomendaciones(String usuarioId) {
        Despensa despensa = despensaRepository.findByUsuarioId(usuarioId).orElse(null);
        if (despensa == null) {
            return List.of();
        }

        List<Producto> productos = productoRepository.findByDespensaId(despensa.getId());
        int umbral = obtenerGlobalUmbral(usuarioId);
        // Recetas guardadas + sus ingredientes en 2 consultas (no una por receta y prioridad).
        List<RecetaConIngredientes> guardadas = cargarRecetasGuardadas(usuarioId);

        Set<String> noVolver = itemCarritoRepository.findByUsuarioIdAndNoVolverTrue(usuarioId)
                .stream().map(i -> normalizar(i.getNombre())).collect(Collectors.toSet());

        List<ItemCarrito> itemsEnCarritoActivos = itemCarritoRepository.findByUsuarioId(usuarioId).stream()
                .filter(i -> "pendiente".equals(i.getEstado()) || "aceptado".equals(i.getEstado()))
                .toList();

        Map<String, ItemCarrito> candidatos = new LinkedHashMap<>();

        candidatosPrioridadAlta(productos, umbral, guardadas).forEach(c -> añadirCandidato(candidatos, c));
        candidatosPrioridadMedia(despensa, productos, umbral, guardadas).forEach(c -> añadirCandidato(candidatos, c));
        candidatosPrioridadBaja(despensa, productos, umbral, guardadas).forEach(c -> añadirCandidato(candidatos, c));

        List<ItemCarrito> nuevos = new ArrayList<>();
        for (ItemCarrito candidato : candidatos.values()) {
            String clave = normalizar(candidato.getNombre());
            boolean similarEnCarrito = itemsEnCarritoActivos.stream()
                    .anyMatch(i -> esCoincidenciaFuerte(candidato.getNombre(), i.getNombre()));
            if (noVolver.contains(clave) || similarEnCarrito) {
                continue;
            }
            candidato.setUsuarioId(usuarioId);
            nuevos.add(itemCarritoRepository.save(candidato));
        }
        return nuevos;
    }

    // -------------------------------------------------------------------------
    // Gestión del carrito
    // -------------------------------------------------------------------------

    public CarritoDTO obtenerCarrito(String usuarioId) {
        List<ItemCarrito> todos = itemCarritoRepository.findByUsuarioId(usuarioId)
                .stream()
                .filter(i -> !"comprado".equals(i.getEstado()))
                .sorted(Comparator.comparingInt(i -> ordenPrioridad(i.getPrioridad())))
                .toList();

        List<ItemCarrito> pendientes = todos.stream()
                .filter(i -> "pendiente".equals(i.getEstado()))
                .toList();

        Set<String> nombresEnDespensa = nombresEnDespensa(usuarioId);
        List<ItemCarritoResponseDTO> items = todos.stream()
                .map(i -> toItemDTO(i, nombresEnDespensa))
                .toList();

        long itemsAceptados = todos.stream().filter(i -> "aceptado".equals(i.getEstado())).count();
        CarritoResumenDTO resumen = new CarritoResumenDTO(
                pendientes.size(),
                (int) pendientes.stream().filter(i -> "alta".equals(i.getPrioridad())).count(),
                (int) pendientes.stream().filter(i -> "media".equals(i.getPrioridad())).count(),
                (int) pendientes.stream().filter(i -> "baja".equals(i.getPrioridad())).count(),
                (int) itemsAceptados
        );
        return new CarritoDTO(items, resumen);
    }

    public ItemCarritoResponseDTO aceptarItem(String usuarioId, String itemId) {
        ItemCarrito item = getItemDeUsuario(usuarioId, itemId);
        item.setEstado("aceptado");
        item.setUpdatedAt(LocalDateTime.now());
        return toItemDTO(itemCarritoRepository.save(item), nombresEnDespensa(usuarioId));
    }

    public ItemCarritoResponseDTO rechazarItem(String usuarioId, String itemId) {
        ItemCarrito item = getItemDeUsuario(usuarioId, itemId);
        item.setEstado("rechazado");
        item.setUpdatedAt(LocalDateTime.now());
        return toItemDTO(itemCarritoRepository.save(item), nombresEnDespensa(usuarioId));
    }

    public ItemCarritoResponseDTO marcarNoVolver(String usuarioId, String itemId) {
        ItemCarrito item = getItemDeUsuario(usuarioId, itemId);
        item.setNoVolver(true);
        item.setEstado("rechazado");
        item.setUpdatedAt(LocalDateTime.now());
        return toItemDTO(itemCarritoRepository.save(item), nombresEnDespensa(usuarioId));
    }

    public ItemCarritoResponseDTO recuperarItem(String usuarioId, String itemId) {
        ItemCarrito item = getItemDeUsuario(usuarioId, itemId);
        item.setEstado("pendiente");
        item.setNoVolver(false);
        item.setUpdatedAt(LocalDateTime.now());
        return toItemDTO(itemCarritoRepository.save(item), nombresEnDespensa(usuarioId));
    }

    public ItemCarritoResponseDTO modificarCantidad(String usuarioId, String itemId, Float nuevaCantidad, String nuevaUnidad) {
        ItemCarrito item = getItemDeUsuario(usuarioId, itemId);
        boolean cambiaUnidad = nuevaUnidad != null && !nuevaUnidad.isBlank();
        UnidadConvertidaDTO compra = cambiaUnidad
                ? normalizarUnidadDeCompra(nuevaCantidad, nuevaUnidad)
                : new UnidadConvertidaDTO(nuevaCantidad != null ? nuevaCantidad : 0d, item.getUnidad(), false);
        item.setCantidad((float) compra.cantidadConvertida());
        if (cambiaUnidad) {
            item.setUnidad(compra.unidadConvertida());
        }
        item.setUpdatedAt(LocalDateTime.now());
        return toItemDTO(itemCarritoRepository.save(item), nombresEnDespensa(usuarioId));
    }

    public AñadirItemCarritoResponseDTO añadirItemManual(String usuarioId, ItemCarritoRequestDTO dto) {
        List<MatchItemCarritoDTO> matches = matchingService.buscarItemSimilarEnCarrito(usuarioId, dto.nombre());
        MatchItemCarritoDTO mejorMatch = matches.isEmpty() ? null : matches.get(0);

        // Las unidades subjetivas que el usuario teclea a mano (cucharada, taza, pizca...) se
        // pasan a la unidad de compra igual que los items generados desde receta (RF-DESP-019),
        // para que la lista de la compra no acabe mezclando "2 cucharadas" con litros y kilos.
        UnidadConvertidaDTO compra = normalizarUnidadDeCompra(dto.cantidad(), dto.unidad());
        float cantidadNormalizada = (float) compra.cantidadConvertida();

        if (mejorMatch != null && mejorMatch.tipoMatch() == TipoMatch.AUTOMATICO) {
            ItemCarrito existente = getItemDeUsuario(usuarioId, mejorMatch.item().id());
            float cantidadActual = existente.getCantidad() != null ? existente.getCantidad() : 0f;
            existente.setCantidad(cantidadActual + cantidadNormalizada);
            existente.setUpdatedAt(LocalDateTime.now());
            ItemCarritoResponseDTO actualizado = toItemDTO(itemCarritoRepository.save(existente), nombresEnDespensa(usuarioId));
            return new AñadirItemCarritoResponseDTO("actualizado", actualizado, null, mejorMatch.similitud());
        }

        String categoria = (dto.categoria() != null && !dto.categoria().isBlank())
                ? dto.categoria()
                : inferirCategoria(dto.nombre());
        ItemCarrito item = ItemCarrito.builder()
                .usuarioId(usuarioId)
                .nombre(dto.nombre())
                .cantidad(cantidadNormalizada)
                .unidad(compra.unidadConvertida())
                .categoria(categoria)
                .prioridad("media")
                .estado("pendiente")
                .build();
        ItemCarritoResponseDTO creado = toItemDTO(itemCarritoRepository.save(item), nombresEnDespensa(usuarioId));

        if (mejorMatch != null && mejorMatch.tipoMatch() == TipoMatch.PROPONER) {
            return new AñadirItemCarritoResponseDTO("sugerencia", creado, mejorMatch.item(), mejorMatch.similitud());
        }

        return new AñadirItemCarritoResponseDTO("creado", creado, null, null);
    }

    public void eliminarItem(String usuarioId, String itemId) {
        itemCarritoRepository.delete(getItemDeUsuario(usuarioId, itemId));
    }

    // Borra en bloque todos los items rechazados del usuario. Es permanente: no vuelven a
    // proponerse salvo que se regeneren las recomendaciones desde cero.
    public int eliminarItemsRechazados(String usuarioId) {
        List<ItemCarrito> rechazados = itemCarritoRepository.findByUsuarioIdAndEstado(usuarioId, "rechazado");
        itemCarritoRepository.deleteAll(rechazados);
        return rechazados.size();
    }

    @Async
    public void actualizarCarritoTrasModificacionDespensa(String usuarioId) {
        List<ItemCarrito> pendientesAutomaticos = itemCarritoRepository
                .findByUsuarioIdAndEstado(usuarioId, "pendiente")
                .stream()
                .filter(i -> i.getMotivo() != null)
                .toList();
        itemCarritoRepository.deleteAll(pendientesAutomaticos);
        generarRecomendaciones(usuarioId);
    }

    // -------------------------------------------------------------------------
    // Lista de compra
    // -------------------------------------------------------------------------

    public ListaCompraResponseDTO generarListaCompra(String usuarioId, String nombre) {
        List<ItemCarrito> aceptados = itemCarritoRepository.findByUsuarioIdAndEstado(usuarioId, "aceptado");
        if (aceptados.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No hay items aceptados para generar la lista");
        }

        // Solo puede existir una lista activa a la vez: las anteriores quedan archivadas.
        listaCompraRepository.findByUsuarioIdAndEstado(usuarioId, "activa").forEach(activa -> {
            activa.setEstado("archivada");
            activa.setUpdatedAt(LocalDateTime.now());
            listaCompraRepository.save(activa);
        });

        String nombreLista = (nombre == null || nombre.isBlank())
                ? "Lista del " + LocalDate.now().format(FORMATO_FECHA_LISTA)
                : nombre;

        ListaCompra lista = ListaCompra.builder()
                .usuarioId(usuarioId)
                .nombre(nombreLista)
                .items(aceptados.stream().map(ItemCarrito::getId).toList())
                .build();
        return toListaDTO(listaCompraRepository.save(lista), usuarioId);
    }

    public ListaCompraResponseDTO obtenerListaActiva(String usuarioId) {
        return listaCompraRepository.findByUsuarioIdAndEstado(usuarioId, "activa").stream()
                .findFirst()
                .map(lista -> toListaDTO(lista, usuarioId))
                .orElse(null);
    }

    public List<ListaCompraResponseDTO> obtenerListasCompra(String usuarioId) {
        return listaCompraRepository.findByUsuarioIdOrderByCreatedAtDesc(usuarioId).stream()
                .map(l -> toListaDTO(l, usuarioId))
                .toList();
    }

    public ListaCompraResponseDTO obtenerListaCompra(String usuarioId, String listaId) {
        return toListaDTO(getListaDeUsuario(usuarioId, listaId), usuarioId);
    }

    public void cancelarListaCompra(String usuarioId, String listaId) {
        ListaCompra lista = getListaDeUsuario(usuarioId, listaId);
        if (!"activa".equals(lista.getEstado())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Solo se puede cancelar una lista activa");
        }
        lista.setEstado("archivada");
        lista.setUpdatedAt(LocalDateTime.now());
        listaCompraRepository.save(lista);
    }

    public ItemCarritoResponseDTO marcarItemComoComprado(String usuarioId, String itemId) {
        ItemCarrito item = getItemDeUsuario(usuarioId, itemId);
        item.setEstado("comprado");
        item.setUpdatedAt(LocalDateTime.now());
        return toItemDTO(itemCarritoRepository.save(item), nombresEnDespensa(usuarioId));
    }

    public List<ResultadoAñadirDespensaDTO> añadirProductosCompradosADespensa(String usuarioId, String listaId,
                                                   List<ItemCompradoAjusteDTO> ajustes) {
        ListaCompra lista = getListaDeUsuario(usuarioId, listaId);
        Despensa despensa = despensaRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Despensa no encontrada"));

        List<ItemCarrito> comprados = itemCarritoRepository.findAllById(lista.getItems()).stream()
                .filter(i -> "comprado".equals(i.getEstado()))
                .toList();
        if (comprados.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La lista no tiene productos comprados");
        }

        Map<String, ItemCompradoAjusteDTO> ajustesPorItemId = ajustes == null ? Map.of()
                : ajustes.stream().collect(Collectors.toMap(ItemCompradoAjusteDTO::itemId, a -> a));

        int globalUmbral = obtenerGlobalUmbral(usuarioId);
        List<ResultadoAñadirDespensaDTO> resultados = new ArrayList<>();

        // Se cargan los productos de la despensa UNA vez y se van actualizando en memoria
        // (en vez de volver a consultar Mongo por cada item, como hacía buscarProductoSimilarEnDespensa
        // al llamarla dentro del bucle): con N items comprados eso eran 3*N consultas evitables.
        // Se sigue actualizando esta copia local para que dos items iguales dentro del mismo lote
        // (p. ej. dos líneas de "Leche") se sigan detectando entre sí.
        List<Producto> productosActuales = new ArrayList<>(productoRepository.findByDespensaId(despensa.getId()));

        for (ItemCarrito item : comprados) {
            ItemCompradoAjusteDTO ajuste = ajustesPorItemId.get(item.getId());
            Float cantidad = ajuste != null && ajuste.cantidad() != null ? ajuste.cantidad() : item.getCantidad();
            String unidad = ajuste != null && ajuste.unidad() != null ? ajuste.unidad() : item.getUnidad();
            LocalDate fechaCaducidad = ajuste != null ? ajuste.fechaCaducidad() : null;

            List<MatchProductoDTO> matches = matchingService.buscarProductoSimilarEnDespensa(
                    productosActuales, globalUmbral, item.getNombre());
            MatchProductoDTO mejorMatch = matches.isEmpty() ? null : matches.get(0);

            if (mejorMatch != null && mejorMatch.tipoMatch() == TipoMatch.AUTOMATICO) {
                Producto existente = productosActuales.stream()
                        .filter(p -> p.getId().equals(mejorMatch.producto().id()))
                        .findFirst()
                        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Producto no encontrado"));
                ProductoResponseDTO actualizado = registrarCompraEnProductoExistente(
                        usuarioId, despensa, existente, cantidad != null ? cantidad : 0f, unidad, fechaCaducidad, globalUmbral);
                resultados.add(new ResultadoAñadirDespensaDTO(
                        item.getNombre(), "actualizado", actualizado, null, mejorMatch.similitud()));
            } else if (mejorMatch != null && mejorMatch.tipoMatch() == TipoMatch.PROPONER) {
                resultados.add(new ResultadoAñadirDespensaDTO(
                        item.getNombre(), "sugerencia", mejorMatch.producto(), null, mejorMatch.similitud()));
            } else {
                Producto nuevo = crearProductoConPrimerLote(despensa, usuarioId, item.getNombre(),
                        cantidad != null ? cantidad : 0f, unidad, item.getCategoria(), fechaCaducidad);
                productosActuales.add(nuevo);
                resultados.add(new ResultadoAñadirDespensaDTO(
                        item.getNombre(), "creado", null, toProductoResponseDTO(nuevo, globalUmbral), null));
            }
        }
        despensa.setUpdatedAt(LocalDateTime.now());
        despensaRepository.save(despensa);

        lista.setEstado("completada");
        lista.setUpdatedAt(LocalDateTime.now());
        listaCompraRepository.save(lista);

        return resultados;
    }

    // actualiza sumando el delta directamente vía productoRepository: no se puede inyectar DespensaService
    // aquí porque DespensaService ya depende de CarritoInteligenteService (dependencia circular)
    private ProductoResponseDTO actualizarCantidadProducto(String usuarioId, Producto p,
                                                             float delta, int globalUmbral) {
        double cantidadAnterior = p.getCantidad();
        double cantidadNueva = cantidadAnterior + delta;
        p.setCantidad(cantidadNueva);
        p.setUpdatedAt(LocalDateTime.now());
        Producto guardado = productoRepository.save(p);

        movimientoRepository.save(MovimientoProducto.builder()
                .productoId(guardado.getId())
                .despensaId(guardado.getDespensaId())
                .usuarioId(usuarioId)
                .nombre(guardado.getNombre())
                .tipo("cantidad_actualizada")
                .descripcion("Añadido desde lista de compra")
                .cantidadAnterior(cantidadAnterior)
                .cantidadNueva(cantidadNueva)
                .build());

        return toProductoResponseDTO(guardado, globalUmbral);
    }

    // Misma decisión de 3 vías que DespensaService.registrarEntradaProducto, pero sin poder
    // reutilizarla (dependencia circular, ver arriba): tieneLotes ya activo -> nuevo lote;
    // sin lotes pero con fecha de caducidad distinta a la que ya tenía -> migrar el stock
    // actual a un lote "legado" antes de sumar la nueva compra como lote; en otro caso, sumar
    // la cantidad directamente como hasta ahora.
    private ProductoResponseDTO registrarCompraEnProductoExistente(String usuarioId, Despensa despensa, Producto producto,
                                                                     float cantidad, String unidad,
                                                                     LocalDate fechaCaducidad, int globalUmbral) {
        if (Boolean.TRUE.equals(producto.getTieneLotes())) {
            crearLote(despensa, usuarioId, producto, cantidad, unidad, fechaCaducidad, "carrito");
            return toProductoResponseDTO(producto, globalUmbral);
        }

        if (fechaCaducidad != null && producto.getFechaCaducidad() != null
                && !fechaCaducidad.equals(producto.getFechaCaducidad())) {
            loteProductoRepository.save(LoteProducto.builder()
                    .productoId(producto.getId())
                    .despensaId(despensa.getId())
                    .usuarioId(usuarioId)
                    .cantidad((float) producto.getCantidad())
                    .unidad(producto.getUnidad())
                    .fechaCaducidad(producto.getFechaCaducidad())
                    .fechaCompra(producto.getFechaCompra() != null ? producto.getFechaCompra() : LocalDate.now())
                    .origen("manual")
                    .build());
            crearLote(despensa, usuarioId, producto, cantidad, unidad, fechaCaducidad, "carrito");
            return toProductoResponseDTO(producto, globalUmbral);
        }

        return actualizarCantidadProducto(usuarioId, producto, cantidad, globalUmbral);
    }

    private void crearLote(Despensa despensa, String usuarioId, Producto producto, float cantidad, String unidad,
                            LocalDate fechaCaducidad, String origen) {
        producto.setTieneLotes(true);
        loteProductoRepository.save(LoteProducto.builder()
                .productoId(producto.getId())
                .despensaId(despensa.getId())
                .usuarioId(usuarioId)
                .cantidad(cantidad)
                .unidad(unidad)
                .fechaCaducidad(fechaCaducidad)
                .fechaCompra(LocalDate.now())
                .origen(origen)
                .build());

        List<LoteProducto> lotesConStock = loteProductoRepository
                .findByProductoIdAndCantidadGreaterThan(producto.getId(), 0f);
        float total = lotesConStock.stream().map(LoteProducto::getCantidad).filter(Objects::nonNull)
                .reduce(0f, Float::sum);
        LocalDate minimaCaducidad = lotesConStock.stream()
                .map(LoteProducto::getFechaCaducidad)
                .filter(Objects::nonNull)
                .min(Comparator.naturalOrder())
                .orElse(null);

        producto.setCantidad(total);
        producto.setFechaCaducidad(minimaCaducidad);
        producto.setUpdatedAt(LocalDateTime.now());
        Producto guardado = productoRepository.save(producto);

        movimientoRepository.save(MovimientoProducto.builder()
                .productoId(guardado.getId())
                .despensaId(guardado.getDespensaId())
                .usuarioId(usuarioId)
                .nombre(guardado.getNombre())
                .tipo("lote_añadido")
                .descripcion("Añadido desde lista de compra")
                .cantidadNueva((double) guardado.getCantidad())
                .build());
    }

    private Producto crearProductoConPrimerLote(Despensa despensa, String usuarioId, String nombre, float cantidad,
                                                  String unidad, String categoria, LocalDate fechaCaducidad) {
        Producto nuevo = productoRepository.save(Producto.builder()
                .despensaId(despensa.getId())
                .nombre(nombre)
                .cantidad(cantidad)
                .unidad(unidad)
                .categoria(categoria)
                .fechaCaducidad(fechaCaducidad)
                .fechaCompra(LocalDate.now())
                .tieneLotes(true)
                .build());

        loteProductoRepository.save(LoteProducto.builder()
                .productoId(nuevo.getId())
                .despensaId(despensa.getId())
                .usuarioId(usuarioId)
                .cantidad(cantidad)
                .unidad(unidad)
                .fechaCaducidad(fechaCaducidad)
                .fechaCompra(LocalDate.now())
                .origen("carrito")
                .build());

        movimientoRepository.save(MovimientoProducto.builder()
                .productoId(nuevo.getId())
                .despensaId(despensa.getId())
                .usuarioId(usuarioId)
                .nombre(nuevo.getNombre())
                .tipo("añadido")
                .descripcion("Añadido desde lista de compra")
                .cantidadNueva((double) cantidad)
                .build());

        return nuevo;
    }

    private String calcularEstado(Producto p, int umbral) {
        if (p.getCantidad() <= 0) {
            return "sin_stock";
        }
        Integer dias = diasHastaCaducidad(p);
        if (dias != null && dias < 0) return "caducado";
        if (dias != null && dias == 0) return "caduca_hoy";
        if (dias != null && dias <= 3) return "caduca_pronto";
        if (p.getCantidad() <= umbral) return "bajoStock";
        if (dias != null && dias <= 7) return "caduca_semana";
        if (dias != null && dias <= 30) return "caduca_mes";
        return "normal";
    }

    private ProductoResponseDTO toProductoResponseDTO(Producto p, int globalUmbral) {
        int umbralEfectivo = p.getStockMinimo() != null ? p.getStockMinimo() : globalUmbral;
        boolean alertaCompra = p.getCantidad() <= umbralEfectivo;
        String estado = calcularEstado(p, umbralEfectivo);
        return new ProductoResponseDTO(
                p.getId(),
                p.getDespensaId(),
                p.getNombre(),
                p.getCantidad(),
                p.getUnidad(),
                p.getUnidadOriginal(),
                p.getCategoria(),
                p.getFechaCaducidad(),
                p.getFechaCompra(),
                p.getMarca(),
                p.getNotas(),
                p.getStockMinimo(),
                alertaCompra,
                estado,
                diasHastaCaducidad(p),
                null,
                p.getCreatedAt(),
                p.getUpdatedAt(),
                p.getTieneLotes(),
                !"sin_stock".equals(estado),
                null
        );
    }

    private record RecetaConIngredientes(Receta receta, List<IngredienteReceta> ingredientes) {}

    // Las 3 prioridades recorren las mismas recetas guardadas: se cargan una vez (receta +
    // ingredientes) en 2 consultas en vez de una por receta y prioridad (N+1).
    private List<RecetaConIngredientes> cargarRecetasGuardadas(String usuarioId) {
        List<String> recetaIds = recetaGuardadaRepository.findByUsuarioId(usuarioId).stream()
                .map(RecetaGuardada::getRecetaId)
                .distinct()
                .toList();
        if (recetaIds.isEmpty()) {
            return List.of();
        }
        Map<String, List<IngredienteReceta>> ingredientesPorReceta = ingredienteRecetaRepository
                .findByRecetaIdIn(recetaIds).stream()
                .collect(Collectors.groupingBy(IngredienteReceta::getRecetaId));
        return recetaRepository.findAllById(recetaIds).stream()
                .map(r -> new RecetaConIngredientes(r, ingredientesPorReceta.getOrDefault(r.getId(), List.of())))
                .toList();
    }

    // -------------------------------------------------------------------------
    // Prioridad ALTA
    // -------------------------------------------------------------------------

    private List<ItemCarrito> candidatosPrioridadAlta(List<Producto> productos, int umbral,
                                                        List<RecetaConIngredientes> recetasGuardadas) {
        List<ItemCarrito> resultado = new ArrayList<>();

        for (Producto p : productos) {
            if (p.getCantidad() <= 0) {
                resultado.add(nuevoItem(p.getNombre(), reposicion(p), p.getUnidad(), p.getCategoria(),
                        "alta", "Tu stock de " + p.getNombre() + " se ha agotado", null));
            } else if (p.getCantidad() <= umbral) {
                resultado.add(nuevoItem(p.getNombre(), reposicion(p), p.getUnidad(), p.getCategoria(),
                        "alta", "Tu stock de " + p.getNombre() + " es bajo", null));
            }
        }

        for (RecetaConIngredientes rci : recetasGuardadas) {
            Receta receta = rci.receta();
            List<IngredienteReceta> ingredientes = rci.ingredientes();
            for (IngredienteReceta ingrediente : ingredientes) {
                double ratio = ratioDisponibilidad(ingrediente, productos);
                if (ratio == 0) {
                    resultado.add(nuevoItemDesdeIngrediente(ingrediente, "alta",
                            "Necesitas " + ingrediente.getNombre() + " para preparar " + receta.getTitulo(),
                            receta.getId()));
                }
            }
        }
        return resultado;
    }

    // -------------------------------------------------------------------------
    // Prioridad MEDIA
    // -------------------------------------------------------------------------

    private List<ItemCarrito> candidatosPrioridadMedia(Despensa despensa, List<Producto> productos, int umbral,
                                                         List<RecetaConIngredientes> recetasGuardadas) {
        List<ItemCarrito> resultado = new ArrayList<>();

        for (Producto p : productos) {
            Integer dias = diasHastaCaducidad(p);
            if (dias != null && dias >= 0 && dias <= DIAS_CADUCA_PRONTO) {
                resultado.add(nuevoItem(p.getNombre(), reposicion(p), p.getUnidad(), p.getCategoria(),
                        "media", "Tu " + p.getNombre() + " caduca pronto, conviene reponerlo antes de que se acabe",
                        null));
            }
        }

        LocalDateTime ahora = LocalDateTime.now();
        List<MovimientoProducto> consumidos = movimientoRepository
                .findByDespensaIdAndTipoAndMotivo(despensa.getId(), "eliminado", "consumido");
        for (MovimientoProducto m : consumidos) {
            long dias = ChronoUnit.DAYS.between(m.getCreatedAt(), ahora);
            if (dias >= 0 && dias <= DIAS_CONSUMIDO_RECIENTE
                    && !enDespensaConStockSuficiente(m.getNombre(), productos, umbral)) {
                resultado.add(nuevoItem(m.getNombre(), 1f, null, null, "media",
                        "Compraste " + m.getNombre() + " hace " + dias
                                + " días, es probable que lo necesites pronto", null));
            }
        }

        for (RecetaConIngredientes rci : recetasGuardadas) {
            Receta receta = rci.receta();
            List<IngredienteReceta> ingredientes = rci.ingredientes();
            for (IngredienteReceta ingrediente : ingredientes) {
                double ratio = ratioDisponibilidad(ingrediente, productos);
                if (ratio > 0 && ratio < RATIO_INSUFICIENTE) {
                    resultado.add(nuevoItemDesdeIngrediente(ingrediente, "media",
                            "Tienes poco " + ingrediente.getNombre() + " para preparar " + receta.getTitulo(),
                            receta.getId()));
                }
            }
        }
        return resultado;
    }

    // -------------------------------------------------------------------------
    // Prioridad BAJA
    // -------------------------------------------------------------------------

    private List<ItemCarrito> candidatosPrioridadBaja(Despensa despensa, List<Producto> productos, int umbral,
                                                        List<RecetaConIngredientes> recetasGuardadas) {
        List<ItemCarrito> resultado = new ArrayList<>();

        LocalDateTime ahora = LocalDateTime.now();
        List<MovimientoProducto> consumidos = movimientoRepository
                .findByDespensaIdAndTipoAndMotivo(despensa.getId(), "eliminado", "consumido");
        for (MovimientoProducto m : consumidos) {
            long dias = ChronoUnit.DAYS.between(m.getCreatedAt(), ahora);
            if (dias > DIAS_CONSUMIDO_RECIENTE && dias <= DIAS_CONSUMIDO_HABITUAL
                    && !enDespensaConStockSuficiente(m.getNombre(), productos, umbral)) {
                resultado.add(nuevoItem(m.getNombre(), 1f, null, null, "baja",
                        "Sueles comprar " + m.getNombre()
                                + " cada cierto tiempo, podrías necesitarlo pronto", null));
            }
        }

        Map<String, List<Producto>> porCategoria = productos.stream()
                .filter(p -> p.getCategoria() != null)
                .collect(Collectors.groupingBy(Producto::getCategoria));
        for (Map.Entry<String, List<Producto>> entry : porCategoria.entrySet()) {
            List<Producto> deLaCategoria = entry.getValue();
            if (deLaCategoria.size() < 2) continue;
            double media = deLaCategoria.stream().mapToDouble(Producto::getCantidad).average().orElse(0);
            if (media <= umbral) {
                Producto masBajo = deLaCategoria.stream()
                        .min((a, b) -> Double.compare(a.getCantidad(), b.getCantidad())).orElseThrow();
                resultado.add(nuevoItem(masBajo.getNombre(), reposicion(masBajo), masBajo.getUnidad(),
                        entry.getKey(), "baja",
                        "Tu categoría " + entry.getKey() + " tiene el stock bajo en general, podrías reponer "
                                + masBajo.getNombre(), null));
            }
        }

        for (RecetaConIngredientes rci : recetasGuardadas) {
            Receta receta = rci.receta();
            List<IngredienteReceta> ingredientes = rci.ingredientes();
            if (ingredientes.isEmpty()) continue;

            long cubiertos = ingredientes.stream()
                    .filter(i -> ratioDisponibilidad(i, productos) >= 1).count();
            double completitud = (double) cubiertos / ingredientes.size();
            if (completitud < COMPLETITUD_RECETA_CASI_LISTA) continue;

            for (IngredienteReceta ingrediente : ingredientes) {
                double ratio = ratioDisponibilidad(ingrediente, productos);
                if (ratio >= RATIO_INSUFICIENTE && ratio < 1) {
                    resultado.add(nuevoItemDesdeIngrediente(ingrediente, "baja",
                            "Te falta poco " + ingrediente.getNombre() + " para completar " + receta.getTitulo()
                                    + ", que ya tienes casi lista", receta.getId()));
                }
            }
        }
        return resultado;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private void añadirCandidato(Map<String, ItemCarrito> candidatos, ItemCarrito candidato) {
        candidatos.putIfAbsent(normalizar(candidato.getNombre()), candidato);
    }

    private ItemCarrito nuevoItem(String nombre, Float cantidad, String unidad, String categoria,
                                   String prioridad, String motivo, String recetaId) {
        return ItemCarrito.builder()
                .nombre(nombre)
                .cantidad(cantidad)
                .unidad(unidad)
                .categoria(categoria)
                .prioridad(prioridad)
                .motivo(motivo)
                .recetaId(recetaId)
                .build();
    }

    private ItemCarrito nuevoItemDesdeIngrediente(IngredienteReceta ingrediente, String prioridad, String motivo,
                                                    String recetaId) {
        UnidadConvertidaDTO compra = unidadNormalizadorService
                .convertirAUnidadDeCompra(ingrediente.getCantidad(), ingrediente.getUnidad());
        return nuevoItem(ingrediente.getNombre(), (float) compra.cantidadConvertida(), compra.unidadConvertida(),
                inferirCategoria(ingrediente.getNombre()), prioridad, motivo, recetaId);
    }

    // Deja cantidad/unidad de un item introducido a mano listas para la lista de la compra:
    // si la unidad es subjetiva (cucharada, taza...) la pasa a unidad de compra (l/kg); si no,
    // la devuelve tal cual.
    private UnidadConvertidaDTO normalizarUnidadDeCompra(Float cantidad, String unidad) {
        double valor = cantidad != null ? cantidad : 0d;
        if (unidad == null || !unidadNormalizadorService.esUnidadSubjetiva(unidad)) {
            return new UnidadConvertidaDTO(valor, unidad, false);
        }
        return unidadNormalizadorService.convertirAUnidadDeCompra(valor, unidad);
    }

    private Float reposicion(Producto p) {
        return p.getStockMinimo() != null ? Math.max(1f, p.getStockMinimo()) : 1f;
    }

    private double ratioDisponibilidad(IngredienteReceta ingrediente, List<Producto> productos) {
        UnidadConvertidaDTO normalizado = unidadNormalizadorService
                .normalizarUnidades(ingrediente.getCantidad(), ingrediente.getUnidad());
        String unidadIngrediente = normalizado.unidadConvertida();
        // Se compara por familia de unidad (peso, volumen, conteo), no por igualdad exacta de
        // string: dentro de peso/volumen se convierte el valor; en conteo se comparan los
        // números tal cual. Así "2 dientes" en la receta cuenta contra "1 unidad" de ajo en la
        // despensa en vez de dar 0 disponible.
        double disponible = productos.stream()
                .filter(p -> esCoincidenciaFuerte(ingrediente.getNombre(), p.getNombre()))
                .mapToDouble(p -> unidadNormalizadorService
                        .cantidadComparable(p.getCantidad(), p.getUnidad(), unidadIngrediente)
                        .orElse(0d))
                .sum();
        if (normalizado.cantidadConvertida() <= 0) return disponible > 0 ? 1 : 0;
        return disponible / normalizado.cantidadConvertida();
    }

    // "Coincidencia fuerte" = el matching la clasifica como AUTOMATICO (>= UMBRAL_AUTOMATICO, 0.99):
    // prácticamente el mismo nombre. Se exige ese nivel para no dar por disponible un ingrediente
    // frente a un producto que solo se le parece y perder así recomendaciones de compra útiles.
    private boolean esCoincidenciaFuerte(String nombreIngrediente, String nombreProducto) {
        double puntuacion = matchingService.calcularSimilitud(nombreIngrediente, nombreProducto).puntuacion();
        return matchingService.clasificarMatch(puntuacion) == TipoMatch.AUTOMATICO;
    }

    private boolean enDespensaConStockSuficiente(String nombre, List<Producto> productos, int umbral) {
        return productos.stream()
                .anyMatch(p -> normalizar(p.getNombre()).equals(normalizar(nombre)) && p.getCantidad() > umbral);
    }

    private Integer diasHastaCaducidad(Producto p) {
        if (p.getFechaCaducidad() == null) return null;
        return (int) ChronoUnit.DAYS.between(LocalDate.now(), p.getFechaCaducidad());
    }

    private int obtenerGlobalUmbral(String usuarioId) {
        return preferenciasRepository.findByUsuarioId(usuarioId)
                .map(Preferencias::getStockMinimoGlobal)
                .filter(v -> v != null)
                .orElse(1);
    }

    private String normalizar(String texto) {
        return texto == null ? "" : texto.trim().toLowerCase(Locale.ROOT);
    }

    String inferirCategoria(String nombreIngrediente) {
        String normalizado = sinAcentos(nombreIngrediente);
        return CATEGORIAS_INGREDIENTES.entrySet().stream()
                .filter(e -> normalizado.contains(e.getKey()))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse("otros");
    }

    private String sinAcentos(String texto) {
        if (texto == null) return "";
        String normalizado = Normalizer.normalize(texto.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD);
        return normalizado.replaceAll("\\p{M}", "");
    }

    private int ordenPrioridad(String prioridad) {
        return switch (prioridad) {
            case "alta" -> 0;
            case "media" -> 1;
            case "baja" -> 2;
            default -> 3;
        };
    }

    private ItemCarrito getItemDeUsuario(String usuarioId, String itemId) {
        ItemCarrito item = itemCarritoRepository.findById(itemId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Item no encontrado"));
        if (!item.getUsuarioId().equals(usuarioId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "No tienes permiso sobre este item");
        }
        return item;
    }

    private ListaCompra getListaDeUsuario(String usuarioId, String listaId) {
        ListaCompra lista = listaCompraRepository.findById(listaId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Lista no encontrada"));
        if (!lista.getUsuarioId().equals(usuarioId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "No tienes permiso sobre esta lista");
        }
        return lista;
    }

    private Set<String> nombresEnDespensa(String usuarioId) {
        return despensaRepository.findByUsuarioId(usuarioId)
                .map(d -> productoRepository.findByDespensaId(d.getId()).stream()
                        .map(p -> normalizar(p.getNombre()))
                        .collect(Collectors.toSet()))
                .orElse(Set.of());
    }

    private ItemCarritoResponseDTO toItemDTO(ItemCarrito i, Set<String> nombresEnDespensa) {
        String recetaTitulo = i.getRecetaId() != null
                ? recetaRepository.findById(i.getRecetaId()).map(Receta::getTitulo).orElse(null)
                : null;
        return new ItemCarritoResponseDTO(
                i.getId(),
                i.getUsuarioId(),
                i.getNombre(),
                i.getCantidad(),
                i.getUnidad(),
                i.getCategoria(),
                i.getPrioridad(),
                i.getMotivo(),
                i.getEstado(),
                i.getNoVolver(),
                i.getRecetaId(),
                recetaTitulo,
                nombresEnDespensa.contains(normalizar(i.getNombre())),
                i.getCreatedAt(),
                i.getUpdatedAt()
        );
    }

    private ListaCompraResponseDTO toListaDTO(ListaCompra lista, String usuarioId) {
        Set<String> nombresEnDespensa = nombresEnDespensa(usuarioId);
        List<ItemCarritoResponseDTO> items = itemCarritoRepository.findAllById(lista.getItems()).stream()
                .map(i -> toItemDTO(i, nombresEnDespensa))
                .toList();
        return new ListaCompraResponseDTO(
                lista.getId(),
                lista.getNombre(),
                items,
                lista.getEstado(),
                lista.getCreatedAt(),
                lista.getUpdatedAt()
        );
    }
}
