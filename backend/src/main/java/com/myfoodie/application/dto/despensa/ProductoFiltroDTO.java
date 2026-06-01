package com.myfoodie.application.dto.despensa;

import java.time.LocalDate;

public record ProductoFiltroDTO(
        String categoria,
        String estado,
        LocalDate caducaAntesDe
) {}
