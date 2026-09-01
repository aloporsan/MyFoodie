package com.myfoodie.application.dto.despensa;

import com.myfoodie.domain.model.CriterioFechaLote;
import jakarta.validation.constraints.NotNull;

public record CompactarLotesRequestDTO(
        @NotNull(message = "El criterio de fecha es obligatorio")
        CriterioFechaLote criterioFecha
) {}
