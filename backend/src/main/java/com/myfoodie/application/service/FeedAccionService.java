package com.myfoodie.application.service;

import com.myfoodie.domain.model.AccionFeed;
import com.myfoodie.domain.model.Like;
import com.myfoodie.domain.model.RecetaDescartada;
import com.myfoodie.domain.model.RecetaGuardada;
import com.myfoodie.domain.repository.AccionFeedRepository;
import com.myfoodie.domain.repository.LikeRepository;
import com.myfoodie.domain.repository.RecetaDescartadaRepository;
import com.myfoodie.domain.repository.RecetaGuardadaRepository;
import com.myfoodie.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FeedAccionService {

    private static final String TIPO_GUARDADA = "guardada";
    private static final String TIPO_DESCARTADA = "descartada";
    private static final String TIPO_LIKE = "like";
    private static final String TIPO_LIKE_QUITADO = "like_quitado";

    private final RecetaGuardadaRepository recetaGuardadaRepository;
    private final RecetaDescartadaRepository recetaDescartadaRepository;
    private final LikeRepository likeRepository;
    private final AccionFeedRepository accionFeedRepository;
    private final InteraccionUsuarioService interaccionUsuarioService;

    public void guardarReceta(String usuarioId, String recetaId) {
        if (!recetaGuardadaRepository.existsByUsuarioIdAndRecetaId(usuarioId, recetaId)) {
            recetaGuardadaRepository.save(RecetaGuardada.builder()
                    .usuarioId(usuarioId)
                    .recetaId(recetaId)
                    .build());
            registrarAccion(usuarioId, TIPO_GUARDADA, recetaId);
            interaccionUsuarioService.actualizarPerfilGustos(usuarioId, recetaId, TIPO_GUARDADA);
        }
    }

    public void descartarReceta(String usuarioId, String recetaId) {
        if (recetaDescartadaRepository.existsByUsuarioIdAndRecetaId(usuarioId, recetaId)) {
            throw new ApiException(HttpStatus.CONFLICT, "La receta ya ha sido descartada");
        }
        recetaDescartadaRepository.save(RecetaDescartada.builder()
                .usuarioId(usuarioId)
                .recetaId(recetaId)
                .build());
        registrarAccion(usuarioId, TIPO_DESCARTADA, recetaId);
        interaccionUsuarioService.actualizarPerfilGustos(usuarioId, recetaId, TIPO_DESCARTADA);
    }

    public void darLike(String usuarioId, String recetaId) {
        if (likeRepository.existsByUsuarioIdAndRecetaId(usuarioId, recetaId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Ya has dado like a esta receta");
        }
        likeRepository.save(Like.builder()
                .usuarioId(usuarioId)
                .recetaId(recetaId)
                .build());
        registrarAccion(usuarioId, TIPO_LIKE, recetaId);
        interaccionUsuarioService.actualizarPerfilGustos(usuarioId, recetaId, TIPO_LIKE);
    }

    public void quitarLike(String usuarioId, String recetaId) {
        likeRepository.findByUsuarioIdAndRecetaId(usuarioId, recetaId)
                .ifPresent(like -> {
                    likeRepository.delete(like);
                    registrarAccion(usuarioId, TIPO_LIKE_QUITADO, recetaId);
                });
    }

    public void deshacerUltimaAccion(String usuarioId) {
        AccionFeed ultimaAccion = accionFeedRepository.findFirstByUsuarioIdOrderByCreatedAtDesc(usuarioId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No hay acciones para deshacer"));

        switch (ultimaAccion.getTipo()) {
            case TIPO_GUARDADA -> recetaGuardadaRepository
                    .findByUsuarioIdAndRecetaId(usuarioId, ultimaAccion.getRecetaId())
                    .ifPresent(recetaGuardadaRepository::delete);
            case TIPO_DESCARTADA -> recetaDescartadaRepository
                    .findByUsuarioIdAndRecetaId(usuarioId, ultimaAccion.getRecetaId())
                    .ifPresent(recetaDescartadaRepository::delete);
            case TIPO_LIKE -> likeRepository
                    .findByUsuarioIdAndRecetaId(usuarioId, ultimaAccion.getRecetaId())
                    .ifPresent(likeRepository::delete);
            case TIPO_LIKE_QUITADO -> {
                if (!likeRepository.existsByUsuarioIdAndRecetaId(usuarioId, ultimaAccion.getRecetaId())) {
                    likeRepository.save(Like.builder()
                            .usuarioId(usuarioId)
                            .recetaId(ultimaAccion.getRecetaId())
                            .build());
                }
            }
            default -> throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Tipo de acción desconocido: " + ultimaAccion.getTipo());
        }

        accionFeedRepository.delete(ultimaAccion);
    }

    public void limpiarDescartadas(String usuarioId) {
        recetaDescartadaRepository.deleteByUsuarioId(usuarioId);
    }

    private void registrarAccion(String usuarioId, String tipo, String recetaId) {
        accionFeedRepository.save(AccionFeed.builder()
                .usuarioId(usuarioId)
                .tipo(tipo)
                .recetaId(recetaId)
                .build());
    }
}
