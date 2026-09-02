package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.ListaCompra;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ListaCompraRepository extends MongoRepository<ListaCompra, String> {

    List<ListaCompra> findByUsuarioIdAndEstado(String usuarioId, String estado);

    List<ListaCompra> findByUsuarioIdAndEstadoIn(String usuarioId, Collection<String> estados);

    Optional<ListaCompra> findTopByUsuarioIdOrderByCreatedAtDesc(String usuarioId);

    List<ListaCompra> findByUsuarioIdOrderByCreatedAtDesc(String usuarioId);

    Optional<ListaCompra> findByUsuarioIdAndId(String usuarioId, String id);
}
