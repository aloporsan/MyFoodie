package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.LoteProducto;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

public interface LoteProductoRepository extends MongoRepository<LoteProducto, String> {

    List<LoteProducto> findByProductoIdOrderByFechaCaducidadAsc(String productoId);

    List<LoteProducto> findByProductoIdAndCantidadGreaterThan(String productoId, float cantidad);

    List<LoteProducto> findByDespensaIdAndFechaCaducidadBefore(String despensaId, LocalDate fecha);

    List<LoteProducto> findByUsuarioIdAndOrigen(String usuarioId, String origen);

    void deleteByDespensaId(String despensaId);

    default float sumCantidadByProductoId(String productoId) {
        return findByProductoIdAndCantidadGreaterThan(productoId, 0f).stream()
                .map(LoteProducto::getCantidad)
                .filter(Objects::nonNull)
                .reduce(0f, Float::sum);
    }
}
