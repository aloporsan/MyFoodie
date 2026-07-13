package com.myfoodie.application.dto.despensa;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ProductoResponseDTO(
        String id,
        String despensaId,
        String nombre,
        double cantidad,
        String unidad,
        String categoria,
        LocalDate fechaCaducidad,
        LocalDate fechaCompra,
        String marca,
        String notas,
        Integer stockMinimo,
        boolean alertaCompra,
        String estado,
        List<ProductoResponseDTO> posiblesDuplicados,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
