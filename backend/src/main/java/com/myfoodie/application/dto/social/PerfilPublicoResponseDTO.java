package com.myfoodie.application.dto.social;

import com.myfoodie.domain.model.Privacidad;

public record PerfilPublicoResponseDTO(
        String id,
        String nombre,
        String nombreUsuario,
        String fotoPerfil,
        String biografia,
        int numSeguidores,
        int numSeguidos,
        int numRecetas,
        boolean esSeguido,
        boolean haSolicitado,
        boolean estaBloqueado,
        Privacidad privacidad
) {}
