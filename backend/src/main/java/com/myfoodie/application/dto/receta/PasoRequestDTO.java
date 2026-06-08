package com.myfoodie.application.dto.receta;

import jakarta.validation.constraints.NotBlank;

public record PasoRequestDTO(
        @NotBlank(message = "La descripción del paso es obligatoria")
        String descripcion,

        String imagenUrl
) {}
