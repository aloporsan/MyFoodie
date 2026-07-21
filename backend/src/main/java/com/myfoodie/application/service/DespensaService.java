package com.myfoodie.application.service;

import com.myfoodie.application.dto.despensa.EliminarProductoRequestDTO;
import com.myfoodie.application.dto.despensa.MovimientoProductoResponseDTO;
import com.myfoodie.application.dto.despensa.ProductoFiltroDTO;
import com.myfoodie.application.dto.despensa.ProductoRequestDTO;
import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import com.myfoodie.application.dto.despensa.ProductoUpdateCantidadDTO;
import com.myfoodie.domain.model.Despensa;
import com.myfoodie.domain.model.MovimientoProducto;
import com.myfoodie.domain.model.Preferencias;
import com.myfoodie.domain.model.Producto;
import com.myfoodie.domain.repository.DespensaRepository;
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

    // -------------------------------------------------------------------------
    // CRUD básico
    // -------------------------------------------------------------------------

    public ProductoResponseDTO añadirProducto(String usuarioId, ProductoRequestDTO dto) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        int globalUmbral = obtenerGlobalUmbral(usuarioId);

        List<Producto> similares = productoRepository
                .findByDespensaIdAndNombreContainingIgnoreCase(despensa.getId(), dto.nombre().trim());

        Producto producto = Producto.builder()
                .despensaId(despensa.getId())
                .nombre(dto.nombre())
                .cantidad(dto.cantidad())
                .unidad(dto.unidad())
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
    }

    public ProductoResponseDTO actualizarCantidad(String usuarioId, String productoId,
                                                   ProductoUpdateCantidadDTO dto) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        int globalUmbral = obtenerGlobalUmbral(usuarioId);
        Producto p = getProductoDeUsuario(despensa.getId(), productoId);

        double cantidadAnterior = p.getCantidad();
        double nuevaCantidad = Math.max(0, cantidadAnterior + dto.delta());
        p.setCantidad(nuevaCantidad);
        p.setUpdatedAt(LocalDateTime.now());

        Producto saved = productoRepository.save(p);
        actualizarDespensa(despensa);
        registrarMovimiento(saved, usuarioId, "cantidad_actualizada", "Cantidad actualizada",
                cantidadAnterior, nuevaCantidad, dto.motivo(), dto.motivoDetalle());
        return toDTO(saved, null, resolverUmbral(saved, globalUmbral));
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
        if (p.getFechaCaducidad() != null) {
            long dias = ChronoUnit.DAYS.between(LocalDate.now(), p.getFechaCaducidad());
            if (dias < 0)   return "caducado";
            if (dias == 0)  return "caduca_hoy";
            if (dias <= 3)  return "caduca_pronto";
            if (dias <= 7)  return "caduca_semana";
            if (dias <= 30) return "caduca_mes";
            return "normal";
        }
        if (p.getCantidad() <= umbral) return "bajoStock";
        return "normal";
    }

    private Integer calcularDiasHastaCaducidad(Producto p) {
        if (p.getFechaCaducidad() == null) return null;
        return (int) ChronoUnit.DAYS.between(LocalDate.now(), p.getFechaCaducidad());
    }

    ProductoResponseDTO toDTO(Producto p, List<ProductoResponseDTO> duplicados, int umbralEfectivo) {
        boolean alertaCompra = p.getCantidad() <= umbralEfectivo;
        return new ProductoResponseDTO(
                p.getId(),
                p.getDespensaId(),
                p.getNombre(),
                p.getCantidad(),
                p.getUnidad(),
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
