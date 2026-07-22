package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.Despensa;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface DespensaRepository extends MongoRepository<Despensa, String> {

    Optional<Despensa> findByUsuarioId(String usuarioId);
}
