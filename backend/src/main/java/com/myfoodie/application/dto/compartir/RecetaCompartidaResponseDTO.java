package com.myfoodie.application.dto.compartir;

import com.myfoodie.application.dto.receta.RecetaResponseDTO;

import java.time.LocalDateTime;

public record RecetaCompartidaResponseDTO(
        String id,
        EmisorDTO emisor,
        RecetaResponseDTO receta,
        String mensaje,
        boolean leida,
        LocalDateTime createdAt
) {
    public record EmisorDTO(
            String nombre,
            String nombreUsuario,
            String fotoPerfil
    ) {}
}
