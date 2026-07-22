package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.Like;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface LikeRepository extends MongoRepository<Like, String> {

    Optional<Like> findByUsuarioIdAndRecetaId(String usuarioId, String recetaId);

    boolean existsByUsuarioIdAndRecetaId(String usuarioId, String recetaId);

    long countByRecetaId(String recetaId);
}
