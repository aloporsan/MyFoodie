package com.myfoodie.application.dto.auth;

public record AuthResponseDTO(
        String token,
        String userId,
        String email,
        String nombreUsuario,
        String nombre
) {}
