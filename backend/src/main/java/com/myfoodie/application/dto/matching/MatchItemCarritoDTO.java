package com.myfoodie.application.dto.matching;

import com.myfoodie.application.dto.carrito.ItemCarritoResponseDTO;
import com.myfoodie.domain.model.TipoMatch;

public record MatchItemCarritoDTO(
        ItemCarritoResponseDTO item,
        Double similitud,
        TipoMatch tipoMatch,
        String mensajeSugerencia
) {}
