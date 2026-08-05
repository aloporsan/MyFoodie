package com.myfoodie.application.dto.carrito;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record ItemCarritoRequestDTO(
        @NotBlank(message = "El nombre es obligatorio")
        String nombre,

        @NotNull(message = "La cantidad es obligatoria")
        @PositiveOrZero(message = "La cantidad no puede ser negativa")
        Float cantidad,

        @NotBlank(message = "La unidad es obligatoria")
        String unidad,

        String categoria
) {}
