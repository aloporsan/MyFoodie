package com.myfoodie.application.dto.despensa;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.LocalDate;

public record ProductoRequestDTO(
        @NotBlank(message = "El nombre es obligatorio")
        String nombre,

        @PositiveOrZero(message = "La cantidad no puede ser negativa")
        double cantidad,

        @NotBlank(message = "La unidad es obligatoria")
        String unidad,

        String categoria,
        LocalDate fechaCaducidad,
        LocalDate fechaCompra,
        String marca,
        String notas,
        Integer stockMinimo
) {}
