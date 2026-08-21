package com.myfoodie.application.dto.notificacion;

import java.time.LocalDateTime;

public record NotificacionResponseDTO(
        String id,
        String tipo,
        EmisorDTO emisor,
        String titulo,
        String cuerpo,
        boolean leida,
        String referenciaId,
        String referenciaType,
        LocalDateTime createdAt
) {
    public record EmisorDTO(
            String id,
            String nombre,
            String nombreUsuario,
            String fotoPerfil
    ) {}
}
