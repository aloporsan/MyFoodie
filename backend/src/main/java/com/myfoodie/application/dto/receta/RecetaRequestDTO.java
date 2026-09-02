package com.myfoodie.application.dto.receta;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import com.myfoodie.domain.model.VisibilidadReceta;
import java.util.List;

public record RecetaRequestDTO(
        @NotBlank(message = "El título es obligatorio")
        String titulo,
        String descripcion,
        int tiempoEstimado,
        String dificultad,
        String categoria,
        List<String> etiquetas,
        String imagenUrl,
        @Min(value = 1, message = "El número de personas debe ser al menos 1")
        @Max(value = 20, message = "El número de personas no puede superar 20")
        Integer numPersonas,
        VisibilidadReceta visibilidad
) {}
