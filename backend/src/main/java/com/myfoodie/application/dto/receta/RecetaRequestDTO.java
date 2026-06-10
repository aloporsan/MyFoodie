package com.myfoodie.application.dto.receta;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record RecetaRequestDTO(
        @NotBlank(message = "El título es obligatorio")
        String titulo,
        String descripcion,
        int tiempoEstimado,
        String dificultad,
        String categoria,
        List<String> etiquetas,
        String imagenUrl
) {}
