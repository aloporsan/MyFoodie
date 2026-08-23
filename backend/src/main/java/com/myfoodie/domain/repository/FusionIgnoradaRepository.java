package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.FusionIgnorada;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface FusionIgnoradaRepository extends MongoRepository<FusionIgnorada, String> {

    List<FusionIgnorada> findByUsuarioId(String usuarioId);
}
