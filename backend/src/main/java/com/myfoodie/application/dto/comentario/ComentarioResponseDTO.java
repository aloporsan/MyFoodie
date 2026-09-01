package com.myfoodie.application.dto.comentario;

import java.time.LocalDateTime;

public record ComentarioResponseDTO(
        String id,
        String usuarioId,
        String nombreUsuario,
        String avatarUsuario,
        String texto,
        LocalDateTime createdAt,
        boolean esAutor
) {}
