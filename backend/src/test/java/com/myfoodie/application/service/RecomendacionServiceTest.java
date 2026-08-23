package com.myfoodie.application.service;

import com.myfoodie.application.dto.recomendacion.CandidatoRecetaDTO;
import com.myfoodie.application.dto.recomendacion.ContextoPuntuacionDTO;
import com.myfoodie.application.dto.recomendacion.RecetaPuntuadaDTO;
import com.myfoodie.domain.model.PerfilGustos;
import com.myfoodie.domain.model.Preferencias;
import com.myfoodie.domain.model.Receta;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class RecomendacionServiceTest {

    private final RecomendacionService recomendacionService = new RecomendacionService();

    private PerfilGustos perfilVacio;
    private ContextoPuntuacionDTO contextoNeutro;

    @BeforeEach
    void setUp() {
        perfilVacio = PerfilGustos.builder()
                .usuarioId("usuario-1")
                .categoriasPreferidas(new HashMap<>())
                .etiquetasPreferidas(new HashMap<>())
                .dificultadesPreferidas(new HashMap<>())
                .totalInteracciones(10)
                .build();

        contextoNeutro = new ContextoPuntuacionDTO(0, false, List.of(), false, null);
    }

    private Receta receta(String id, String autorId, String categoria, String dificultad,
                           List<String> etiquetas, int tiempoEstimado) {
        return Receta.builder()
                .id(id)
                .autorId(autorId)
                .titulo("Receta " + id)
                .categoria(categoria)
                .dificultad(dificultad)
                .etiquetas(etiquetas)
                .tiempoEstimado(tiempoEstimado)
                .build();
    }

    // ===== puntuarReceta =====

    @Test
    void puntuarReceta_perfil_vacio_y_contexto_neutro_da_solo_puntos_de_novedad() {
        Receta receta = receta("r1", "autor-1", "Cena", "Fácil", List.of("saludable"), 30);

        double puntuacion = recomendacionService.puntuarReceta(receta, "usuario-1", perfilVacio, Set.of(), contextoNeutro);

        // Sin afinidad, sin despensa, sin señales sociales: solo el 10% de novedad (categoría desconocida = 100).
        assertThat(puntuacion).isEqualTo(10.0);
    }

    @Test
    void puntuarReceta_afinidad_personal_capada_a_40_puntos() {
        PerfilGustos perfil = PerfilGustos.builder()
                .usuarioId("usuario-1")
                .categoriasPreferidas(Map.of("Cena", 50))
                .etiquetasPreferidas(new HashMap<>())
                .dificultadesPreferidas(new HashMap<>())
                .build();
        Receta receta = receta("r1", "autor-1", "Cena", null, null, 30);

        double puntuacion = recomendacionService.puntuarReceta(receta, "usuario-1", perfil, Set.of(), contextoNeutro);

        // Afinidad: min(40, 50*4)=40 -> 40*0.40=16. Novedad: categoría conocida (50) -> max(0,100-50*15)=0 -> *0.10=0.
        assertThat(puntuacion).isEqualTo(16.0);
    }

    @Test
    void puntuarReceta_tiempo_dentro_del_habitual_suma_10_puntos_de_afinidad() {
        PerfilGustos perfil = PerfilGustos.builder()
                .usuarioId("usuario-1")
                .categoriasPreferidas(new HashMap<>())
                .etiquetasPreferidas(new HashMap<>())
                .dificultadesPreferidas(new HashMap<>())
                .tiempoMaximoHabitual(45)
                .build();
        Receta receta = receta("r1", "autor-1", null, null, null, 30);

        double puntuacion = recomendacionService.puntuarReceta(receta, "usuario-1", perfil, Set.of(), contextoNeutro);

        // Afinidad: 10 (tiempo) * 0.40 = 4. Novedad: categoría null -> 100 * 0.10 = 10.
        assertThat(puntuacion).isEqualTo(14.0);
    }

    @Test
    void puntuarReceta_coincidencia_despensa_alta_aumenta_la_puntuacion() {
        Receta receta = receta("r1", "autor-1", null, null, null, 30);
        ContextoPuntuacionDTO contexto = new ContextoPuntuacionDTO(80, true, List.of(), false, null);

        double puntuacion = recomendacionService.puntuarReceta(receta, "usuario-1", perfilVacio, Set.of(), contexto);

        // Despensa: min(100, 80*0.9+10)=82 -> *0.30=24.6. Novedad: 100*0.10=10.
        assertThat(puntuacion).isCloseTo(34.6, org.assertj.core.data.Offset.offset(0.0001));
    }

    @Test
    void puntuarReceta_compartida_por_seguido_da_puntuacion_social_maxima() {
        Receta receta = receta("r1", "autor-1", null, null, null, 30);
        ContextoPuntuacionDTO contexto = new ContextoPuntuacionDTO(0, false, List.of(), true, null);

        double puntuacion = recomendacionService.puntuarReceta(receta, "usuario-1", perfilVacio, Set.of(), contexto);

        // Social: 100 * 0.20 = 20. Novedad: 100 * 0.10 = 10.
        assertThat(puntuacion).isEqualTo(30.0);
    }

    @Test
    void puntuarReceta_autor_seguido_suma_50_puntos_sociales() {
        Receta receta = receta("r1", "autor-1", null, null, null, 30);

        double puntuacion = recomendacionService.puntuarReceta(
                receta, "usuario-1", perfilVacio, Set.of("autor-1"), contextoNeutro);

        // Social: 50 * 0.20 = 10. Novedad: 100 * 0.10 = 10.
        assertThat(puntuacion).isEqualTo(20.0);
    }

    @Test
    void puntuarReceta_dos_o_mas_likes_de_seguidos_dan_40_puntos_sociales() {
        Receta receta = receta("r1", "autor-1", null, null, null, 30);
        ContextoPuntuacionDTO contexto = new ContextoPuntuacionDTO(0, false, List.of("s1", "s2"), false, null);

        double puntuacion = recomendacionService.puntuarReceta(receta, "usuario-1", perfilVacio, Set.of(), contexto);

        // Social: 40 * 0.20 = 8. Novedad: 100 * 0.10 = 10.
        assertThat(puntuacion).isEqualTo(18.0);
    }

    @Test
    void puntuarReceta_un_solo_like_de_seguido_da_20_puntos_sociales() {
        Receta receta = receta("r1", "autor-1", null, null, null, 30);
        ContextoPuntuacionDTO contexto = new ContextoPuntuacionDTO(0, false, List.of("s1"), false, null);

        double puntuacion = recomendacionService.puntuarReceta(receta, "usuario-1", perfilVacio, Set.of(), contexto);

        // Social: 20 * 0.20 = 4. Novedad: 100 * 0.10 = 10.
        assertThat(puntuacion).isEqualTo(14.0);
    }

    @Test
    void puntuarReceta_categoria_conocida_reduce_la_puntuacion_de_novedad() {
        PerfilGustos perfil = PerfilGustos.builder()
                .usuarioId("usuario-1")
                .categoriasPreferidas(Map.of("Cena", 3))
                .etiquetasPreferidas(new HashMap<>())
                .dificultadesPreferidas(new HashMap<>())
                .build();
        Receta receta = receta("r1", "autor-1", "Cena", null, null, 30);

        double puntuacion = recomendacionService.puntuarReceta(receta, "usuario-1", perfil, Set.of(), contextoNeutro);

        // Afinidad: min(40, 3*4)=12 -> *0.40=4.8. Novedad: max(0,100-3*15)=55 -> *0.10=5.5.
        assertThat(puntuacion).isEqualTo(10.3);
    }

    @Test
    void puntuarReceta_reaparicion_de_descarte_antiguo_penaliza_a_la_mitad() {
        ContextoPuntuacionDTO contexto = new ContextoPuntuacionDTO(0, false, List.of(), true, LocalDateTime.now().minusDays(31));
        Receta receta = receta("r1", "autor-1", null, null, null, 30);

        double puntuacion = recomendacionService.puntuarReceta(receta, "usuario-1", perfilVacio, Set.of(), contexto);

        // Social 100*0.20=20 + Novedad 100*0.10=10 = 30, penalizado al 50% = 15.
        assertThat(puntuacion).isEqualTo(15.0);
    }

    @Test
    void puntuarReceta_descarte_reciente_no_se_penaliza() {
        ContextoPuntuacionDTO contexto = new ContextoPuntuacionDTO(0, false, List.of(), true, LocalDateTime.now().minusDays(5));
        Receta receta = receta("r1", "autor-1", null, null, null, 30);

        double puntuacion = recomendacionService.puntuarReceta(receta, "usuario-1", perfilVacio, Set.of(), contexto);

        assertThat(puntuacion).isEqualTo(30.0);
    }

    // ===== ordenarFeed =====

    @Test
    void ordenarFeed_ordena_de_mayor_a_menor_puntuacion() {
        Receta recetaBaja = receta("baja", "autor-1", null, null, null, 30);
        Receta recetaAlta = receta("alta", "autor-2", null, null, null, 30);

        ContextoPuntuacionDTO contextoBajo = contextoNeutro;
        ContextoPuntuacionDTO contextoAlto = new ContextoPuntuacionDTO(0, false, List.of(), true, null);

        List<CandidatoRecetaDTO> candidatos = List.of(
                new CandidatoRecetaDTO(recetaBaja, contextoBajo),
                new CandidatoRecetaDTO(recetaAlta, contextoAlto)
        );

        List<RecetaPuntuadaDTO> resultado = recomendacionService.ordenarFeed(candidatos, "usuario-1", Set.of(), perfilVacio);

        assertThat(resultado).hasSize(2);
        assertThat(resultado.get(0).receta().getId()).isEqualTo("alta");
        assertThat(resultado.get(0).puntuacion()).isGreaterThan(resultado.get(1).puntuacion());
    }

    @Test
    void ordenarFeed_evita_dos_recetas_seguidas_del_mismo_autor_si_hay_alternativa() {
        // Tres recetas del mismo autor con puntuación descendente, y una de otro autor en medio del ranking.
        Receta r1 = receta("r1", "autor-1", "Cena", null, null, 30);
        Receta r2 = receta("r2", "autor-1", "Almuerzo", null, null, 30);
        Receta r3 = receta("r3", "autor-2", "Entrante", null, null, 30);

        ContextoPuntuacionDTO ctxAlto = new ContextoPuntuacionDTO(0, false, List.of(), true, null);
        ContextoPuntuacionDTO ctxMedio = new ContextoPuntuacionDTO(0, false, List.of("s1"), false, null);
        ContextoPuntuacionDTO ctxBajo = contextoNeutro;

        List<CandidatoRecetaDTO> candidatos = List.of(
                new CandidatoRecetaDTO(r1, ctxAlto),
                new CandidatoRecetaDTO(r2, ctxMedio),
                new CandidatoRecetaDTO(r3, ctxBajo)
        );

        List<RecetaPuntuadaDTO> resultado = recomendacionService.ordenarFeed(candidatos, "usuario-1", Set.of(), perfilVacio);

        assertThat(resultado).hasSize(3);
        assertThat(resultado.get(0).receta().getId()).isEqualTo("r1");
        // r2 (mismo autor que r1) se pospone en favor de r3 aunque r3 puntúe menos.
        assertThat(resultado.get(1).receta().getId()).isEqualTo("r3");
        assertThat(resultado.get(2).receta().getId()).isEqualTo("r2");
    }

    @Test
    void ordenarFeed_calcula_el_motivo_publicado_por_seguido_para_autores_seguidos() {
        Receta receta = receta("r1", "autor-1", null, null, null, 30);
        List<CandidatoRecetaDTO> candidatos = List.of(new CandidatoRecetaDTO(receta, contextoNeutro));

        List<RecetaPuntuadaDTO> resultado = recomendacionService.ordenarFeed(
                candidatos, "usuario-1", Set.of("autor-1"), perfilVacio);

        assertThat(resultado.get(0).motivoRecomendacion()).isEqualTo("Publicado por alguien que sigues");
    }

    @Test
    void ordenarFeed_calcula_el_motivo_ideal_para_ingredientes_si_hay_alta_coincidencia_de_despensa() {
        Receta receta = receta("r1", "autor-1", null, null, null, 30);
        ContextoPuntuacionDTO contexto = new ContextoPuntuacionDTO(75, false, List.of(), false, null);
        List<CandidatoRecetaDTO> candidatos = List.of(new CandidatoRecetaDTO(receta, contexto));

        List<RecetaPuntuadaDTO> resultado = recomendacionService.ordenarFeed(
                candidatos, "usuario-1", Set.of(), perfilVacio);

        assertThat(resultado.get(0).motivoRecomendacion()).isEqualTo("Ideal para tus ingredientes");
    }

    @Test
    void ordenarFeed_calcula_el_motivo_recomendado_para_ti_por_defecto() {
        PerfilGustos perfil = PerfilGustos.builder()
                .usuarioId("usuario-1")
                .categoriasPreferidas(Map.of("Cena", 5))
                .etiquetasPreferidas(new HashMap<>())
                .dificultadesPreferidas(new HashMap<>())
                .build();
        Receta receta = receta("r1", "autor-1", "Cena", null, null, 30);
        List<CandidatoRecetaDTO> candidatos = List.of(new CandidatoRecetaDTO(receta, contextoNeutro));

        List<RecetaPuntuadaDTO> resultado = recomendacionService.ordenarFeed(
                candidatos, "usuario-1", Set.of(), perfil);

        assertThat(resultado.get(0).motivoRecomendacion()).isEqualTo("Recomendado para ti");
    }

    @Test
    void puntuarReceta_nunca_baja_del_suelo_minimo_aunque_todos_los_factores_sean_cero() {
        Receta receta = receta("r1", "autor-1", null, null, null, 30);

        double puntuacion = recomendacionService.puntuarReceta(
                receta, "usuario-1", perfilVacio, Set.of(), contextoNeutro, true);

        assertThat(puntuacion).isEqualTo(0.05);
    }

    // ===== tienePerfilSuficiente (RF-REC-005, cold start) =====

    @Test
    void tienePerfilSuficiente_es_falso_si_el_perfil_es_null() {
        assertThat(recomendacionService.tienePerfilSuficiente(null)).isFalse();
    }

    @Test
    void tienePerfilSuficiente_es_falso_con_menos_de_10_interacciones() {
        PerfilGustos perfil = PerfilGustos.builder().usuarioId("u1").totalInteracciones(9).build();
        assertThat(recomendacionService.tienePerfilSuficiente(perfil)).isFalse();
    }

    @Test
    void tienePerfilSuficiente_es_verdadero_con_10_o_mas_interacciones() {
        PerfilGustos perfil = PerfilGustos.builder().usuarioId("u1").totalInteracciones(10).build();
        assertThat(recomendacionService.tienePerfilSuficiente(perfil)).isTrue();
    }

    @Test
    void tienePerfilSuficiente_es_falso_si_totalInteracciones_es_null() {
        PerfilGustos perfil = PerfilGustos.builder().usuarioId("u1").totalInteracciones(null).build();
        assertThat(recomendacionService.tienePerfilSuficiente(perfil)).isFalse();
    }

    // ===== puntuarRecetaFallback (cold start) =====

    @Test
    void puntuarRecetaFallback_sin_preferencias_solo_puntua_por_despensa() {
        Receta receta = receta("r1", "autor-1", null, null, null, 30);
        ContextoPuntuacionDTO contexto = new ContextoPuntuacionDTO(80, false, List.of(), false, null);

        double puntuacion = recomendacionService.puntuarRecetaFallback(receta, contexto, null);

        // Despensa: 80*0.9=72 -> *0.60=43.2. Preferencias: 0 (null) -> *0.40=0.
        assertThat(puntuacion).isCloseTo(43.2, org.assertj.core.data.Offset.offset(0.0001));
    }

    @Test
    void puntuarRecetaFallback_coincide_tipo_dieta_de_las_preferencias_de_onboarding() {
        Receta receta = receta("r1", "autor-1", null, null, List.of("vegano"), 30);
        Preferencias preferencias = Preferencias.builder().usuarioId("u1").tipoDieta("vegano").build();

        double puntuacion = recomendacionService.puntuarRecetaFallback(receta, contextoNeutro, preferencias);

        // Despensa: 0. Preferencias: 60 (dieta) -> *0.40=24.
        assertThat(puntuacion).isEqualTo(24.0);
    }

    @Test
    void puntuarRecetaFallback_tiempo_dentro_del_maximo_de_onboarding_suma_puntos() {
        Receta receta = receta("r1", "autor-1", null, null, null, 30);
        Preferencias preferencias = Preferencias.builder().usuarioId("u1").tiempoCoccionMax(45).build();

        double puntuacion = recomendacionService.puntuarRecetaFallback(receta, contextoNeutro, preferencias);

        // Despensa: 0. Preferencias: 40 (tiempo) -> *0.40=16.
        assertThat(puntuacion).isEqualTo(16.0);
    }

    @Test
    void puntuarRecetaFallback_nunca_baja_del_suelo_minimo_de_fallback() {
        Receta receta = receta("r1", "autor-1", null, null, null, 30);

        double puntuacion = recomendacionService.puntuarRecetaFallback(receta, contextoNeutro, null);

        assertThat(puntuacion).isEqualTo(0.1);
    }

    // ===== inicializarPerfilDesdeOnboarding (RF-REC-005) =====

    @Test
    void inicializarPerfilDesdeOnboarding_asigna_puntuacion_inicial_a_cada_tipo_de_cocina() {
        PerfilGustos perfil = recomendacionService.inicializarPerfilDesdeOnboarding(
                "usuario-1", List.of("Italiana", "Vegana"), "menos_30");

        assertThat(perfil.getUsuarioId()).isEqualTo("usuario-1");
        assertThat(perfil.getCategoriasPreferidas()).containsEntry("Italiana", 50).containsEntry("Vegana", 50);
        assertThat(perfil.getTiempoMaximoHabitual()).isEqualTo(30);
    }

    @Test
    void inicializarPerfilDesdeOnboarding_mapea_los_tres_rangos_de_tiempo_disponible() {
        assertThat(recomendacionService.inicializarPerfilDesdeOnboarding("u1", List.of(), "menos_30")
                .getTiempoMaximoHabitual()).isEqualTo(30);
        assertThat(recomendacionService.inicializarPerfilDesdeOnboarding("u1", List.of(), "30_60")
                .getTiempoMaximoHabitual()).isEqualTo(60);
        assertThat(recomendacionService.inicializarPerfilDesdeOnboarding("u1", List.of(), "mas_1_hora")
                .getTiempoMaximoHabitual()).isEqualTo(999);
    }

    @Test
    void inicializarPerfilDesdeOnboarding_tolera_listas_y_tiempo_null() {
        PerfilGustos perfil = recomendacionService.inicializarPerfilDesdeOnboarding("usuario-1", null, null);

        assertThat(perfil.getCategoriasPreferidas()).isEmpty();
        assertThat(perfil.getTiempoMaximoHabitual()).isNull();
    }

    @Test
    void inicializarPerfilDesdeOnboarding_ignora_entradas_en_blanco_de_tipos_de_cocina() {
        PerfilGustos perfil = recomendacionService.inicializarPerfilDesdeOnboarding(
                "usuario-1", java.util.Arrays.asList("Italiana", " ", null), "30_60");

        assertThat(perfil.getCategoriasPreferidas()).hasSize(1).containsKey("Italiana");
    }

    // ===== ordenarFeed en modo fallback (cold start, RF-REC-005) =====

    @Test
    void ordenarFeed_usa_puntuarRecetaFallback_si_el_perfil_no_es_suficiente() {
        PerfilGustos perfilInsuficiente = PerfilGustos.builder()
                .usuarioId("usuario-1")
                .categoriasPreferidas(new HashMap<>())
                .etiquetasPreferidas(new HashMap<>())
                .dificultadesPreferidas(new HashMap<>())
                .totalInteracciones(2)
                .build();
        Receta receta = receta("r1", "autor-1", null, null, null, 30);
        List<CandidatoRecetaDTO> candidatos = List.of(new CandidatoRecetaDTO(receta, contextoNeutro));

        List<RecetaPuntuadaDTO> resultado = recomendacionService.ordenarFeed(
                candidatos, "usuario-1", Set.of(), perfilInsuficiente, null);

        assertThat(resultado.get(0).modoFallback()).isTrue();
        assertThat(resultado.get(0).puntuacion()).isEqualTo(0.1);
    }

    @Test
    void ordenarFeed_no_usa_modo_fallback_si_el_perfil_ya_es_suficiente() {
        Receta receta = receta("r1", "autor-1", null, null, null, 30);
        List<CandidatoRecetaDTO> candidatos = List.of(new CandidatoRecetaDTO(receta, contextoNeutro));

        List<RecetaPuntuadaDTO> resultado = recomendacionService.ordenarFeed(
                candidatos, "usuario-1", Set.of(), perfilVacio, null);

        assertThat(resultado.get(0).modoFallback()).isFalse();
    }
}
