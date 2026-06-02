package com.myfoodie.application.dto.dashboard;

public record ProductoPrioritarioDTO(
        String id,
        String nombre,
        double cantidad,
        String unidad,
        String estado,
        String motivo
) {}
