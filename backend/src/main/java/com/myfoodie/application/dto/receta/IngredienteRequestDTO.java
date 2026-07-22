package com.myfoodie.application.dto.receta;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record IngredienteRequestDTO(
        @NotBlank(message = "El nombre del ingrediente es obligatorio")
        String nombre,

        @Positive(message = "La cantidad debe ser mayor que 0")
        double cantidad,

        @NotBlank(message = "La unidad es obligatoria")
        String unidad,

        String observacion
) {}
