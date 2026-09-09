package com.myfoodie.application.dto.recomendacion;

import com.myfoodie.domain.model.Receta;

public record RecetaPuntuadaDTO(
        Receta receta,
        double puntuacion,
        String motivoRecomendacion,
        Boolean modoFallback
) {}
