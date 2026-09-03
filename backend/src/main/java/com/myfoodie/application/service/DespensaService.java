package com.myfoodie.application.service;

import com.myfoodie.application.dto.despensa.ConsumoLoteDTO;
import com.myfoodie.application.dto.despensa.EliminarProductoRequestDTO;
import com.myfoodie.application.dto.despensa.LoteProductoRequestDTO;
import com.myfoodie.application.dto.despensa.LoteProductoResponseDTO;
import com.myfoodie.application.dto.despensa.MovimientoProductoResponseDTO;
import com.myfoodie.application.dto.despensa.ProductoFiltroDTO;
import com.myfoodie.application.dto.despensa.ProductoRequestDTO;
import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import com.myfoodie.application.dto.despensa.ProductoUpdateCantidadDTO;
import com.myfoodie.application.dto.unidad.UnidadConvertidaDTO;
import com.myfoodie.domain.model.CriterioFechaLote;
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
import java.util.ArrayList;
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

    // Borrado masivo de toda la despensa. Deja rastro en el historial (un movimiento
    // "eliminado" por producto con motivo "vaciado_despensa", que no cuenta como
    // desperdicio en las estadísticas) y limpia los lotes asociados de una vez.
    public int vaciarDespensa(String usuarioId) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        List<Producto> productos = productoRepository.findByDespensaId(despensa.getId());
        if (productos.isEmpty()) {
            return 0;
        }

        for (Producto p : productos) {
            registrarMovimiento(p, usuarioId, "eliminado", "Despensa vaciada por completo",
                    p.getCantidad(), null, "vaciado_despensa", null);
        }

        loteProductoRepository.deleteByDespensaId(despensa.getId());
        productoRepository.deleteAll(productos);
        actualizarDespensa(despensa);
        carritoInteligenteService.actualizarCarritoTrasModificacionDespensa(usuarioId);

        return productos.size();
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
            List<ConsumoLoteDTO> consumos = consumirStockFIFO(usuarioId, productoId, (float) -dto.delta());
            if (actualizarCarrito) {
                carritoInteligenteService.actualizarCarritoTrasModificacionDespensa(usuarioId);
                notificacionService.generarNotificacionesCaducidad(usuarioId);
            }
            Producto actualizado = getProductoDeUsuario(despensa.getId(), productoId);
            return toDTO(actualizado, null, resolverUmbral(actualizado, globalUmbral), consumos);
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

    // Activa la gestión por lotes envolviendo el stock ya existente del producto en un
    // primer lote (misma cantidad/fecha que ya tenía) en vez de partir de cero: así "Gestionar
    // por lotes" no obliga a volver a introducir a mano lo que ya estaba registrado.
    public LoteProductoResponseDTO activarLotes(String usuarioId, String productoId) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        Producto producto = getProductoDeUsuario(despensa.getId(), productoId);
        if (Boolean.TRUE.equals(producto.getTieneLotes())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El producto ya tiene la gestión por lotes activada");
        }

        producto.setTieneLotes(true);
        LoteProducto lote = loteProductoRepository.save(LoteProducto.builder()
                .productoId(producto.getId())
                .despensaId(despensa.getId())
                .usuarioId(usuarioId)
                .cantidad((float) producto.getCantidad())
                .unidad(producto.getUnidad())
                .fechaCaducidad(producto.getFechaCaducidad())
                .fechaCompra(producto.getFechaCompra() != null ? producto.getFechaCompra() : LocalDate.now())
                .origen("manual")
                .build());

        producto.setUpdatedAt(LocalDateTime.now());
        productoRepository.save(producto);
        actualizarDespensa(despensa);
        registrarMovimiento(producto, usuarioId, "lote_añadido",
                "Gestión por lotes activada", null, producto.getCantidad(), null, null);

        return toLoteDTO(lote);
    }

    public LoteProductoResponseDTO añadirLote(String usuarioId, String productoId, LoteProductoRequestDTO dto) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        Producto producto = getProductoDeUsuario(despensa.getId(), productoId);
        LoteProducto lote = crearLoteYRecalcular(usuarioId, despensa, producto, dto);
        return toLoteDTO(lote);
    }

    public LoteProductoResponseDTO editarLote(String usuarioId, String productoId, String loteId,
                                               LoteProductoRequestDTO dto) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        Producto producto = getProductoDeUsuario(despensa.getId(), productoId);
        LoteProducto lote = getLoteDeProducto(producto.getId(), loteId);

        lote.setCantidad(dto.cantidad());
        lote.setUnidad(dto.unidad());
        lote.setFechaCaducidad(dto.fechaCaducidad());
        lote.setFechaCompra(dto.fechaCompra());
        if (dto.origen() != null) {
            lote.setOrigen(dto.origen());
        }
        lote.setUpdatedAt(LocalDateTime.now());
        LoteProducto guardado = loteProductoRepository.save(lote);

        recalcularAgregadoDesdeLotes(producto);
        productoRepository.save(producto);
        actualizarDespensa(despensa);
        carritoInteligenteService.actualizarCarritoTrasModificacionDespensa(usuarioId);
        notificacionService.generarNotificacionesCaducidad(usuarioId);

        return toLoteDTO(guardado);
    }

    public void eliminarLote(String usuarioId, String productoId, String loteId) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        Producto producto = getProductoDeUsuario(despensa.getId(), productoId);
        LoteProducto lote = getLoteDeProducto(producto.getId(), loteId);

        loteProductoRepository.delete(lote);
        recalcularAgregadoDesdeLotes(producto);
        productoRepository.save(producto);
        actualizarDespensa(despensa);
        carritoInteligenteService.actualizarCarritoTrasModificacionDespensa(usuarioId);
    }

    private LoteProducto getLoteDeProducto(String productoId, String loteId) {
        LoteProducto lote = loteProductoRepository.findById(loteId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Lote no encontrado"));
        if (!lote.getProductoId().equals(productoId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Lote no encontrado");
        }
        return lote;
    }

    private LoteProducto crearLoteYRecalcular(String usuarioId, Despensa despensa, Producto producto,
                                               LoteProductoRequestDTO dto) {
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

        return lote;
    }

    // Usado por flujos de entrada de producto (OCR, carrito → despensa) donde ya se sabe
    // cantidad/unidad/fecha de la compra: decide si sumar directo, crear un lote nuevo
    // (producto ya trackeado por lotes) o migrar el producto a lotes porque esta entrada
    // trae una fecha de caducidad distinta a la que ya tenía.
    public ProductoResponseDTO registrarEntradaProducto(String usuarioId, String productoId, Float cantidad,
                                                         String unidad, LocalDate fechaCaducidad, String origen) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        int globalUmbral = obtenerGlobalUmbral(usuarioId);
        Producto producto = getProductoDeUsuario(despensa.getId(), productoId);
        float cantidadEntrada = cantidad != null ? cantidad : 0f;
        String unidadEntrada = unidad != null ? unidad : producto.getUnidad();

        if (Boolean.TRUE.equals(producto.getTieneLotes())) {
            crearLoteYRecalcular(usuarioId, despensa, producto,
                    new LoteProductoRequestDTO(cantidadEntrada, unidadEntrada, fechaCaducidad, LocalDate.now(), origen));
            Producto actualizado = getProductoDeUsuario(despensa.getId(), productoId);
            return toDTO(actualizado, null, resolverUmbral(actualizado, globalUmbral));
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
            crearLoteYRecalcular(usuarioId, despensa, producto,
                    new LoteProductoRequestDTO(cantidadEntrada, unidadEntrada, fechaCaducidad, LocalDate.now(), origen));
            Producto actualizado = getProductoDeUsuario(despensa.getId(), productoId);
            return toDTO(actualizado, null, resolverUmbral(actualizado, globalUmbral));
        }

        return actualizarCantidad(usuarioId, productoId,
                new ProductoUpdateCantidadDTO((double) cantidadEntrada, null, null,
                        "Añadido desde " + (origen != null ? origen : "compra")));
    }

    // Contraparte de registrarEntradaProducto para productos nuevos: si el flujo de entrada
    // ya conoce cantidad/fecha de caducidad de la compra, el producto nace con lotes desde
    // el principio en vez de crearse "plano" y tener que migrarse luego.
    public ProductoResponseDTO añadirProductoConLote(String usuarioId, ProductoRequestDTO dto, String origenLote) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        int globalUmbral = obtenerGlobalUmbral(usuarioId);

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
                .tieneLotes(true)
                .build();
        Producto guardado = productoRepository.save(producto);

        loteProductoRepository.save(LoteProducto.builder()
                .productoId(guardado.getId())
                .despensaId(despensa.getId())
                .usuarioId(usuarioId)
                .cantidad((float) normalizado.cantidadConvertida())
                .unidad(normalizado.unidadConvertida())
                .fechaCaducidad(dto.fechaCaducidad())
                .fechaCompra(dto.fechaCompra() != null ? dto.fechaCompra() : LocalDate.now())
                .origen(origenLote != null ? origenLote : "manual")
                .build());

        actualizarDespensa(despensa);
        registrarMovimiento(guardado, usuarioId, "añadido", "Producto añadido a la despensa",
                null, guardado.getCantidad(), null, null);
        carritoInteligenteService.actualizarCarritoTrasModificacionDespensa(usuarioId);
        notificacionService.generarNotificacionesCaducidad(usuarioId);

        return toDTO(guardado, null, resolverUmbral(guardado, globalUmbral));
    }

    public List<ConsumoLoteDTO> consumirStockFIFO(String usuarioId, String productoId, float cantidadAConsumir) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        Producto producto = getProductoDeUsuario(despensa.getId(), productoId);

        List<LoteProducto> lotes = loteProductoRepository.findByProductoIdOrderByFechaCaducidadAsc(producto.getId());
        float totalDisponible = lotes.stream().map(LoteProducto::getCantidad).filter(Objects::nonNull)
                .reduce(0f, Float::sum);
        if (cantidadAConsumir > totalDisponible) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La cantidad no puede ser negativa");
        }

        List<ConsumoLoteDTO> consumos = new ArrayList<>();
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
            boolean loteEliminado = cantidadNuevaLote <= 0;

            if (loteEliminado) {
                loteProductoRepository.delete(lote);
            } else {
                lote.setCantidad(cantidadNuevaLote);
                lote.setUpdatedAt(LocalDateTime.now());
                loteProductoRepository.save(lote);
            }

            registrarMovimiento(producto, usuarioId, "cantidad_actualizada",
                    "Descontado del lote que caduca antes",
                    (double) disponibleLote, (double) cantidadNuevaLote, "consumido", null);
            consumos.add(new ConsumoLoteDTO(lote.getId(), lote.getFechaCaducidad(),
                    consumidoDeEsteLote, loteEliminado ? 0f : cantidadNuevaLote, loteEliminado));
        }

        recalcularAgregadoDesdeLotes(producto);
        productoRepository.save(producto);
        actualizarDespensa(despensa);
        return consumos;
    }

    public List<LoteProductoResponseDTO> obtenerLotes(String usuarioId, String productoId) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        getProductoDeUsuario(despensa.getId(), productoId);
        return loteProductoRepository.findByProductoIdOrderByFechaCaducidadAsc(productoId).stream()
                .map(this::toLoteDTO)
                .toList();
    }

    public LoteProductoResponseDTO compactarLotes(String usuarioId, String productoId, CriterioFechaLote criterioFecha) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        Producto producto = getProductoDeUsuario(despensa.getId(), productoId);

        List<LoteProducto> lotesActivos = loteProductoRepository
                .findByProductoIdAndCantidadGreaterThan(producto.getId(), 0f);
        if (lotesActivos.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El producto no tiene lotes activos para compactar");
        }

        float total = lotesActivos.stream().map(LoteProducto::getCantidad).filter(Objects::nonNull)
                .reduce(0f, Float::sum);
        Comparator<LoteProducto> porFecha = Comparator.comparing(LoteProducto::getFechaCaducidad,
                Comparator.nullsLast(Comparator.naturalOrder()));
        LocalDate fechaElegida = criterioFecha == CriterioFechaLote.MAS_TARDIA
                ? lotesActivos.stream().max(porFecha).map(LoteProducto::getFechaCaducidad).orElse(null)
                : lotesActivos.stream().min(porFecha).map(LoteProducto::getFechaCaducidad).orElse(null);
        LocalDate fechaCompraMasReciente = lotesActivos.stream()
                .map(LoteProducto::getFechaCompra)
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(LocalDate.now());
        String unidad = lotesActivos.get(0).getUnidad();

        loteProductoRepository.deleteAll(lotesActivos);
        LoteProducto loteResultante = loteProductoRepository.save(LoteProducto.builder()
                .productoId(producto.getId())
                .despensaId(despensa.getId())
                .usuarioId(usuarioId)
                .cantidad(total)
                .unidad(unidad)
                .fechaCaducidad(fechaElegida)
                .fechaCompra(fechaCompraMasReciente)
                .origen("manual")
                .build());

        recalcularAgregadoDesdeLotes(producto);
        Producto guardado = productoRepository.save(producto);
        actualizarDespensa(despensa);
        registrarMovimiento(guardado, usuarioId, "lotes_compactados",
                "Lotes compactados en uno: " + total + " " + unidad,
                null, guardado.getCantidad(), null, null);
        carritoInteligenteService.actualizarCarritoTrasModificacionDespensa(usuarioId);
        notificacionService.generarNotificacionesCaducidad(usuarioId);

        return toLoteDTO(loteResultante);
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
        return toDTO(p, duplicados, umbralEfectivo, null);
    }

    private ProductoResponseDTO toDTO(Producto p, List<ProductoResponseDTO> duplicados, int umbralEfectivo,
                                       List<ConsumoLoteDTO> consumosFifo) {
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
                calcularDiasHastaCaducidad(p),
                duplicados,
                p.getCreatedAt(),
                p.getUpdatedAt(),
                p.getTieneLotes(),
                !"sin_stock".equals(estado),
                consumosFifo
        );
    }
}
