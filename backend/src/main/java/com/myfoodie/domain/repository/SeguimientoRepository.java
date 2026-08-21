package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.Seguimiento;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SeguimientoRepository extends MongoRepository<Seguimiento, String> {

    Optional<Seguimiento> findBySeguidorIdAndSeguidoId(String seguidorId, String seguidoId);

    List<Seguimiento> findBySeguidoIdAndEstado(String seguidoId, String estado);

    List<Seguimiento> findBySeguidorIdAndEstado(String seguidorId, String estado);

    long countBySeguidoIdAndEstado(String seguidoId, String estado);

    long countBySeguidorIdAndEstado(String seguidorId, String estado);
}
