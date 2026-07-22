package com.myfoodie.application.dto.receta;

import java.time.LocalDateTime;
import java.util.List;

public record RecetaFeedDTO(
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
        long totalLikes,
        boolean likeUsuario,
        List<RecetaResponseDTO.IngredienteResponseDTO> ingredientes,
        List<RecetaResponseDTO.PasoResponseDTO> pasos,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
