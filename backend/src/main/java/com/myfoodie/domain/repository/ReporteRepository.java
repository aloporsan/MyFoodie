package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.Reporte;
import com.myfoodie.domain.model.TipoContenidoReporte;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ReporteRepository extends MongoRepository<Reporte, String> {

    boolean existsByUsuarioReportanteIdAndTipoContenidoAndContenidoId(
            String usuarioReportanteId, TipoContenidoReporte tipoContenido, String contenidoId);

    List<Reporte> findByTipoContenidoAndContenidoId(TipoContenidoReporte tipoContenido, String contenidoId);

    long countByTipoContenidoAndContenidoId(TipoContenidoReporte tipoContenido, String contenidoId);
}
