package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.InteraccionSocial;
import com.myfoodie.domain.model.TipoInteraccion;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface InteraccionSocialRepository extends MongoRepository<InteraccionSocial, String> {

    List<InteraccionSocial> findByUsuarioIdOrderByCreatedAtDesc(String usuarioId);

    long countByEntidadIdAndTipo(String entidadId, TipoInteraccion tipo);
}
