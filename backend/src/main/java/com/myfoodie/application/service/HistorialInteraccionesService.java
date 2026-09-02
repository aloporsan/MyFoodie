package com.myfoodie.application.service;

import com.myfoodie.application.dto.receta.RecetaFeedDTO;
import com.myfoodie.domain.model.Comentario;
import com.myfoodie.domain.model.InteraccionSocial;
import com.myfoodie.domain.model.Like;
import com.myfoodie.domain.model.Receta;
import com.myfoodie.domain.model.TipoInteraccion;
import com.myfoodie.domain.repository.ComentarioRepository;
import com.myfoodie.domain.repository.InteraccionSocialRepository;
import com.myfoodie.domain.repository.LikeRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Historial de interacciones del usuario con recetas (#79): guardadas, con like, comentadas y
 * vistas recientemente. Reutiliza la infraestructura del Bloque 4 ({@link InteraccionSocial},
 * comentarios) y los modelos de Fase 2 ({@code RecetaGuardada}, {@code Like}).
 */
@Service
@RequiredArgsConstructor
public class HistorialInteraccionesService {

    private static final int LIMITE_VISTAS_RECIENTES = 20;

    private final LikeRepository likeRepository;
    private final ComentarioRepository comentarioRepository;
    private final InteraccionSocialRepository interaccionSocialRepository;
    private final RecetaRepository recetaRepository;
    private final RecetaService recetaService;

    public List<RecetaFeedDTO> obtenerGuardadas(String usuarioId) {
        // recetasGuardadas ya devuelve RecetaFeedDTO ordenado por fecha de guardado desc.
        return recetaService.recetasGuardadas(usuarioId);
    }

    public List<RecetaFeedDTO> obtenerConLike(String usuarioId) {
        List<String> recetaIds = likeRepository.findByUsuarioIdOrderByCreatedAtDesc(usuarioId).stream()
                .map(Like::getRecetaId)
                .toList();
        return mapearRecetas(recetaIds, usuarioId);
    }

    public List<RecetaFeedDTO> obtenerComentadas(String usuarioId) {
        // Un usuario puede comentar varias veces la misma receta: deduplicamos por receta
        // conservando el orden (comentario más reciente primero).
        List<String> recetaIds = comentarioRepository.findByUsuarioIdAndEliminadoFalseOrderByCreatedAtDesc(usuarioId)
                .stream()
                .map(Comentario::getRecetaId)
                .distinct()
                .toList();
        return mapearRecetas(recetaIds, usuarioId);
    }

    public List<RecetaFeedDTO> obtenerVistasRecientemente(String usuarioId) {
        List<String> recetaIds = interaccionSocialRepository
                .findByUsuarioIdAndTipoOrderByCreatedAtDesc(usuarioId, TipoInteraccion.VER_RECETA)
                .stream()
                .map(InteraccionSocial::getEntidadId)
                .distinct()
                .limit(LIMITE_VISTAS_RECIENTES)
                .toList();
        return mapearRecetas(recetaIds, usuarioId);
    }

    /** Resuelve las recetas por id conservando el orden recibido y descartando las que ya no existen. */
    private List<RecetaFeedDTO> mapearRecetas(List<String> recetaIds, String usuarioId) {
        if (recetaIds.isEmpty()) {
            return List.of();
        }
        Map<String, Receta> recetasPorId = recetaRepository.findAllById(recetaIds).stream()
                .collect(Collectors.toMap(Receta::getId, Function.identity()));
        return recetaIds.stream()
                .map(recetasPorId::get)
                .filter(r -> r != null)
                .map(r -> recetaService.toFeedDTO(r, usuarioId))
                .toList();
    }
}
