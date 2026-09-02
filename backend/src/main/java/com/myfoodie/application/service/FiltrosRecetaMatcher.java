package com.myfoodie.application.service;

import com.myfoodie.application.dto.feed.FiltrosFeedDTO;
import com.myfoodie.domain.model.Receta;

import java.util.List;
import java.util.Locale;

/**
 * Aplica los {@link FiltrosFeedDTO} a una receta concreta. Compartido por el feed y el buscador.
 */
final class FiltrosRecetaMatcher {

    private FiltrosRecetaMatcher() {
    }

    static boolean cumple(Receta receta, FiltrosFeedDTO filtros) {
        if (filtros == null || filtros.estaVacio()) {
            return true;
        }
        if (!filtros.categorias().isEmpty() && !contieneIgnoreCase(filtros.categorias(), receta.getCategoria())) {
            return false;
        }
        if (!filtros.dificultades().isEmpty() && !contieneIgnoreCase(filtros.dificultades(), receta.getDificultad())) {
            return false;
        }
        if (!filtros.etiquetas().isEmpty() && !intersecta(filtros.etiquetas(), receta.getEtiquetas())) {
            return false;
        }
        if (!filtros.tiempos().isEmpty() && !enAlgunBucket(filtros.tiempos(), receta.getTiempoEstimado())) {
            return false;
        }
        int personas = receta.getNumPersonas() == null ? 0 : receta.getNumPersonas();
        if (!filtros.personas().isEmpty() && !enAlgunBucket(filtros.personas(), personas)) {
            return false;
        }
        return true;
    }

    private static boolean contieneIgnoreCase(List<String> valores, String valor) {
        if (valor == null) {
            return false;
        }
        return valores.stream().anyMatch(v -> v != null && v.equalsIgnoreCase(valor));
    }

    private static boolean intersecta(List<String> filtroEtiquetas, List<String> recetaEtiquetas) {
        if (recetaEtiquetas == null || recetaEtiquetas.isEmpty()) {
            return false;
        }
        return recetaEtiquetas.stream()
                .filter(e -> e != null)
                .map(e -> e.toLowerCase(Locale.ROOT))
                .anyMatch(e -> filtroEtiquetas.stream()
                        .anyMatch(f -> f != null && f.toLowerCase(Locale.ROOT).equals(e)));
    }

    /**
     * Cada bucket tiene formato {@code "min-max"} (ambos inclusive). Devuelve true si el valor
     * cae dentro de al menos uno.
     */
    private static boolean enAlgunBucket(List<String> buckets, int valor) {
        for (String bucket : buckets) {
            if (bucket == null) {
                continue;
            }
            String[] partes = bucket.split("-", 2);
            if (partes.length != 2) {
                continue;
            }
            try {
                int min = Integer.parseInt(partes[0].trim());
                int max = Integer.parseInt(partes[1].trim());
                if (valor >= min && valor <= max) {
                    return true;
                }
            } catch (NumberFormatException ignored) {
                // bucket mal formado: se ignora
            }
        }
        return false;
    }
}
