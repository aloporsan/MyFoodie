package com.myfoodie.application.service;

import com.myfoodie.application.dto.feed.FiltrosFeedDTO;
import com.myfoodie.domain.model.Receta;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@link FiltrosRecetaMatcher} es lógica pura (sin dependencias): se comparte entre el feed y el
 * buscador, así que conviene tenerla cubierta de forma directa.
 */
class FiltrosRecetaMatcherTest {

    private Receta.RecetaBuilder recetaBase() {
        return Receta.builder()
                .titulo("Paella")
                .categoria("Arroces")
                .dificultad("Media")
                .etiquetas(List.of("sin gluten", "tradicional"))
                .tiempoEstimado(45)
                .numPersonas(4);
    }

    @Test
    @DisplayName("filtros null -> siempre cumple")
    void filtrosNull_cumpleSiempre() {
        assertThat(FiltrosRecetaMatcher.cumple(recetaBase().build(), null)).isTrue();
    }

    @Test
    @DisplayName("filtros vacíos -> siempre cumple")
    void filtrosVacios_cumpleSiempre() {
        assertThat(FiltrosRecetaMatcher.cumple(recetaBase().build(), FiltrosFeedDTO.vacios())).isTrue();
    }

    @Test
    @DisplayName("categoría coincide ignorando mayúsculas")
    void categoria_coincideIgnoreCase() {
        FiltrosFeedDTO filtros = new FiltrosFeedDTO(List.of("arroces"), null, null, null, null);
        assertThat(FiltrosRecetaMatcher.cumple(recetaBase().build(), filtros)).isTrue();
    }

    @Test
    @DisplayName("categoría no coincide -> no cumple")
    void categoria_noCoincide() {
        FiltrosFeedDTO filtros = new FiltrosFeedDTO(List.of("Postres"), null, null, null, null);
        assertThat(FiltrosRecetaMatcher.cumple(recetaBase().build(), filtros)).isFalse();
    }

    @Test
    @DisplayName("categoría nula en la receta -> no cumple si hay filtro de categoría")
    void categoriaNulaEnReceta_noCumple() {
        FiltrosFeedDTO filtros = new FiltrosFeedDTO(List.of("Arroces"), null, null, null, null);
        assertThat(FiltrosRecetaMatcher.cumple(recetaBase().categoria(null).build(), filtros)).isFalse();
    }

    @Test
    @DisplayName("dificultad coincide ignorando mayúsculas")
    void dificultad_coincideIgnoreCase() {
        FiltrosFeedDTO filtros = new FiltrosFeedDTO(null, List.of("MEDIA"), null, null, null);
        assertThat(FiltrosRecetaMatcher.cumple(recetaBase().build(), filtros)).isTrue();
    }

    @Test
    @DisplayName("dificultad no coincide -> no cumple")
    void dificultad_noCoincide() {
        FiltrosFeedDTO filtros = new FiltrosFeedDTO(null, List.of("Fácil", "Difícil"), null, null, null);
        assertThat(FiltrosRecetaMatcher.cumple(recetaBase().build(), filtros)).isFalse();
    }

    @Test
    @DisplayName("etiquetas: basta una en común (case-insensitive)")
    void etiquetas_interseccion() {
        FiltrosFeedDTO filtros = new FiltrosFeedDTO(null, null, List.of("TRADICIONAL", "rápido"), null, null);
        assertThat(FiltrosRecetaMatcher.cumple(recetaBase().build(), filtros)).isTrue();
    }

    @Test
    @DisplayName("etiquetas: sin ninguna en común -> no cumple")
    void etiquetas_sinInterseccion() {
        FiltrosFeedDTO filtros = new FiltrosFeedDTO(null, null, List.of("picante", "vegano"), null, null);
        assertThat(FiltrosRecetaMatcher.cumple(recetaBase().build(), filtros)).isFalse();
    }

    @Test
    @DisplayName("etiquetas: receta sin etiquetas y filtro con etiquetas -> no cumple")
    void etiquetas_recetaSinEtiquetas() {
        FiltrosFeedDTO filtros = new FiltrosFeedDTO(null, null, List.of("tradicional"), null, null);
        assertThat(FiltrosRecetaMatcher.cumple(recetaBase().etiquetas(List.of()).build(), filtros)).isFalse();
    }

    @Test
    @DisplayName("tiempo dentro de algún bucket 'min-max' -> cumple")
    void tiempo_dentroDeBucket() {
        FiltrosFeedDTO filtros = new FiltrosFeedDTO(null, null, null, List.of("0-15", "30-60"), null);
        assertThat(FiltrosRecetaMatcher.cumple(recetaBase().tiempoEstimado(45).build(), filtros)).isTrue();
    }

    @Test
    @DisplayName("tiempo fuera de todos los buckets -> no cumple")
    void tiempo_fueraDeBucket() {
        FiltrosFeedDTO filtros = new FiltrosFeedDTO(null, null, null, List.of("0-15", "16-30"), null);
        assertThat(FiltrosRecetaMatcher.cumple(recetaBase().tiempoEstimado(45).build(), filtros)).isFalse();
    }

    @Test
    @DisplayName("bucket mal formado se ignora (no revienta)")
    void bucket_malFormadoSeIgnora() {
        FiltrosFeedDTO filtros = new FiltrosFeedDTO(null, null, null, List.of("no-es-un-bucket", "30-60"), null);
        assertThat(FiltrosRecetaMatcher.cumple(recetaBase().tiempoEstimado(45).build(), filtros)).isTrue();
    }

    @Test
    @DisplayName("personas: numPersonas nulo se trata como 0")
    void personas_numPersonasNuloEsCero() {
        FiltrosFeedDTO conCero = new FiltrosFeedDTO(null, null, null, null, List.of("0-2"));
        FiltrosFeedDTO sinCero = new FiltrosFeedDTO(null, null, null, null, List.of("3-6"));
        assertThat(FiltrosRecetaMatcher.cumple(recetaBase().numPersonas(null).build(), conCero)).isTrue();
        assertThat(FiltrosRecetaMatcher.cumple(recetaBase().numPersonas(null).build(), sinCero)).isFalse();
    }

    @Test
    @DisplayName("varias dimensiones combinan con AND: falla una -> no cumple")
    void combinacionAnd_fallaUnaDimension() {
        FiltrosFeedDTO filtros = new FiltrosFeedDTO(
                List.of("Arroces"), List.of("Fácil"), null, null, null);
        assertThat(FiltrosRecetaMatcher.cumple(recetaBase().build(), filtros)).isFalse();
    }

    @Test
    @DisplayName("varias dimensiones combinan con AND: todas pasan -> cumple")
    void combinacionAnd_todasPasan() {
        FiltrosFeedDTO filtros = new FiltrosFeedDTO(
                List.of("Arroces"), List.of("Media"), List.of("tradicional"),
                List.of("30-60"), List.of("3-6"));
        assertThat(FiltrosRecetaMatcher.cumple(recetaBase().build(), filtros)).isTrue();
    }
}
