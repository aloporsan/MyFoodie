package com.myfoodie.application.dto.perfil;

public record PrivacidadUpdateDTO(
        Boolean perfilPublico,
        Boolean mostrarRecetas,
        Boolean mostrarEstadisticas,
        Boolean permitirMensajes
) {}
