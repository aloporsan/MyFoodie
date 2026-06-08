package com.myfoodie.application.dto.receta;

import java.time.LocalDateTime;
import java.util.List;

public record RecetaResumenDTO(
        String id,
        String autorId,
        String titulo,
        String descripcion,
        int tiempoEstimado,
        String dificultad,
        String categoria,
        List<String> etiquetas,
        String imagenUrl,
        String estado,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
