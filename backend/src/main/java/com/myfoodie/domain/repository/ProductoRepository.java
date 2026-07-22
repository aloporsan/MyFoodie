package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.Producto;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ProductoRepository extends MongoRepository<Producto, String> {

    List<Producto> findByDespensaId(String despensaId);

    Optional<Producto> findByDespensaIdAndId(String despensaId, String id);

    List<Producto> findByDespensaIdAndNombreContainingIgnoreCase(String despensaId, String nombre);
}
