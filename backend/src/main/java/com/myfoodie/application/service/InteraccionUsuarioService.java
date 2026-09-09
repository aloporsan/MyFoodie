package com.myfoodie.application.service;

import com.myfoodie.domain.model.PerfilGustos;
import com.myfoodie.domain.model.Receta;
import com.myfoodie.domain.repository.PerfilGustosRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InteraccionUsuarioService {

    private static final Map<String, Integer> PUNTUACION_POR_SEÑAL = Map.of(
            "like", 1,
            "guardada", 2,
            "detalle_visto", 1,
            "ingredientes_carrito", 2,
            "receta_realizada", 3,
            "comentario", 2,
            "descartada", -2,
            "reportada", -3
    );

    private final PerfilGustosRepository perfilGustosRepository;
    private final RecetaRepository recetaRepository;

    @Async
    public void actualizarPerfilGustos(String usuarioId, String recetaId, String tipoInteraccion) {
        Integer delta = PUNTUACION_POR_SEÑAL.get(tipoInteraccion);
        if (delta == null) {
            return;
        }

        Receta receta = recetaRepository.findById(recetaId).orElse(null);
        if (receta == null) {
            return;
        }

        PerfilGustos perfil = obtenerOCrearPerfil(usuarioId);

        if (receta.getCategoria() != null && !receta.getCategoria().isBlank()) {
            ajustarPuntuacion(perfil.getCategoriasPreferidas(), receta.getCategoria(), delta);
        }

        if (receta.getEtiquetas() != null) {
            receta.getEtiquetas().forEach(etiqueta -> ajustarPuntuacion(perfil.getEtiquetasPreferidas(), etiqueta, delta));
        }

        if (receta.getDificultad() != null && !receta.getDificultad().isBlank()) {
            ajustarPuntuacion(perfil.getDificultadesPreferidas(), receta.getDificultad(), delta);
        }

        int totalPrevio = perfil.getTotalInteracciones() != null ? perfil.getTotalInteracciones() : 0;
        perfil.setTotalInteracciones(totalPrevio + 1);
        perfil.setUpdatedAt(new Date());
        perfilGustosRepository.save(perfil);
    }

    private PerfilGustos obtenerOCrearPerfil(String usuarioId) {
        return perfilGustosRepository.findByUsuarioId(usuarioId)
                .orElseGet(() -> PerfilGustos.builder()
                        .usuarioId(usuarioId)
                        .categoriasPreferidas(new HashMap<>())
                        .etiquetasPreferidas(new HashMap<>())
                        .dificultadesPreferidas(new HashMap<>())
                        .build());
    }

    private void ajustarPuntuacion(Map<String, Integer> puntuaciones, String clave, int delta) {
        int actual = puntuaciones.getOrDefault(clave, 0);
        int nueva = Math.max(0, actual + delta);
        puntuaciones.put(clave, nueva);
    }
}
