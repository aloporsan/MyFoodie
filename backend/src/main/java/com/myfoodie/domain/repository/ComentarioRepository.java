package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.Comentario;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ComentarioRepository extends MongoRepository<Comentario, String> {

    List<Comentario> findByRecetaIdAndEliminadoFalseOrderByCreatedAtDesc(String recetaId);

    long countByRecetaIdAndEliminadoFalse(String recetaId);

    Optional<Comentario> findByIdAndUsuarioId(String id, String usuarioId);
}
