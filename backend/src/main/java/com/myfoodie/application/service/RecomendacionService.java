package com.myfoodie.application.service;

import com.myfoodie.application.dto.recomendacion.CandidatoRecetaDTO;
import com.myfoodie.application.dto.recomendacion.ContextoPuntuacionDTO;
import com.myfoodie.application.dto.recomendacion.RecetaPuntuadaDTO;
import com.myfoodie.domain.model.PerfilGustos;
import com.myfoodie.domain.model.Receta;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
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

    private static final int DIAS_REAPARICION_DESCARTE = 30;
    private static final double PENALIZACION_REAPARICION_DESCARTE = 0.5;

    public double puntuarReceta(Receta receta, String usuarioId, PerfilGustos perfilGustos,
                                 Set<String> seguidosIds, ContextoPuntuacionDTO contexto) {
        double afinidad = calcularAfinidadPersonal(receta, perfilGustos);
        double despensa = calcularCoincidenciaDespensa(contexto);
        double social = calcularSeñalesSociales(receta, seguidosIds, contexto);
        double novedad = calcularNovedadYVariedad(receta, perfilGustos);

        double puntuacion = afinidad * PESO_AFINIDAD
                + despensa * PESO_DESPENSA
                + social * PESO_SOCIAL
                + novedad * PESO_NOVEDAD;

        if (esReaparicionDeDescarteAntiguo(contexto)) {
            puntuacion *= PENALIZACION_REAPARICION_DESCARTE;
        }

        return puntuacion;
    }

    public List<RecetaPuntuadaDTO> ordenarFeed(List<CandidatoRecetaDTO> candidatos, String usuarioId,
                                                Set<String> seguidosIds, PerfilGustos perfilGustos) {
        List<RecetaPuntuadaDTO> puntuados = candidatos.stream()
                .map(c -> new RecetaPuntuadaDTO(
                        c.receta(),
                        puntuarReceta(c.receta(), usuarioId, perfilGustos, seguidosIds, c.contexto()),
                        determinarMotivo(c.receta(), seguidosIds, c.contexto(), perfilGustos)))
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
