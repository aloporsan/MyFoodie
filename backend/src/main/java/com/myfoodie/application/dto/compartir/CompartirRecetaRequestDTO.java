package com.myfoodie.application.dto.compartir;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CompartirRecetaRequestDTO(
        @NotEmpty(message = "Debes seleccionar al menos un receptor")
        List<String> receptorIds,

        @Size(max = 200, message = "El mensaje no puede superar los 200 caracteres")
        String mensaje
) {}
