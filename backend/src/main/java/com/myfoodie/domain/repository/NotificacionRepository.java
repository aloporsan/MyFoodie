package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.Notificacion;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface NotificacionRepository extends MongoRepository<Notificacion, String> {

    List<Notificacion> findByUsuarioIdOrderByCreatedAtDesc(String usuarioId);

    List<Notificacion> findByUsuarioIdOrderByCreatedAtDesc(String usuarioId, Pageable pageable);

    List<Notificacion> findByUsuarioIdAndLeidaFalse(String usuarioId);

    long countByUsuarioIdAndLeidaFalse(String usuarioId);

    boolean existsByUsuarioIdAndTipoAndReferenciaIdAndCreatedAtAfter(
            String usuarioId, String tipo, String referenciaId, LocalDateTime after);
}
