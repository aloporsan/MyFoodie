package com.myfoodie.application.dto.carrito;

import java.time.LocalDateTime;
import java.util.List;

public record ListaCompraResponseDTO(
        String id,
        String nombre,
        List<ItemCarritoResponseDTO> items,
        String estado,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
