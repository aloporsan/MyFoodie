package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.RecetaCompartida;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Collection;
import java.util.List;

public interface RecetaCompartidaRepository extends MongoRepository<RecetaCompartida, String> {

    List<RecetaCompartida> findByReceptorIdOrderByCreatedAtDesc(String receptorId);

    List<RecetaCompartida> findByEmisorIdOrderByCreatedAtDesc(String emisorId);

    List<RecetaCompartida> findByReceptorIdAndLeidaFalse(String receptorId);

    long countByReceptorIdAndLeidaFalse(String receptorId);

    List<RecetaCompartida> findByReceptorIdAndRecetaIdIn(String receptorId, Collection<String> recetaIds);
}
