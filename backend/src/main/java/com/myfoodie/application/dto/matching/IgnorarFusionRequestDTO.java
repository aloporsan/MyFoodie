package com.myfoodie.application.dto.matching;

import jakarta.validation.constraints.NotBlank;

public record IgnorarFusionRequestDTO(
        @NotBlank(message = "El producto A es obligatorio")
        String productoAId,
        @NotBlank(message = "El producto B es obligatorio")
        String productoBId
) {}
