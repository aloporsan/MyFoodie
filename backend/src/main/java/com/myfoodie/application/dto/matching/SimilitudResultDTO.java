package com.myfoodie.application.dto.matching;

public record SimilitudResultDTO(
        Double puntuacion,
        String textoNormalizadoA,
        String textoNormalizadoB,
        Boolean fueronSinonimos
) {}
