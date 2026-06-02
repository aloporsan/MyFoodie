package com.myfoodie.application.dto.perfil;

import java.time.LocalDateTime;

public record PerfilResponseDTO(
        String id,
        String nombre,
        String nombreUsuario,
        String email,
        String fotoPerfil,
        String biografia,
        LocalDateTime fechaRegistro
) {}
