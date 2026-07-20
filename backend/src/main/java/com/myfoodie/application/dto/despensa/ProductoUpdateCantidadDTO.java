package com.myfoodie.application.dto.despensa;

import jakarta.validation.constraints.NotNull;

public record ProductoUpdateCantidadDTO(
        @NotNull(message = "El delta es obligatorio")
        Double delta,
        String motivo,
        String motivoDetalle
) {}
