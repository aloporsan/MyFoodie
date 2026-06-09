package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.Receta;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface RecetaRepository extends MongoRepository<Receta, String> {

    List<Receta> findByAutorId(String autorId);

    List<Receta> findByAutorIdAndEstado(String autorId, String estado);

    long countByAutorIdAndEstado(String autorId, String estado);
}
