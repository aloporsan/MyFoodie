package com.myfoodie.application.dto.feed;

import java.util.List;

/**
 * Filtros multidimensionales aplicables al feed y al buscador de recetas.
 * Cada dimensión es multi-valor (OR interno) y todas se combinan con AND.
 * {@code tiempos} y {@code personas} llegan como buckets con formato {@code "min-max"}.
 */
public record FiltrosFeedDTO(
        List<String> categorias,
        List<String> dificultades,
        List<String> etiquetas,
        List<String> tiempos,
        List<String> personas
) {

    public FiltrosFeedDTO {
        categorias = categorias == null ? List.of() : categorias;
        dificultades = dificultades == null ? List.of() : dificultades;
        etiquetas = etiquetas == null ? List.of() : etiquetas;
        tiempos = tiempos == null ? List.of() : tiempos;
        personas = personas == null ? List.of() : personas;
    }

    public static FiltrosFeedDTO vacios() {
        return new FiltrosFeedDTO(List.of(), List.of(), List.of(), List.of(), List.of());
    }

    public boolean estaVacio() {
        return categorias.isEmpty() && dificultades.isEmpty() && etiquetas.isEmpty()
                && tiempos.isEmpty() && personas.isEmpty();
    }
}
