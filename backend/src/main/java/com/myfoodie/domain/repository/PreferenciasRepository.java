package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.Preferencias;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PreferenciasRepository extends MongoRepository<Preferencias, String> {

    Optional<Preferencias> findByUsuarioId(String usuarioId);

}
