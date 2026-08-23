package com.myfoodie.application.dto.matching;

import com.myfoodie.application.dto.despensa.ProductoResponseDTO;

public record ParDuplicadoDTO(
        ProductoResponseDTO productoA,
        ProductoResponseDTO productoB,
        Double similitud,
        String sugerencia
) {}
