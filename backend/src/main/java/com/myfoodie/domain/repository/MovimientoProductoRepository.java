package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.MovimientoProducto;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MovimientoProductoRepository extends MongoRepository<MovimientoProducto, String> {

    List<MovimientoProducto> findByProductoIdOrderByCreatedAtDesc(String productoId);

    List<MovimientoProducto> findByDespensaIdAndTipo(String despensaId, String tipo);

    List<MovimientoProducto> findByDespensaIdAndMotivo(String despensaId, String motivo);

    List<MovimientoProducto> findByDespensaIdAndTipoAndMotivo(String despensaId, String tipo, String motivo);
}
