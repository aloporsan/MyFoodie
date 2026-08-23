package com.myfoodie.application.service;

import com.myfoodie.application.dto.recomendacion.CandidatoRecetaDTO;
import com.myfoodie.application.dto.recomendacion.ContextoPuntuacionDTO;
import com.myfoodie.application.dto.recomendacion.RecetaPuntuadaDTO;
import com.myfoodie.domain.model.PerfilGustos;
import com.myfoodie.domain.model.Preferencias;
import com.myfoodie.domain.model.Receta;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class RecomendacionService {

    private static final double PESO_AFINIDAD = 0.40;
    private static final double PESO_DESPENSA = 0.30;
    private static final double PESO_SOCIAL = 0.20;
    private static final double PESO_NOVEDAD = 0.10;

    private static final double PESO_DESPENSA_FALLBACK = 0.60;
    private static final double PESO_PREFERENCIAS_FALLBACK = 0.40;

    private static final int DIAS_REAPARICION_DESCARTE = 30;
    private static final double PENALIZACION_REAPARICION_DESCARTE = 0.5;

    private static final int MINIMO_INTERACCIONES_PERFIL_SUFICIENTE = 10;
    private static final int MINIMO_RECETAS_PARA_FACTOR_NOVEDAD = 20;
    private static final int PUNTUACION_INICIAL_ONBOARDING = 50;

    private static final double PUNTUACION_MINIMA_FLOOR = 0.05;
    private static final double PUNTUACION_MINIMA_FALLBACK = 0.1;

    public double puntuarReceta(Receta receta, String usuarioId, PerfilGustos perfilGustos,
                                 Set<String> seguidosIds, ContextoPuntuacionDTO contexto) {
        return puntuarReceta(receta, usuarioId, perfilGustos, seguidosIds, contexto, false);
    }

    public double puntuarReceta(Receta receta, String usuarioId, PerfilGustos perfilGustos,
                                 Set<String> seguidosIds, ContextoPuntuacionDTO contexto,
                                 boolean desactivarFactorNovedad) {
        double afinidad = calcularAfinidadPersonal(receta, perfilGustos);
        double despensa = calcularCoincidenciaDespensa(contexto);
        double social = calcularSeñalesSociales(receta, seguidosIds, contexto);
        double novedad = desactivarFactorNovedad ? 0 : calcularNovedadYVariedad(receta, perfilGustos);

        double puntuacion = afinidad * PESO_AFINIDAD
                + despensa * PESO_DESPENSA
                + social * PESO_SOCIAL
                + novedad * PESO_NOVEDAD;

        if (esReaparicionDeDescarteAntiguo(contexto)) {
            puntuacion *= PENALIZACION_REAPARICION_DESCARTE;
        }

        return Math.max(PUNTUACION_MINIMA_FLOOR, puntuacion);
    }

    public double puntuarRecetaFallback(Receta receta, ContextoPuntuacionDTO contexto, Preferencias preferencias) {
        double despensa = calcularCoincidenciaDespensa(contexto);
        double afinidadPreferencias = calcularAfinidadPreferenciasOnboarding(receta, preferencias);

        double puntuacion = despensa * PESO_DESPENSA_FALLBACK + afinidadPreferencias * PESO_PREFERENCIAS_FALLBACK;

        return Math.max(PUNTUACION_MINIMA_FALLBACK, puntuacion);
    }

    public boolean tienePerfilSuficiente(PerfilGustos perfilGustos) {
        Integer total = perfilGustos != null ? perfilGustos.getTotalInteracciones() : null;
        return total != null && total >= MINIMO_INTERACCIONES_PERFIL_SUFICIENTE;
    }

    public PerfilGustos inicializarPerfilDesdeOnboarding(String usuarioId, List<String> tiposCocinaPreferidos,
                                                          String tiempoDisponible) {
        Map<String, Integer> categoriasPreferidas = new HashMap<>();
        if (tiposCocinaPreferidos != null) {
            for (String tipoCocina : tiposCocinaPreferidos) {
                if (tipoCocina != null && !tipoCocina.isBlank()) {
                    categoriasPreferidas.put(tipoCocina, PUNTUACION_INICIAL_ONBOARDING);
                }
            }
        }

        return PerfilGustos.builder()
                .usuarioId(usuarioId)
                .categoriasPreferidas(categoriasPreferidas)
                .etiquetasPreferidas(new HashMap<>())
                .dificultadesPreferidas(new HashMap<>())
                .tiempoMaximoHabitual(mapearTiempoDisponible(tiempoDisponible))
                .build();
    }

    private Integer mapearTiempoDisponible(String tiempoDisponible) {
        if (tiempoDisponible == null) {
            return null;
        }
        return switch (tiempoDisponible) {
            case "menos_30" -> 30;
            case "30_60" -> 60;
            case "mas_1_hora" -> 999;
            default -> null;
        };
    }

    public List<RecetaPuntuadaDTO> ordenarFeed(List<CandidatoRecetaDTO> candidatos, String usuarioId,
                                                Set<String> seguidosIds, PerfilGustos perfilGustos) {
        return ordenarFeed(candidatos, usuarioId, seguidosIds, perfilGustos, null);
    }

    public List<RecetaPuntuadaDTO> ordenarFeed(List<CandidatoRecetaDTO> candidatos, String usuarioId,
                                                Set<String> seguidosIds, PerfilGustos perfilGustos,
                                                Preferencias preferencias) {
        boolean modoFallback = !tienePerfilSuficiente(perfilGustos);
        boolean pocasRecetas = candidatos.size() < MINIMO_RECETAS_PARA_FACTOR_NOVEDAD;

        List<RecetaPuntuadaDTO> puntuados = candidatos.stream()
                .map(c -> {
                    double puntuacion = modoFallback
                            ? puntuarRecetaFallback(c.receta(), c.contexto(), preferencias)
                            : puntuarReceta(c.receta(), usuarioId, perfilGustos, seguidosIds, c.contexto(), pocasRecetas);
                    String motivo = determinarMotivo(c.receta(), seguidosIds, c.contexto(), perfilGustos);
                    return new RecetaPuntuadaDTO(c.receta(), puntuacion, motivo, modoFallback);
                })
                .sorted((a, b) -> Double.compare(b.puntuacion(), a.puntuacion()))
                .toList();

        return aplicarReglasDeVariedad(puntuados);
    }

    // ---------- Factores de puntuación ----------

    private double calcularAfinidadPersonal(Receta receta, PerfilGustos perfilGustos) {
        Map<String, Integer> categorias = perfilGustos.getCategoriasPreferidas();
        Map<String, Integer> etiquetas = perfilGustos.getEtiquetasPreferidas();
        Map<String, Integer> dificultades = perfilGustos.getDificultadesPreferidas();

        double puntos = 0;

        if (receta.getCategoria() != null && categorias != null) {
            puntos += Math.min(40, categorias.getOrDefault(receta.getCategoria(), 0) * 4.0);
        }

        if (receta.getEtiquetas() != null && etiquetas != null) {
            int sumaEtiquetas = receta.getEtiquetas().stream()
                    .mapToInt(e -> etiquetas.getOrDefault(e, 0))
                    .sum();
            puntos += Math.min(30, sumaEtiquetas * 3.0);
        }

        if (receta.getDificultad() != null && dificultades != null) {
            puntos += Math.min(20, dificultades.getOrDefault(receta.getDificultad(), 0) * 4.0);
        }

        if (perfilGustos.getTiempoMaximoHabitual() != null
                && receta.getTiempoEstimado() <= perfilGustos.getTiempoMaximoHabitual()) {
            puntos += 10;
        }

        return Math.min(100, puntos);
    }

    private double calcularCoincidenciaDespensa(ContextoPuntuacionDTO contexto) {
        double puntos = contexto.coincidenciaDespensa() * 0.9;
        if (contexto.tieneIngredientesProximosACaducar()) {
            puntos += 10;
        }
        return Math.min(100, puntos);
    }

    private double calcularSeñalesSociales(Receta receta, Set<String> seguidosIds, ContextoPuntuacionDTO contexto) {
        if (contexto.compartidaPorSeguido()) {
            return 100;
        }

        double puntos = 0;
        if (seguidosIds != null && seguidosIds.contains(receta.getAutorId())) {
            puntos += 50;
        }

        List<String> likesDeSeguidos = contexto.seguidosQueDieronLike();
        if (likesDeSeguidos != null && !likesDeSeguidos.isEmpty()) {
            puntos += likesDeSeguidos.size() >= 2 ? 40 : 20;
        }

        return Math.min(100, puntos);
    }

    private double calcularNovedadYVariedad(Receta receta, PerfilGustos perfilGustos) {
        Map<String, Integer> categorias = perfilGustos.getCategoriasPreferidas();
        int puntuacionCategoria = (categorias == null || receta.getCategoria() == null)
                ? 0
                : categorias.getOrDefault(receta.getCategoria(), 0);

        if (puntuacionCategoria == 0) {
            return 100;
        }

        return Math.max(0, 100 - puntuacionCategoria * 15.0);
    }

    private double calcularAfinidadPreferenciasOnboarding(Receta receta, Preferencias preferencias) {
        if (preferencias == null) {
            return 0;
        }

        double puntos = 0;
        if (preferencias.getTipoDieta() != null && receta.getEtiquetas() != null
                && receta.getEtiquetas().stream().anyMatch(e -> e.equalsIgnoreCase(preferencias.getTipoDieta()))) {
            puntos += 60;
        }

        if (preferencias.getTiempoCoccionMax() != null
                && receta.getTiempoEstimado() <= preferencias.getTiempoCoccionMax()) {
            puntos += 40;
        }

        return Math.min(100, puntos);
    }

    private boolean esReaparicionDeDescarteAntiguo(ContextoPuntuacionDTO contexto) {
        LocalDateTime fechaDescarte = contexto.fechaDescarte();
        return fechaDescarte != null
                && ChronoUnit.DAYS.between(fechaDescarte, LocalDateTime.now()) > DIAS_REAPARICION_DESCARTE;
    }

    // ---------- Motivo de recomendación ----------

    private String determinarMotivo(Receta receta, Set<String> seguidosIds, ContextoPuntuacionDTO contexto,
                                     PerfilGustos perfilGustos) {
        if (seguidosIds != null && seguidosIds.contains(receta.getAutorId())) {
            return "Publicado por alguien que sigues";
        }

        List<String> likesDeSeguidos = contexto.seguidosQueDieronLike();
        if (likesDeSeguidos != null && likesDeSeguidos.size() >= 2) {
            return "Popular entre tus seguidos";
        }

        if (contexto.coincidenciaDespensa() >= 70) {
            return "Ideal para tus ingredientes";
        }

        Map<String, Integer> categorias = perfilGustos.getCategoriasPreferidas();
        int puntuacionCategoria = (categorias == null || receta.getCategoria() == null)
                ? 0
                : categorias.getOrDefault(receta.getCategoria(), 0);
        if (puntuacionCategoria == 0) {
            return "Nueva categoría para ti";
        }

        return "Recomendado para ti";
    }

    // ---------- Regla de variedad (categoría y autor consecutivos) ----------

    private List<RecetaPuntuadaDTO> aplicarReglasDeVariedad(List<RecetaPuntuadaDTO> ordenadosPorPuntuacion) {
        LinkedList<RecetaPuntuadaDTO> restantes = new LinkedList<>(ordenadosPorPuntuacion);
        List<RecetaPuntuadaDTO> resultado = new ArrayList<>(restantes.size());

        while (!restantes.isEmpty()) {
            RecetaPuntuadaDTO elegido = restantes.stream()
                    .filter(candidato -> respetaVariedad(resultado, candidato))
                    .findFirst()
                    .orElseGet(restantes::getFirst);

            resultado.add(elegido);
            restantes.remove(elegido);
        }

        return resultado;
    }

    private boolean respetaVariedad(List<RecetaPuntuadaDTO> parcial, RecetaPuntuadaDTO candidato) {
        int n = parcial.size();

        if (n >= 1 && mismoAutor(parcial.get(n - 1), candidato)) {
            return false;
        }

        if (n >= 2 && mismaCategoria(parcial.get(n - 1), candidato) && mismaCategoria(parcial.get(n - 2), candidato)) {
            return false;
        }

        return true;
    }

    private boolean mismaCategoria(RecetaPuntuadaDTO a, RecetaPuntuadaDTO b) {
        return Objects.equals(a.receta().getCategoria(), b.receta().getCategoria());
    }

    private boolean mismoAutor(RecetaPuntuadaDTO a, RecetaPuntuadaDTO b) {
        return Objects.equals(a.receta().getAutorId(), b.receta().getAutorId());
    }
}
