package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.Receta;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Collection;
import java.util.List;

public interface RecetaRepository extends MongoRepository<Receta, String> {

    List<Receta> findByAutorId(String autorId);

    List<Receta> findByEstado(String estado);

    List<Receta> findByAutorIdAndEstado(String autorId, String estado);

    long countByAutorIdAndEstado(String autorId, String estado);

    Page<Receta> findByEstadoAndAutorIdNotAndIdNotIn(
            String estado, String autorId, Collection<String> idsExcluidos, Pageable pageable);

    Page<Receta> findByEstadoAndEtiquetasContainingAndAutorIdNotAndIdNotIn(
            String estado, String etiqueta, String autorId, Collection<String> idsExcluidos, Pageable pageable);

    Page<Receta> findByEstadoAndAutorIdInAndIdNotIn(
            String estado, Collection<String> autorIds, Collection<String> idsExcluidos, Pageable pageable);
}
