package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.IngredienteReceta;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface IngredienteRecetaRepository extends MongoRepository<IngredienteReceta, String> {

    List<IngredienteReceta> findByRecetaId(String recetaId);

    List<IngredienteReceta> findByNombreContainingIgnoreCase(String nombre);

    Optional<IngredienteReceta> findByRecetaIdAndId(String recetaId, String id);

    void deleteByRecetaId(String recetaId);
}
