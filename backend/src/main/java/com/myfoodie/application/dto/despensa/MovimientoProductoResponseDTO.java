package com.myfoodie.application.dto.despensa;

import java.time.LocalDateTime;

public record MovimientoProductoResponseDTO(
        String id,
        String tipo,
        String descripcion,
        Double cantidadAnterior,
        Double cantidadNueva,
        String motivo,
        String motivoDetalle,
        LocalDateTime createdAt
) {}
