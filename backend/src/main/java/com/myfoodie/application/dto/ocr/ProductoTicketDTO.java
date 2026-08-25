package com.myfoodie.application.dto.ocr;

public record ProductoTicketDTO(
        String nombreDetectado,
        Float cantidadDetectada,
        String unidadDetectada,
        String lineaOriginal
) {}
