package com.myfoodie.application.dto.social;

public record UsuarioBusquedaResponseDTO(
        String id,
        String nombre,
        String nombreUsuario,
        String fotoPerfil,
        int numRecetas,
        boolean esSeguido,
        boolean haSolicitado
) {}
