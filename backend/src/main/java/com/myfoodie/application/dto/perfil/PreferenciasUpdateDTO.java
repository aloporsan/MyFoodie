package com.myfoodie.application.dto.perfil;

import java.util.List;

public record PreferenciasUpdateDTO(
        String tipoDieta,
        List<String> alergias,
        List<String> ingredientesNoDeseados,
        String nivelDificultad,
        Integer tiempoCoccionMax,
        Integer stockMinimoGlobal
) {}
