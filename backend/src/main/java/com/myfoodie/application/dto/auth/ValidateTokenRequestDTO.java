package com.myfoodie.application.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record ValidateTokenRequestDTO(
        @NotBlank(message = "El token es obligatorio")
        String token
) {}
