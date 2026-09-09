package com.myfoodie.application.dto.ocr;

import com.myfoodie.application.dto.despensa.ProductoResponseDTO;

public record ResultadoOCRDTO(
        ProductoTicketDTO productoTicket,
        String accion,
        ProductoResponseDTO productoExistente,
        Double similitud,
        String mensajeSugerencia
) {}
