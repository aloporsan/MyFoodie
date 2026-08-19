package com.myfoodie.application.dto.feed;

import java.util.Date;
import java.util.List;
import java.util.Map;

public record PerfilGustosResponseDTO(
        String usuarioId,
        Map<String, Integer> categoriasPreferidas,
        Map<String, Integer> etiquetasPreferidas,
        Map<String, Integer> dificultadesPreferidas,
        Integer tiempoMaximoHabitual,
        List<String> ingredientesHabituales,
        Date updatedAt
) {}
