package com.myfoodie.application.dto.receta;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record RacionesElaboradasDTO(
        @NotNull(message = "Las raciones elaboradas son obligatorias")
        @Positive(message = "Las raciones elaboradas deben ser mayores que 0")
        Integer racionesElaboradas
) {}
