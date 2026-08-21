package com.myfoodie.application.dto.social;

import java.time.LocalDateTime;

public record SeguimientoResponseDTO(
        String id,
        String usuarioId,
        String nombre,
        String nombreUsuario,
        String fotoPerfil,
        String estado,
        LocalDateTime fechaSeguimiento
) {}
