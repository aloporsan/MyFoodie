package com.myfoodie.application.service;

import com.myfoodie.application.dto.recomendacion.CandidatoRecetaDTO;
import com.myfoodie.application.dto.recomendacion.ContextoPuntuacionDTO;
import com.myfoodie.application.dto.recomendacion.RecetaPuntuadaDTO;
import com.myfoodie.domain.model.PerfilGustos;
import com.myfoodie.domain.model.Preferencias;
import com.myfoodie.domain.model.Receta;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;
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
                    double base = modoFallback
                            ? puntuarRecetaFallback(c.receta(), c.contexto(), preferencias)
                            : puntuarReceta(c.receta(), usuarioId, perfilGustos, seguidosIds, c.contexto(), pocasRecetas);
                    // La dieta/preferencias y los gustos culinarios (aprendidos o del onboarding)
                    // empujan el orden en los dos modos: en fallback también, porque ahí el
                    // perfil de gustos aún no tiene peso propio dentro de la puntuación base.
                    double puntuacion = base
                            * factorPreferencias(c.receta(), preferencias)
                            * (modoFallback ? factorGustosSuave(c.receta(), perfilGustos) : 1.0);
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

    // Empujón suave por preferencias explícitas del perfil. La dieta/alérgenos que SÍ tienen
    // etiqueta equivalente ya se aplican como filtro duro en FeedService; aquí se prioriza
    // además la dieta declarada (incluidas las que no filtran, como Keto) cuando la receta
    // la lleva como etiqueta, más el tiempo y la dificultad habituales.
    private double factorPreferencias(Receta receta, Preferencias preferencias) {
        if (preferencias == null) {
            return 1.0;
        }
        double factor = 1.0;
        if (dietaCoincideConEtiquetas(preferencias.getTipoDieta(), receta.getEtiquetas())) {
            factor *= 1.20;
        }
        if (preferencias.getTiempoCoccionMax() != null && receta.getTiempoEstimado() > 0
                && receta.getTiempoEstimado() <= preferencias.getTiempoCoccionMax()) {
            factor *= 1.10;
        }
        if (preferencias.getNivelDificultad() != null && receta.getDificultad() != null
                && preferencias.getNivelDificultad().equalsIgnoreCase(receta.getDificultad())) {
            factor *= 1.10;
        }
        return factor;
    }

    // En modo fallback (pocas interacciones) la puntuación base apenas usa el perfil de
    // gustos, así que se aplica aquí: recetas de una categoría/etiqueta que el usuario ya
    // marcó como favorita (onboarding) o que ha aprendido el sistema suben en el orden.
    private double factorGustosSuave(Receta receta, PerfilGustos perfilGustos) {
        if (perfilGustos == null) {
            return 1.0;
        }
        double factor = 1.0;
        Map<String, Integer> categorias = perfilGustos.getCategoriasPreferidas();
        if (categorias != null && receta.getCategoria() != null
                && categorias.getOrDefault(receta.getCategoria(), 0) > 0) {
            factor *= 1.15;
        }
        Map<String, Integer> etiquetas = perfilGustos.getEtiquetasPreferidas();
        if (etiquetas != null && receta.getEtiquetas() != null
                && receta.getEtiquetas().stream().anyMatch(e -> etiquetas.getOrDefault(e, 0) > 0)) {
            factor *= 1.10;
        }
        return factor;
    }

    // "Vegetariana" ~ etiqueta "vegetariano", "Mediterránea" ~ "mediterráneo", "Keto" ~ "keto".
    // Se compara sin acentos y quitando la vocal final de género; "vegetariana" acepta "vegano".
    private boolean dietaCoincideConEtiquetas(String tipoDieta, List<String> etiquetas) {
        if (tipoDieta == null || tipoDieta.isBlank() || etiquetas == null) {
            return false;
        }
        String dieta = stem(tipoDieta);
        return etiquetas.stream()
                .filter(Objects::nonNull)
                .map(RecomendacionService::stem)
                .anyMatch(e -> e.equals(dieta) || (dieta.equals("vegetarian") && e.equals("vegan")));
    }

    private static String stem(String valor) {
        String n = Normalizer.normalize(valor.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return (n.endsWith("a") || n.endsWith("o")) ? n.substring(0, n.length() - 1) : n;
    }

    private double calcularAfinidadPreferenciasOnboarding(Receta receta, Preferencias preferencias) {
        if (preferencias == null) {
            return 0;
        }

        double puntos = 0;
        if (dietaCoincideConEtiquetas(preferencias.getTipoDieta(), receta.getEtiquetas())) {
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
