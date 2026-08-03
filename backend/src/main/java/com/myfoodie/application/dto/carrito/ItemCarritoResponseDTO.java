package com.myfoodie.application.dto.carrito;

import java.time.LocalDateTime;

public record ItemCarritoResponseDTO(
        String id,
        String usuarioId,
        String nombre,
        Float cantidad,
        String unidad,
        String categoria,
        String prioridad,
        String motivo,
        String estado,
        Boolean noVolver,
        String recetaId,
        String recetaTitulo,
        Boolean productoEnDespensa,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
