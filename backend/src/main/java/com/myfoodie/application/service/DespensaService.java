package com.myfoodie.application.service;

import com.myfoodie.application.dto.despensa.ProductoRequestDTO;
import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import com.myfoodie.application.dto.despensa.ProductoUpdateCantidadDTO;
import com.myfoodie.domain.model.Despensa;
import com.myfoodie.domain.model.Producto;
import com.myfoodie.domain.repository.DespensaRepository;
import com.myfoodie.domain.repository.ProductoRepository;
import com.myfoodie.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DespensaService {

    private final DespensaRepository despensaRepository;
    private final ProductoRepository productoRepository;

    // -------------------------------------------------------------------------
    // CRUD básico
    // -------------------------------------------------------------------------

    public ProductoResponseDTO añadirProducto(String usuarioId, ProductoRequestDTO dto) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);

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
                .build();

        Producto saved = productoRepository.save(producto);
        actualizarDespensa(despensa);

        List<ProductoResponseDTO> duplicados = similares.stream()
                .map(p -> toDTO(p, null))
                .toList();

        return toDTO(saved, duplicados.isEmpty() ? null : duplicados);
    }

    public List<ProductoResponseDTO> listarProductos(String usuarioId) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        return productoRepository.findByDespensaId(despensa.getId())
                .stream()
                .map(p -> toDTO(p, null))
                .toList();
    }

    public ProductoResponseDTO obtenerProducto(String usuarioId, String productoId) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        return toDTO(getProductoDeUsuario(despensa.getId(), productoId), null);
    }

    public ProductoResponseDTO editarProducto(String usuarioId, String productoId, ProductoRequestDTO dto) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        Producto p = getProductoDeUsuario(despensa.getId(), productoId);

        p.setNombre(dto.nombre());
        p.setCantidad(dto.cantidad());
        p.setUnidad(dto.unidad());
        p.setCategoria(dto.categoria());
        p.setFechaCaducidad(dto.fechaCaducidad());
        p.setFechaCompra(dto.fechaCompra());
        p.setMarca(dto.marca());
        p.setNotas(dto.notas());
        p.setUpdatedAt(LocalDateTime.now());

        Producto saved = productoRepository.save(p);
        actualizarDespensa(despensa);
        return toDTO(saved, null);
    }

    public void eliminarProducto(String usuarioId, String productoId) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        Producto p = getProductoDeUsuario(despensa.getId(), productoId);
        productoRepository.delete(p);
        actualizarDespensa(despensa);
    }

    public ProductoResponseDTO actualizarCantidad(String usuarioId, String productoId,
                                                   ProductoUpdateCantidadDTO dto) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        Producto p = getProductoDeUsuario(despensa.getId(), productoId);

        double nuevaCantidad = Math.max(0, p.getCantidad() + dto.delta());
        p.setCantidad(nuevaCantidad);
        p.setUpdatedAt(LocalDateTime.now());

        Producto saved = productoRepository.save(p);
        actualizarDespensa(despensa);
        return toDTO(saved, null);
    }

    // -------------------------------------------------------------------------
    // Helpers privados
    // -------------------------------------------------------------------------

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

    String calcularEstado(Producto p) {
        if (p.getFechaCaducidad() != null) {
            LocalDate hoy = LocalDate.now();
            if (p.getFechaCaducidad().isBefore(hoy)) return "caducado";
            if (!p.getFechaCaducidad().isAfter(hoy.plusDays(3))) return "proximoCaducar";
        }
        if (p.getCantidad() <= 1) return "bajoStock";
        return "normal";
    }

    ProductoResponseDTO toDTO(Producto p, List<ProductoResponseDTO> duplicados) {
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
                calcularEstado(p),
                duplicados,
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
