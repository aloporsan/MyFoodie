package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.Notificacion;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface NotificacionRepository extends MongoRepository<Notificacion, String> {

    List<Notificacion> findByUsuarioIdOrderByCreatedAtDesc(String usuarioId);

    long countByUsuarioIdAndLeidaFalse(String usuarioId);
}
