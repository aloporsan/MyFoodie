package com.myfoodie.application.service;

import com.myfoodie.application.dto.despensa.EliminarProductoRequestDTO;
import com.myfoodie.application.dto.despensa.LoteProductoRequestDTO;
import com.myfoodie.application.dto.despensa.LoteProductoResponseDTO;
import com.myfoodie.application.dto.despensa.MovimientoProductoResponseDTO;
import com.myfoodie.application.dto.despensa.ProductoFiltroDTO;
import com.myfoodie.application.dto.despensa.ProductoRequestDTO;
import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import com.myfoodie.application.dto.despensa.ProductoUpdateCantidadDTO;
import com.myfoodie.application.dto.unidad.UnidadConvertidaDTO;
import com.myfoodie.domain.model.Despensa;
import com.myfoodie.domain.model.LoteProducto;
import com.myfoodie.domain.model.MovimientoProducto;
import com.myfoodie.domain.model.Preferencias;
import com.myfoodie.domain.model.Producto;
import com.myfoodie.domain.repository.DespensaRepository;
import com.myfoodie.domain.repository.LoteProductoRepository;
import com.myfoodie.domain.repository.MovimientoProductoRepository;
import com.myfoodie.domain.repository.PreferenciasRepository;
import com.myfoodie.domain.repository.ProductoRepository;
import com.myfoodie.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class DespensaService {

    private static final List<String> ORDENES_VALIDOS = List.of(
            "nombre_asc", "nombre_desc", "caducidad_asc", "cantidad_desc",
            "cantidad_asc", "reciente_primero", "categoria");

    private static final String ORDEN_POR_DEFECTO = "reciente_primero";

    private final DespensaRepository despensaRepository;
    private final ProductoRepository productoRepository;
    private final PreferenciasRepository preferenciasRepository;
    private final MovimientoProductoRepository movimientoRepository;
    private final LoteProductoRepository loteProductoRepository;
    private final CarritoInteligenteService carritoInteligenteService;
    private final UnidadNormalizadorService unidadNormalizadorService;
    private final NotificacionService notificacionService;

    // -------------------------------------------------------------------------
    // CRUD básico
    // -------------------------------------------------------------------------

    public ProductoResponseDTO añadirProducto(String usuarioId, ProductoRequestDTO dto) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        int globalUmbral = obtenerGlobalUmbral(usuarioId);

        List<Producto> similares = productoRepository
                .findByDespensaIdAndNombreContainingIgnoreCase(despensa.getId(), dto.nombre().trim());

        UnidadConvertidaDTO normalizado = unidadNormalizadorService.normalizarUnidades(dto.cantidad(), dto.unidad());

        Producto producto = Producto.builder()
                .despensaId(despensa.getId())
                .nombre(dto.nombre())
                .cantidad(normalizado.cantidadConvertida())
                .unidad(normalizado.unidadConvertida())
                .unidadOriginal(dto.unidad())
                .categoria(dto.categoria())
                .fechaCaducidad(dto.fechaCaducidad())
                .fechaCompra(dto.fechaCompra())
                .marca(dto.marca())
                .notas(dto.notas())
                .stockMinimo(dto.stockMinimo())
                .build();

        Producto saved = productoRepository.save(producto);
        actualizarDespensa(despensa);
        registrarMovimiento(saved, usuarioId, "añadido", "Producto añadido a la despensa",
                null, saved.getCantidad(), null, null);
        carritoInteligenteService.actualizarCarritoTrasModificacionDespensa(usuarioId);
        notificacionService.generarNotificacionesCaducidad(usuarioId);

        List<ProductoResponseDTO> duplicados = similares.stream()
                .map(p -> toDTO(p, null, resolverUmbral(p, globalUmbral)))
                .toList();

        return toDTO(saved, duplicados.isEmpty() ? null : duplicados, resolverUmbral(saved, globalUmbral));
    }

    public List<ProductoResponseDTO> listarProductos(String usuarioId) {
        return listarProductos(usuarioId, null);
    }

    public List<ProductoResponseDTO> listarProductos(String usuarioId, String orderBy) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        int globalUmbral = obtenerGlobalUmbral(usuarioId);
        String orden = validarOrden(orderBy);
        return productoRepository.findByDespensaId(despensa.getId())
                .stream()
                .map(p -> toDTO(p, null, resolverUmbral(p, globalUmbral)))
                .sorted(comparadorPorOrden(orden))
                .toList();
    }

    public ProductoResponseDTO obtenerProducto(String usuarioId, String productoId) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        int globalUmbral = obtenerGlobalUmbral(usuarioId);
        Producto p = getProductoDeUsuario(despensa.getId(), productoId);
        return toDTO(p, null, resolverUmbral(p, globalUmbral));
    }

    public ProductoResponseDTO editarProducto(String usuarioId, String productoId, ProductoRequestDTO dto) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        int globalUmbral = obtenerGlobalUmbral(usuarioId);
        Producto p = getProductoDeUsuario(despensa.getId(), productoId);

        p.setNombre(dto.nombre());
        p.setCantidad(dto.cantidad());
        p.setUnidad(dto.unidad());
        p.setCategoria(dto.categoria());
        p.setFechaCaducidad(dto.fechaCaducidad());
        p.setFechaCompra(dto.fechaCompra());
        p.setMarca(dto.marca());
        p.setNotas(dto.notas());
        p.setStockMinimo(dto.stockMinimo());
        p.setUpdatedAt(LocalDateTime.now());

        Producto saved = productoRepository.save(p);
        actualizarDespensa(despensa);
        registrarMovimiento(saved, usuarioId, "editado", "Producto actualizado",
                null, null, null, null);
        carritoInteligenteService.actualizarCarritoTrasModificacionDespensa(usuarioId);
        return toDTO(saved, null, resolverUmbral(saved, globalUmbral));
    }

    public void eliminarProducto(String usuarioId, String productoId, EliminarProductoRequestDTO dto) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        Producto p = getProductoDeUsuario(despensa.getId(), productoId);
        String motivo = dto != null ? dto.motivo() : null;
        String motivoDetalle = dto != null ? dto.motivoDetalle() : null;
        registrarMovimiento(p, usuarioId, "eliminado", "Producto eliminado de la despensa",
                p.getCantidad(), null, motivo, motivoDetalle);
        productoRepository.delete(p);
        actualizarDespensa(despensa);
        carritoInteligenteService.actualizarCarritoTrasModificacionDespensa(usuarioId);
    }

    public ProductoResponseDTO actualizarCantidad(String usuarioId, String productoId,
                                                   ProductoUpdateCantidadDTO dto) {
        return actualizarCantidad(usuarioId, productoId, dto, true);
    }

    // actualizarCarrito=false evita disparar N regeneraciones async en paralelo cuando el llamante itera varios productos
    public ProductoResponseDTO actualizarCantidad(String usuarioId, String productoId,
                                                   ProductoUpdateCantidadDTO dto, boolean actualizarCarrito) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        int globalUmbral = obtenerGlobalUmbral(usuarioId);
        Producto p = getProductoDeUsuario(despensa.getId(), productoId);

        if (Boolean.TRUE.equals(p.getTieneLotes()) && dto.delta() < 0) {
            consumirStockFIFO(usuarioId, productoId, (float) -dto.delta());
            if (actualizarCarrito) {
                carritoInteligenteService.actualizarCarritoTrasModificacionDespensa(usuarioId);
                notificacionService.generarNotificacionesCaducidad(usuarioId);
            }
            Producto actualizado = getProductoDeUsuario(despensa.getId(), productoId);
            return toDTO(actualizado, null, resolverUmbral(actualizado, globalUmbral));
        }

        double cantidadAnterior = p.getCantidad();
        double nuevaCantidad = cantidadAnterior + dto.delta();
        if (nuevaCantidad < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La cantidad no puede ser negativa");
        }
        p.setCantidad(nuevaCantidad);
        p.setUpdatedAt(LocalDateTime.now());

        Producto saved = productoRepository.save(p);
        actualizarDespensa(despensa);
        String descripcion = dto.descripcion() != null ? dto.descripcion() : "Cantidad actualizada";
        registrarMovimiento(saved, usuarioId, "cantidad_actualizada", descripcion,
                cantidadAnterior, nuevaCantidad, dto.motivo(), dto.motivoDetalle());
        if (actualizarCarrito) {
            carritoInteligenteService.actualizarCarritoTrasModificacionDespensa(usuarioId);
            notificacionService.generarNotificacionesCaducidad(usuarioId);
        }
        return toDTO(saved, null, resolverUmbral(saved, globalUmbral));
    }

    // -------------------------------------------------------------------------
    // Gestión por lotes
    // -------------------------------------------------------------------------

    public LoteProductoResponseDTO añadirLote(String usuarioId, String productoId, LoteProductoRequestDTO dto) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        Producto producto = getProductoDeUsuario(despensa.getId(), productoId);

        producto.setTieneLotes(true);

        LoteProducto lote = loteProductoRepository.save(LoteProducto.builder()
                .productoId(producto.getId())
                .despensaId(despensa.getId())
                .usuarioId(usuarioId)
                .cantidad(dto.cantidad())
                .unidad(dto.unidad())
                .fechaCaducidad(dto.fechaCaducidad())
                .fechaCompra(dto.fechaCompra() != null ? dto.fechaCompra() : LocalDate.now())
                .origen(dto.origen() != null ? dto.origen() : "manual")
                .build());

        recalcularAgregadoDesdeLotes(producto);
        Producto guardado = productoRepository.save(producto);
        actualizarDespensa(despensa);
        registrarMovimiento(guardado, usuarioId, "lote_añadido",
                "Lote añadido: " + lote.getCantidad() + " " + lote.getUnidad(),
                null, guardado.getCantidad(), null, null);
        carritoInteligenteService.actualizarCarritoTrasModificacionDespensa(usuarioId);
        notificacionService.generarNotificacionesCaducidad(usuarioId);

        return toLoteDTO(lote);
    }

    public void consumirStockFIFO(String usuarioId, String productoId, float cantidadAConsumir) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        Producto producto = getProductoDeUsuario(despensa.getId(), productoId);

        List<LoteProducto> lotes = loteProductoRepository.findByProductoIdOrderByFechaCaducidadAsc(producto.getId());
        float totalDisponible = lotes.stream().map(LoteProducto::getCantidad).filter(Objects::nonNull)
                .reduce(0f, Float::sum);
        if (cantidadAConsumir > totalDisponible) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La cantidad no puede ser negativa");
        }

        float restante = cantidadAConsumir;
        for (LoteProducto lote : lotes) {
            if (restante <= 0) {
                break;
            }
            float disponibleLote = lote.getCantidad() != null ? lote.getCantidad() : 0f;
            if (disponibleLote <= 0) {
                continue;
            }

            float consumidoDeEsteLote = Math.min(disponibleLote, restante);
            float cantidadNuevaLote = disponibleLote - consumidoDeEsteLote;
            restante -= consumidoDeEsteLote;

            if (cantidadNuevaLote <= 0) {
                loteProductoRepository.delete(lote);
            } else {
                lote.setCantidad(cantidadNuevaLote);
                lote.setUpdatedAt(LocalDateTime.now());
                loteProductoRepository.save(lote);
            }

            registrarMovimiento(producto, usuarioId, "cantidad_actualizada", "Consumo FIFO de lote",
                    (double) disponibleLote, (double) cantidadNuevaLote, "consumido", null);
        }

        recalcularAgregadoDesdeLotes(producto);
        productoRepository.save(producto);
        actualizarDespensa(despensa);
    }

    public List<LoteProductoResponseDTO> obtenerLotes(String usuarioId, String productoId) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        getProductoDeUsuario(despensa.getId(), productoId);
        return loteProductoRepository.findByProductoIdOrderByFechaCaducidadAsc(productoId).stream()
                .map(this::toLoteDTO)
                .toList();
    }

    private void recalcularAgregadoDesdeLotes(Producto producto) {
        List<LoteProducto> lotesConStock = loteProductoRepository
                .findByProductoIdAndCantidadGreaterThan(producto.getId(), 0f);
        float total = loteProductoRepository.sumCantidadByProductoId(producto.getId());
        LocalDate minimaCaducidad = lotesConStock.stream()
                .map(LoteProducto::getFechaCaducidad)
                .filter(Objects::nonNull)
                .min(Comparator.naturalOrder())
                .orElse(null);

        producto.setCantidad(total);
        producto.setFechaCaducidad(minimaCaducidad);
        producto.setUpdatedAt(LocalDateTime.now());
    }

    private LoteProductoResponseDTO toLoteDTO(LoteProducto lote) {
        Integer dias = calcularDiasHastaCaducidad(lote.getFechaCaducidad());
        return new LoteProductoResponseDTO(
                lote.getId(),
                lote.getCantidad(),
                lote.getUnidad(),
                lote.getFechaCaducidad(),
                lote.getFechaCompra(),
                lote.getOrigen(),
                dias,
                calcularEstadoLote(lote, dias),
                lote.getCreatedAt()
        );
    }

    private String calcularEstadoLote(LoteProducto lote, Integer dias) {
        float cantidad = lote.getCantidad() != null ? lote.getCantidad() : 0f;
        if (cantidad <= 0) {
            return "sin_stock";
        }
        if (dias != null && dias < 0)  return "caducado";
        if (dias != null && dias == 0) return "caduca_hoy";
        if (dias != null && dias <= 3) return "caduca_pronto";
        if (dias != null && dias <= 7)  return "caduca_semana";
        if (dias != null && dias <= 30) return "caduca_mes";
        return "normal";
    }

    // -------------------------------------------------------------------------
    // Búsqueda y filtrado
    // -------------------------------------------------------------------------

    public List<ProductoResponseDTO> buscarProductos(String usuarioId, String texto) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        int globalUmbral = obtenerGlobalUmbral(usuarioId);
        return productoRepository
                .findByDespensaIdAndNombreContainingIgnoreCase(despensa.getId(), texto.trim())
                .stream()
                .map(p -> toDTO(p, null, resolverUmbral(p, globalUmbral)))
                .toList();
    }

    public List<ProductoResponseDTO> filtrarProductos(String usuarioId, ProductoFiltroDTO filtro) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        int globalUmbral = obtenerGlobalUmbral(usuarioId);
        return productoRepository.findByDespensaId(despensa.getId())
                .stream()
                .filter(p -> filtro.categoria() == null
                        || filtro.categoria().equalsIgnoreCase(p.getCategoria()))
                .filter(p -> filtro.estado() == null
                        || filtro.estado().equals(calcularEstado(p, resolverUmbral(p, globalUmbral))))
                .filter(p -> filtro.caducaAntesDe() == null
                        || (p.getFechaCaducidad() != null
                            && p.getFechaCaducidad().isBefore(filtro.caducaAntesDe())))
                .map(p -> toDTO(p, null, resolverUmbral(p, globalUmbral)))
                .toList();
    }

    // -------------------------------------------------------------------------
    // Helpers privados
    // -------------------------------------------------------------------------

    private String validarOrden(String orderBy) {
        if (orderBy == null || orderBy.isBlank()) {
            return ORDEN_POR_DEFECTO;
        }
        if (!ORDENES_VALIDOS.contains(orderBy)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "orderBy inválido: " + orderBy);
        }
        return orderBy;
    }

    private Comparator<ProductoResponseDTO> comparadorPorOrden(String orden) {
        return switch (orden) {
            case "nombre_asc" -> Comparator.comparing(ProductoResponseDTO::nombre, String.CASE_INSENSITIVE_ORDER);
            case "nombre_desc" -> Comparator.comparing(ProductoResponseDTO::nombre, String.CASE_INSENSITIVE_ORDER)
                    .reversed();
            case "caducidad_asc" -> Comparator.comparing(ProductoResponseDTO::fechaCaducidad,
                    Comparator.nullsLast(Comparator.naturalOrder()));
            case "cantidad_desc" -> Comparator.comparingDouble(ProductoResponseDTO::cantidad).reversed();
            case "cantidad_asc" -> Comparator.comparingDouble(ProductoResponseDTO::cantidad);
            case "categoria" -> Comparator.comparing(ProductoResponseDTO::categoria,
                    Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            default -> Comparator.comparing(ProductoResponseDTO::createdAt,
                    Comparator.nullsLast(Comparator.reverseOrder()));
        };
    }

    private Despensa getDespensaDeUsuario(String usuarioId) {
        return despensaRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Despensa no encontrada"));
    }

    private Producto getProductoDeUsuario(String despensaId, String productoId) {
        return productoRepository.findByDespensaIdAndId(despensaId, productoId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Producto no encontrado"));
    }

    private void actualizarDespensa(Despensa despensa) {
        despensa.setUpdatedAt(LocalDateTime.now());
        despensaRepository.save(despensa);
    }

    private int obtenerGlobalUmbral(String usuarioId) {
        return preferenciasRepository.findByUsuarioId(usuarioId)
                .map(Preferencias::getStockMinimoGlobal)
                .filter(v -> v != null)
                .orElse(1);
    }

    private int resolverUmbral(Producto p, int globalUmbral) {
        return p.getStockMinimo() != null ? p.getStockMinimo() : globalUmbral;
    }

    private void registrarMovimiento(Producto p, String usuarioId, String tipo, String descripcion,
                                     Double cantidadAnterior, Double cantidadNueva,
                                     String motivo, String motivoDetalle) {
        movimientoRepository.save(MovimientoProducto.builder()
                .productoId(p.getId())
                .despensaId(p.getDespensaId())
                .usuarioId(usuarioId)
                .nombre(p.getNombre())
                .tipo(tipo)
                .descripcion(descripcion)
                .cantidadAnterior(cantidadAnterior)
                .cantidadNueva(cantidadNueva)
                .motivo(motivo)
                .motivoDetalle(motivoDetalle)
                .build());
    }

    public List<MovimientoProductoResponseDTO> obtenerHistorial(String usuarioId, String productoId) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        getProductoDeUsuario(despensa.getId(), productoId);
        return movimientoRepository.findByProductoIdOrderByCreatedAtDesc(productoId)
                .stream()
                .map(m -> new MovimientoProductoResponseDTO(
                        m.getId(), m.getTipo(), m.getDescripcion(),
                        m.getCantidadAnterior(), m.getCantidadNueva(),
                        m.getMotivo(), m.getMotivoDetalle(), m.getCreatedAt()))
                .toList();
    }

    String calcularEstado(Producto p, int umbral) {
        if (Boolean.TRUE.equals(p.getTieneLotes())) {
            return calcularEstadoDesdeLotes(p, umbral);
        }

        if (p.getCantidad() <= 0) {
            return "sin_stock";
        }

        Long dias = p.getFechaCaducidad() != null
                ? ChronoUnit.DAYS.between(LocalDate.now(), p.getFechaCaducidad())
                : null;

        if (dias != null && dias < 0)  return "caducado";
        if (dias != null && dias == 0) return "caduca_hoy";
        if (dias != null && dias <= 3) return "caduca_pronto";
        if (p.getCantidad() <= umbral) return "bajoStock";
        if (dias != null && dias <= 7)  return "caduca_semana";
        if (dias != null && dias <= 30) return "caduca_mes";
        return "normal";
    }

    // Con lotes, la fecha relevante no es la del producto sino la del lote más próximo a
    // caducar (FIFO): un producto puede tener stock sobrado en lotes lejanos pero el que
    // toca consumir antes es el que determina si conviene avisar al usuario.
    private String calcularEstadoDesdeLotes(Producto p, int umbral) {
        List<LoteProducto> lotesConStock = loteProductoRepository
                .findByProductoIdAndCantidadGreaterThan(p.getId(), 0f);
        if (lotesConStock.isEmpty()) {
            return "sin_stock";
        }

        LoteProducto loteMasUrgente = lotesConStock.stream()
                .min(Comparator.comparing(LoteProducto::getFechaCaducidad,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .orElseThrow();
        Integer dias = calcularDiasHastaCaducidad(loteMasUrgente.getFechaCaducidad());

        if (dias != null && dias < 0)  return "caducado";
        if (dias != null && dias == 0) return "caduca_hoy";
        if (dias != null && dias <= 3) return "caduca_pronto";
        if (p.getCantidad() <= umbral) return "bajoStock";
        if (dias != null && dias <= 7)  return "caduca_semana";
        if (dias != null && dias <= 30) return "caduca_mes";
        return "normal";
    }

    private Integer calcularDiasHastaCaducidad(Producto p) {
        return calcularDiasHastaCaducidad(p.getFechaCaducidad());
    }

    private Integer calcularDiasHastaCaducidad(LocalDate fecha) {
        if (fecha == null) return null;
        return (int) ChronoUnit.DAYS.between(LocalDate.now(), fecha);
    }

    ProductoResponseDTO toDTO(Producto p, List<ProductoResponseDTO> duplicados, int umbralEfectivo) {
        boolean alertaCompra = p.getCantidad() <= umbralEfectivo;
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
                calcularEstado(p, umbralEfectivo),
                calcularDiasHastaCaducidad(p),
                duplicados,
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
