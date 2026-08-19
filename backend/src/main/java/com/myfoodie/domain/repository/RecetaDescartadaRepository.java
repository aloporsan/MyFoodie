package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.RecetaDescartada;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface RecetaDescartadaRepository extends MongoRepository<RecetaDescartada, String> {

    Optional<RecetaDescartada> findByUsuarioIdAndRecetaId(String usuarioId, String recetaId);

    List<RecetaDescartada> findByUsuarioId(String usuarioId);

    boolean existsByUsuarioIdAndRecetaId(String usuarioId, String recetaId);

    void deleteByUsuarioId(String usuarioId);
}
