package com.myfoodie.application.dto.reporte;

import com.myfoodie.domain.model.EstadoReporte;
import com.myfoodie.domain.model.MotivoReporte;
import com.myfoodie.domain.model.TipoContenidoReporte;

import java.time.LocalDateTime;

public record ReporteResponseDTO(
        String id,
        TipoContenidoReporte tipoContenido,
        String contenidoId,
        MotivoReporte motivo,
        String descripcionAdicional,
        EstadoReporte estado,
        LocalDateTime createdAt
) {}
