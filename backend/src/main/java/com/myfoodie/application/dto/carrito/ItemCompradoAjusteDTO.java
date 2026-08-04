package com.myfoodie.application.dto.carrito;

import java.time.LocalDate;

public record ItemCompradoAjusteDTO(
        String itemId,
        Float cantidad,
        String unidad,
        LocalDate fechaCaducidad
) {}
