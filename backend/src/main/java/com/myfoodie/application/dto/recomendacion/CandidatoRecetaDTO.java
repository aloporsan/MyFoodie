package com.myfoodie.application.dto.recomendacion;

import com.myfoodie.domain.model.Receta;

public record CandidatoRecetaDTO(
        Receta receta,
        ContextoPuntuacionDTO contexto
) {}
