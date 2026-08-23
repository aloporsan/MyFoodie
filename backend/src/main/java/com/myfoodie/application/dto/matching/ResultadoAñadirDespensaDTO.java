package com.myfoodie.application.dto.matching;

import com.myfoodie.application.dto.despensa.ProductoResponseDTO;

public record ResultadoAñadirDespensaDTO(
        String itemNombre,
        String accion,
        ProductoResponseDTO productoExistente,
        ProductoResponseDTO producto,
        Double similitud
) {}
