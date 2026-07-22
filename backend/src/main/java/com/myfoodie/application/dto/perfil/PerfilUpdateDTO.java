package com.myfoodie.application.dto.perfil;

import jakarta.validation.constraints.Size;

public record PerfilUpdateDTO(
        @Size(min = 1, max = 100, message = "El nombre debe tener entre 1 y 100 caracteres")
        String nombre,

        @Size(min = 3, max = 30, message = "El nombre de usuario debe tener entre 3 y 30 caracteres")
        String nombreUsuario,

        String fotoPerfil,

        @Size(max = 500, message = "La biografía no puede superar 500 caracteres")
        String biografia
) {}
