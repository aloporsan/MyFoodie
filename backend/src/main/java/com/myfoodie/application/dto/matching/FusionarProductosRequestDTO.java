package com.myfoodie.application.dto.matching;

import jakarta.validation.constraints.NotBlank;

public record FusionarProductosRequestDTO(
        @NotBlank(message = "El producto a mantener es obligatorio")
        String productoMantenerId,
        @NotBlank(message = "El producto a eliminar es obligatorio")
        String productoEliminarId
) {}
