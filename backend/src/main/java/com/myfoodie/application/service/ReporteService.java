package com.myfoodie.application.service;

import com.myfoodie.application.dto.reporte.ReporteResponseDTO;
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

@Service
@RequiredArgsConstructor
public class ReporteService {

    private final ReporteRepository reporteRepository;
    private final UsuarioRepository usuarioRepository;
    private final RecetaRepository recetaRepository;
    private final ComentarioRepository comentarioRepository;
    private final InteraccionSocialService interaccionSocialService;

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

        return toDTO(reporte);
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
