package com.myfoodie.application.dto.despensa;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

public record LoteProductoRequestDTO(
        @NotNull(message = "La cantidad es obligatoria")
        @Positive(message = "La cantidad debe ser mayor que 0")
        Float cantidad,

        @NotBlank(message = "La unidad es obligatoria")
        String unidad,

        LocalDate fechaCaducidad,
        LocalDate fechaCompra,
        String origen
) {}
