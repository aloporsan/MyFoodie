package com.myfoodie.application.dto.carrito;

import java.util.List;

public record CarritoDTO(
        List<ItemCarritoResponseDTO> items,
        CarritoResumenDTO resumen
) {}
