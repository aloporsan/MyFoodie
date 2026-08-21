package com.myfoodie.application.dto.carrito;

public record CarritoResumenDTO(
        int totalItems,
        int itemsAlta,
        int itemsMedia,
        int itemsBaja,
        int itemsAceptados
) {}
