package com.myfoodie.application.dto.matching;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record FusionarProductosRequestDTO(
        @NotBlank(message = "El producto a mantener es obligatorio")
        String productoMantenerId,
        @NotBlank(message = "El producto a eliminar es obligatorio")
        String productoEliminarId,
        String unidadElegida,
        LocalDate fechaCaducidadElegida
) {}
