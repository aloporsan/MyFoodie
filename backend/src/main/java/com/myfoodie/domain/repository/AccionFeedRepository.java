package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.AccionFeed;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface AccionFeedRepository extends MongoRepository<AccionFeed, String> {

    Optional<AccionFeed> findFirstByUsuarioIdOrderByCreatedAtDesc(String usuarioId);
}
