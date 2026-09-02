package com.myfoodie.application.service;

import com.myfoodie.application.dto.reporte.ReporteResponseDTO;
import com.myfoodie.domain.model.Comentario;
import com.myfoodie.domain.model.MotivoReporte;
import com.myfoodie.domain.model.Reporte;
import com.myfoodie.domain.model.TipoContenidoReporte;
import com.myfoodie.domain.model.TipoInteraccion;
import com.myfoodie.domain.repository.ComentarioRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import com.myfoodie.domain.repository.ReporteRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReporteService {

    /** Nº de reportes de distintos usuarios que retira el contenido automáticamente. */
    static final int UMBRAL_RETIRADA_AUTOMATICA = 5;

    private static final String TIPO_NOTIF_CONTENIDO_RETIRADO = "contenido_retirado";

    private final ReporteRepository reporteRepository;
    private final UsuarioRepository usuarioRepository;
    private final RecetaRepository recetaRepository;
    private final ComentarioRepository comentarioRepository;
    private final InteraccionSocialService interaccionSocialService;
    private final RecetaService recetaService;
    private final NotificacionService notificacionService;

    public ReporteResponseDTO crearReporte(String usuarioId, TipoContenidoReporte tipoContenido, String contenidoId,
                                           MotivoReporte motivo, String descripcionAdicional) {
        if (tipoContenido == null || contenidoId == null || contenidoId.isBlank() || motivo == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Datos de reporte incompletos");
        }

        validarContenidoExiste(tipoContenido, contenidoId);

        if (tipoContenido == TipoContenidoReporte.PERFIL && contenidoId.equals(usuarioId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No puedes reportarte a ti mismo");
        }

        if (reporteRepository.existsByUsuarioReportanteIdAndTipoContenidoAndContenidoId(
                usuarioId, tipoContenido, contenidoId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Ya has reportado este contenido");
        }

        Reporte reporte = reporteRepository.save(Reporte.builder()
                .usuarioReportanteId(usuarioId)
                .tipoContenido(tipoContenido)
                .contenidoId(contenidoId)
                .motivo(motivo)
                .descripcionAdicional(descripcionAdicional != null && !descripcionAdicional.isBlank()
                        ? descripcionAdicional.trim() : null)
                .build());

        interaccionSocialService.registrarInteraccion(
                usuarioId, TipoInteraccion.REPORTAR_CONTENIDO, entidadTipoDe(tipoContenido), contenidoId);

        aplicarRetiradaAutomatica(tipoContenido, contenidoId);

        return toDTO(reporte);
    }

    /**
     * Al alcanzar {@link #UMBRAL_RETIRADA_AUTOMATICA} reportes, retira el contenido y avisa a su autor.
     * Los perfiles nunca se tocan automáticamente. Es idempotente: si el contenido ya se retiró, no hace nada.
     */
    private void aplicarRetiradaAutomatica(TipoContenidoReporte tipoContenido, String contenidoId) {
        if (tipoContenido == TipoContenidoReporte.PERFIL) {
            return;
        }
        if (reporteRepository.countByTipoContenidoAndContenidoId(tipoContenido, contenidoId)
                < UMBRAL_RETIRADA_AUTOMATICA) {
            return;
        }

        switch (tipoContenido) {
            case RECETA -> recetaService.eliminarRecetaPorModeracion(contenidoId)
                    .ifPresent(autorId -> notificarRetirada(autorId, contenidoId, "RECETA"));
            case COMENTARIO -> comentarioRepository.findById(contenidoId)
                    .filter(c -> !Boolean.TRUE.equals(c.getEliminado()))
                    .ifPresent(this::retirarComentario);
            default -> { }
        }
    }

    private void retirarComentario(Comentario comentario) {
        comentario.setEliminado(true);
        comentario.setUpdatedAt(LocalDateTime.now());
        comentarioRepository.save(comentario);
        notificarRetirada(comentario.getUsuarioId(), comentario.getId(), "COMENTARIO");
    }

    private void notificarRetirada(String autorId, String contenidoId, String referenciaTipo) {
        notificacionService.crearNotificacion(
                autorId, TIPO_NOTIF_CONTENIDO_RETIRADO, null, contenidoId, referenciaTipo);
    }

    private void validarContenidoExiste(TipoContenidoReporte tipoContenido, String contenidoId) {
        boolean existe = switch (tipoContenido) {
            case PERFIL -> usuarioRepository.existsById(contenidoId);
            case RECETA -> recetaRepository.existsById(contenidoId);
            case COMENTARIO -> comentarioRepository.findById(contenidoId)
                    .filter(c -> !Boolean.TRUE.equals(c.getEliminado()))
                    .isPresent();
        };
        if (!existe) {
            throw new ApiException(HttpStatus.NOT_FOUND, "El contenido reportado no existe");
        }
    }

    private String entidadTipoDe(TipoContenidoReporte tipoContenido) {
        return tipoContenido == TipoContenidoReporte.PERFIL ? "USUARIO" : tipoContenido.name();
    }

    private ReporteResponseDTO toDTO(Reporte reporte) {
        return new ReporteResponseDTO(
                reporte.getId(),
                reporte.getTipoContenido(),
                reporte.getContenidoId(),
                reporte.getMotivo(),
                reporte.getDescripcionAdicional(),
                reporte.getEstado(),
                reporte.getCreatedAt()
        );
    }
}
