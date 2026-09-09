package com.myfoodie.application.dto.matching;

import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import com.myfoodie.domain.model.TipoMatch;

public record MatchProductoDTO(
        ProductoResponseDTO producto,
        Double similitud,
        TipoMatch tipoMatch,
        String textoSugerido
) {}
