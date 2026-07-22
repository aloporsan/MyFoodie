package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.Paso;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PasoRepository extends MongoRepository<Paso, String> {

    List<Paso> findByRecetaIdOrderByOrdenAsc(String recetaId);

    Optional<Paso> findByRecetaIdAndId(String recetaId, String id);

    void deleteByRecetaId(String recetaId);
}
