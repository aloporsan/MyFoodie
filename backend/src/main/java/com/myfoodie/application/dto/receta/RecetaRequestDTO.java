package com.myfoodie.application.dto.receta;

import java.util.List;

public record RecetaRequestDTO(
        String titulo,
        String descripcion,
        int tiempoEstimado,
        String dificultad,
        String categoria,
        List<String> etiquetas,
        String imagenUrl
) {}
