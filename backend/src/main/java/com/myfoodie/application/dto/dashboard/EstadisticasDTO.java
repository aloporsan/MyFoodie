package com.myfoodie.application.dto.dashboard;

public record EstadisticasDTO(
        int totalRegistrados,
        int consumidos,
        int caducadosHistorico,
        String categoriaLider,
        double aprovechamiento
) {}
