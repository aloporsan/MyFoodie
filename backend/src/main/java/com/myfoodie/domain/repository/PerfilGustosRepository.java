package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.PerfilGustos;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PerfilGustosRepository extends MongoRepository<PerfilGustos, String> {

    Optional<PerfilGustos> findByUsuarioId(String usuarioId);

    void deleteByUsuarioId(String usuarioId);
}
