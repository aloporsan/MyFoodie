package com.myfoodie.application.dto.feed;

import java.time.LocalDateTime;
import java.util.List;

public record RecetaFeedDTO(
        String id,
        String titulo,
        String autorId,
        String autorNombre,
        String autorUsuario,
        String autorFoto,
        int tiempoEstimado,
        String dificultad,
        List<String> etiquetas,
        String imagenUrl,
        long likes,
        boolean yaLike,
        boolean yaGuardada,
        double coincidenciaDespensa,
        int ingredientesDisponibles,
        int ingredientesFaltantes,
        LocalDateTime createdAt
) {}
