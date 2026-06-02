package com.myfoodie.application.dto.dashboard;

import java.time.LocalDate;

public record AlertaCaducidadDTO(
        String id,
        String nombre,
        double cantidad,
        String unidad,
        LocalDate fechaCaducidad,
        String estado,
        long diasParaCaducar
) {}
