package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.ItemCarrito;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ItemCarritoRepository extends MongoRepository<ItemCarrito, String> {

    List<ItemCarrito> findByUsuarioIdAndEstado(String usuarioId, String estado);

    List<ItemCarrito> findByUsuarioIdAndNoVolverTrue(String usuarioId);

    List<ItemCarrito> findByUsuarioIdAndRecetaId(String usuarioId, String recetaId);

    Optional<ItemCarrito> findByUsuarioIdAndId(String usuarioId, String id);

    List<ItemCarrito> findByUsuarioId(String usuarioId);
}
