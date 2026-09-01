package com.myfoodie.application.dto.carrito;

public record AñadirItemCarritoResponseDTO(
        String accion,
        ItemCarritoResponseDTO item,
        ItemCarritoResponseDTO itemExistente,
        Double similitud
) {}
