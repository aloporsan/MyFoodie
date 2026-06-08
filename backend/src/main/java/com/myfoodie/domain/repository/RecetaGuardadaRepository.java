package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.RecetaGuardada;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface RecetaGuardadaRepository extends MongoRepository<RecetaGuardada, String> {

    List<RecetaGuardada> findByUsuarioId(String usuarioId);

    Optional<RecetaGuardada> findByUsuarioIdAndRecetaId(String usuarioId, String recetaId);

    boolean existsByUsuarioIdAndRecetaId(String usuarioId, String recetaId);
}
