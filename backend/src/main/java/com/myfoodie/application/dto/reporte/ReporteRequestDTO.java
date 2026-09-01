package com.myfoodie.application.dto.reporte;

import com.myfoodie.domain.model.MotivoReporte;
import com.myfoodie.domain.model.TipoContenidoReporte;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReporteRequestDTO(
        @NotNull(message = "El tipo de contenido es obligatorio")
        TipoContenidoReporte tipoContenido,

        @NotBlank(message = "El identificador del contenido es obligatorio")
        String contenidoId,

        @NotNull(message = "El motivo es obligatorio")
        MotivoReporte motivo,

        @Size(max = 500, message = "La descripción no puede superar los 500 caracteres")
        String descripcionAdicional
) {}
