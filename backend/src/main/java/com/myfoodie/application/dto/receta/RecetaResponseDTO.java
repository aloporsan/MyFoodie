package com.myfoodie.application.dto.receta;

import java.time.LocalDateTime;
import java.util.List;

public record RecetaResponseDTO(
        String id,
        String autorId,
        String autorNombre,
        String autorNombreUsuario,
        String titulo,
        String descripcion,
        int tiempoEstimado,
        String dificultad,
        String categoria,
        List<String> etiquetas,
        String imagenUrl,
        String estado,
        Integer numPersonas,
        List<IngredienteResponseDTO> ingredientes,
        List<PasoResponseDTO> pasos,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public record IngredienteResponseDTO(
            String id,
            String nombre,
            double cantidad,
            String unidad,
            String observacion
    ) {}

    public record PasoResponseDTO(
            String id,
            int orden,
            String descripcion,
            String imagenUrl
    ) {}
}
