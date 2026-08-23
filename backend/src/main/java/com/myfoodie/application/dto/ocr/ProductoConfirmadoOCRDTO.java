package com.myfoodie.application.dto.ocr;

import java.time.LocalDate;

public record ProductoConfirmadoOCRDTO(
        String nombre,
        Float cantidad,
        String unidad,
        LocalDate fechaCaducidad,
        String accion,
        String productoExistenteId
) {}
