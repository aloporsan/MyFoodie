package com.myfoodie.application.dto.despensa;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record LoteProductoResponseDTO(
        String id,
        Float cantidad,
        String unidad,
        LocalDate fechaCaducidad,
        LocalDate fechaCompra,
        String origen,
        Integer diasHastaCaducidad,
        String estado,
        LocalDateTime createdAt
) {}
