package com.myfoodie.application.service;

import com.myfoodie.application.dto.carrito.CarritoDTO;
import com.myfoodie.application.dto.carrito.CarritoResumenDTO;
import com.myfoodie.application.dto.carrito.ItemCarritoRequestDTO;
import com.myfoodie.application.dto.carrito.ItemCompradoAjusteDTO;
import com.myfoodie.application.dto.carrito.ItemCarritoResponseDTO;
import com.myfoodie.application.dto.carrito.ListaCompraResponseDTO;
import com.myfoodie.application.dto.unidad.UnidadConvertidaDTO;
import com.myfoodie.domain.model.Despensa;
import com.myfoodie.domain.model.IngredienteReceta;
import com.myfoodie.domain.model.ItemCarrito;
import com.myfoodie.domain.model.ListaCompra;
import com.myfoodie.domain.model.MovimientoProducto;
import com.myfoodie.domain.model.Preferencias;
import com.myfoodie.domain.model.Producto;
import com.myfoodie.domain.model.Receta;
import com.myfoodie.domain.model.RecetaGuardada;
import com.myfoodie.domain.repository.DespensaRepository;
import com.myfoodie.domain.repository.IngredienteRecetaRepository;
import com.myfoodie.domain.repository.ItemCarritoRepository;
import com.myfoodie.domain.repository.ListaCompraRepository;
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
        List<RecetaGuardada> guardadas = recetaGuardadaRepository.findByUsuarioId(usuarioId);

        Set<String> noVolver = itemCarritoRepository.findByUsuarioIdAndNoVolverTrue(usuarioId)
                .stream().map(i -> normalizar(i.getNombre())).collect(Collectors.toSet());

        Set<String> yaEnCarrito = itemCarritoRepository.findByUsuarioId(usuarioId).stream()
                .filter(i -> "pendiente".equals(i.getEstado()) || "aceptado".equals(i.getEstado()))
                .map(i -> normalizar(i.getNombre())).collect(Collectors.toSet());

        Map<String, ItemCarrito> candidatos = new LinkedHashMap<>();

        candidatosPrioridadAlta(productos, umbral, guardadas).forEach(c -> añadirCandidato(candidatos, c));
        candidatosPrioridadMedia(despensa, productos, umbral, guardadas).forEach(c -> añadirCandidato(candidatos, c));
        candidatosPrioridadBaja(despensa, productos, umbral, guardadas).forEach(c -> añadirCandidato(candidatos, c));

        List<ItemCarrito> nuevos = new ArrayList<>();
        for (ItemCarrito candidato : candidatos.values()) {
            String clave = normalizar(candidato.getNombre());
            if (noVolver.contains(clave) || yaEnCarrito.contains(clave)) {
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
        item.setCantidad(nuevaCantidad);
        if (nuevaUnidad != null && !nuevaUnidad.isBlank()) {
            item.setUnidad(nuevaUnidad);
        }
        item.setUpdatedAt(LocalDateTime.now());
        return toItemDTO(itemCarritoRepository.save(item), nombresEnDespensa(usuarioId));
    }

    public ItemCarritoResponseDTO añadirItemManual(String usuarioId, ItemCarritoRequestDTO dto) {
        String categoria = (dto.categoria() != null && !dto.categoria().isBlank())
                ? dto.categoria()
                : inferirCategoria(dto.nombre());
        ItemCarrito item = ItemCarrito.builder()
                .usuarioId(usuarioId)
                .nombre(dto.nombre())
                .cantidad(dto.cantidad())
                .unidad(dto.unidad())
                .categoria(categoria)
                .prioridad("media")
                .estado("pendiente")
                .build();
        return toItemDTO(itemCarritoRepository.save(item), nombresEnDespensa(usuarioId));
    }

    public void eliminarItem(String usuarioId, String itemId) {
        itemCarritoRepository.delete(getItemDeUsuario(usuarioId, itemId));
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

    public void añadirProductosCompradosADespensa(String usuarioId, String listaId,
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

        for (ItemCarrito item : comprados) {
            ItemCompradoAjusteDTO ajuste = ajustesPorItemId.get(item.getId());
            Float cantidad = ajuste != null && ajuste.cantidad() != null ? ajuste.cantidad() : item.getCantidad();
            String unidad = ajuste != null && ajuste.unidad() != null ? ajuste.unidad() : item.getUnidad();
            LocalDate fechaCaducidad = ajuste != null ? ajuste.fechaCaducidad() : null;

            productoRepository.save(Producto.builder()
                    .despensaId(despensa.getId())
                    .nombre(item.getNombre())
                    .cantidad(cantidad != null ? cantidad : 0)
                    .unidad(unidad)
                    .categoria(item.getCategoria())
                    .fechaCaducidad(fechaCaducidad)
                    .fechaCompra(LocalDate.now())
                    .build());
        }
        despensa.setUpdatedAt(LocalDateTime.now());
        despensaRepository.save(despensa);

        lista.setEstado("completada");
        lista.setUpdatedAt(LocalDateTime.now());
        listaCompraRepository.save(lista);
    }

    // -------------------------------------------------------------------------
    // Prioridad ALTA
    // -------------------------------------------------------------------------

    private List<ItemCarrito> candidatosPrioridadAlta(List<Producto> productos, int umbral,
                                                        List<RecetaGuardada> guardadas) {
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

        for (RecetaGuardada guardada : guardadas) {
            Receta receta = recetaRepository.findById(guardada.getRecetaId()).orElse(null);
            if (receta == null) continue;
            List<IngredienteReceta> ingredientes = ingredienteRecetaRepository.findByRecetaId(receta.getId());
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
                                                         List<RecetaGuardada> guardadas) {
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

        for (RecetaGuardada guardada : guardadas) {
            Receta receta = recetaRepository.findById(guardada.getRecetaId()).orElse(null);
            if (receta == null) continue;
            List<IngredienteReceta> ingredientes = ingredienteRecetaRepository.findByRecetaId(receta.getId());
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
                                                        List<RecetaGuardada> guardadas) {
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

        for (RecetaGuardada guardada : guardadas) {
            Receta receta = recetaRepository.findById(guardada.getRecetaId()).orElse(null);
            if (receta == null) continue;
            List<IngredienteReceta> ingredientes = ingredienteRecetaRepository.findByRecetaId(receta.getId());
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

    private Float reposicion(Producto p) {
        return p.getStockMinimo() != null ? Math.max(1f, p.getStockMinimo()) : 1f;
    }

    private double ratioDisponibilidad(IngredienteReceta ingrediente, List<Producto> productos) {
        UnidadConvertidaDTO normalizado = unidadNormalizadorService
                .normalizarUnidades(ingrediente.getCantidad(), ingrediente.getUnidad());
        double disponible = productos.stream()
                .filter(p -> normalizar(p.getNombre()).equals(normalizar(ingrediente.getNombre())))
                .filter(p -> unidadesCompatibles(normalizado.unidadConvertida(), p.getUnidad()))
                .mapToDouble(Producto::getCantidad)
                .sum();
        if (normalizado.cantidadConvertida() <= 0) return disponible > 0 ? 1 : 0;
        return disponible / normalizado.cantidadConvertida();
    }

    private boolean unidadesCompatibles(String unidadIngrediente, String unidadProducto) {
        return normalizar(unidadIngrediente).equals(normalizar(unidadProducto));
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
