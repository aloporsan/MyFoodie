package com.myfoodie.application.dto.dashboard;

import java.util.List;

public record CarritoResumenDTO(
        boolean disponible,
        int productosRecomendados,
        List<String> sugeridos
) {}
