package com.myfoodie.application.dto.comentario;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ComentarioRequestDTO(
        @NotBlank(message = "El comentario no puede estar vacío")
        @Size(max = 500, message = "El comentario no puede superar los 500 caracteres")
        String texto
) {}
