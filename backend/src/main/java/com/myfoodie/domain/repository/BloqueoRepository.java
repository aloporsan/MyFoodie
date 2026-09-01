package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.Bloqueo;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface BloqueoRepository extends MongoRepository<Bloqueo, String> {

    Optional<Bloqueo> findByBloqueadorIdAndBloqueadoId(String bloqueadorId, String bloqueadoId);

    boolean existsByBloqueadorIdAndBloqueadoId(String bloqueadorId, String bloqueadoId);

    List<Bloqueo> findByBloqueadorId(String bloqueadorId);

    List<Bloqueo> findByBloqueadoId(String bloqueadoId);
}
