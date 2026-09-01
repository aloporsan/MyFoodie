package com.myfoodie.application.service;

import com.myfoodie.application.dto.social.PerfilPublicoResponseDTO;
import com.myfoodie.application.dto.social.SeguimientoResponseDTO;
import com.myfoodie.application.dto.social.UsuarioBusquedaResponseDTO;
import com.myfoodie.domain.model.Bloqueo;
import com.myfoodie.domain.model.Privacidad;
import com.myfoodie.domain.model.Seguimiento;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.repository.BloqueoRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import com.myfoodie.domain.repository.SeguimientoRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SocialService {

    private static final String ESTADO_ACEPTADO = "aceptado";
    private static final String ESTADO_PENDIENTE = "pendiente";
    private static final String ESTADO_PUBLICADA = "publicada";
    private static final String TIPO_NUEVO_SEGUIDOR = "nuevo_seguidor";
    private static final String TIPO_SOLICITUD_SEGUIMIENTO = "solicitud_seguimiento";
    private static final String TIPO_SOLICITUD_ACEPTADA = "solicitud_aceptada";
    private static final String REFERENCIA_SEGUIMIENTO = "seguimiento";

    private final SeguimientoRepository seguimientoRepository;
    private final BloqueoRepository bloqueoRepository;
    private final UsuarioRepository usuarioRepository;
    private final RecetaRepository recetaRepository;
    private final NotificacionService notificacionService;

    // ---------- Seguimientos ----------

    public SeguimientoResponseDTO seguirUsuario(String seguidorId, String seguidoId) {
        if (seguidorId.equals(seguidoId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No puedes seguirte a ti mismo");
        }

        Usuario seguido = usuarioRepository.findById(seguidoId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        if (hayBloqueoEntre(seguidorId, seguidoId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "No puedes seguir a este usuario");
        }

        if (seguimientoRepository.findBySeguidorIdAndSeguidoId(seguidorId, seguidoId).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Ya sigues a este usuario");
        }

        String estado = seguido.getPrivacidad() == Privacidad.PUBLICA ? ESTADO_ACEPTADO : ESTADO_PENDIENTE;

        Seguimiento seguimiento = seguimientoRepository.save(Seguimiento.builder()
                .seguidorId(seguidorId)
                .seguidoId(seguidoId)
                .estado(estado)
                .build());

        if (ESTADO_ACEPTADO.equals(estado)) {
            notificacionService.crearNotificacion(seguidoId, TIPO_NUEVO_SEGUIDOR, seguidorId,
                    seguimiento.getId(), REFERENCIA_SEGUIMIENTO);
        } else {
            notificacionService.crearNotificacion(seguidoId, TIPO_SOLICITUD_SEGUIMIENTO, seguidorId,
                    seguimiento.getId(), REFERENCIA_SEGUIMIENTO);
        }

        return toSeguimientoResponse(seguimiento, seguido);
    }

    public void dejarDeSeguir(String seguidorId, String seguidoId) {
        Seguimiento seguimiento = seguimientoRepository.findBySeguidorIdAndSeguidoId(seguidorId, seguidoId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No sigues a este usuario"));
        seguimientoRepository.delete(seguimiento);
    }

    public SeguimientoResponseDTO aceptarSolicitud(String usuarioId, String seguidorId) {
        Seguimiento seguimiento = seguimientoRepository.findBySeguidorIdAndSeguidoId(seguidorId, usuarioId)
                .filter(s -> ESTADO_PENDIENTE.equals(s.getEstado()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No hay solicitud pendiente de este usuario"));

        seguimiento.setEstado(ESTADO_ACEPTADO);
        seguimiento = seguimientoRepository.save(seguimiento);

        Usuario seguidor = usuarioRepository.findById(seguidorId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        notificacionService.crearNotificacion(seguidorId, TIPO_SOLICITUD_ACEPTADA, usuarioId,
                seguimiento.getId(), REFERENCIA_SEGUIMIENTO);

        return toSeguimientoResponse(seguimiento, seguidor);
    }

    public void rechazarSolicitud(String usuarioId, String seguidorId) {
        Seguimiento seguimiento = seguimientoRepository.findBySeguidorIdAndSeguidoId(seguidorId, usuarioId)
                .filter(s -> ESTADO_PENDIENTE.equals(s.getEstado()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No hay solicitud pendiente de este usuario"));

        seguimientoRepository.delete(seguimiento);
    }

    public List<SeguimientoResponseDTO> obtenerSeguidores(String usuarioId) {
        return seguimientoRepository.findBySeguidoIdAndEstado(usuarioId, ESTADO_ACEPTADO).stream()
                .map(s -> toSeguimientoResponse(s, obtenerUsuario(s.getSeguidorId())))
                .toList();
    }

    public List<SeguimientoResponseDTO> obtenerSeguidos(String usuarioId) {
        return seguimientoRepository.findBySeguidorIdAndEstado(usuarioId, ESTADO_ACEPTADO).stream()
                .map(s -> toSeguimientoResponse(s, obtenerUsuario(s.getSeguidoId())))
                .toList();
    }

    public List<SeguimientoResponseDTO> obtenerSolicitudesPendientes(String usuarioId) {
        return seguimientoRepository.findBySeguidoIdAndEstado(usuarioId, ESTADO_PENDIENTE).stream()
                .map(s -> toSeguimientoResponse(s, obtenerUsuario(s.getSeguidorId())))
                .toList();
    }

    // ---------- Perfiles ----------

    public PerfilPublicoResponseDTO obtenerPerfilPublico(String usuarioId, String visitanteId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        boolean visitanteBloqueadoPorDueno = bloqueoRepository
                .existsByBloqueadorIdAndBloqueadoId(usuarioId, visitanteId);
        if (visitanteBloqueadoPorDueno) {
            throw new ApiException(HttpStatus.FORBIDDEN, "No puedes ver este perfil");
        }

        boolean estaBloqueado = bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(visitanteId, usuarioId);

        boolean esSeguido = seguimientoRepository.findBySeguidorIdAndSeguidoId(visitanteId, usuarioId)
                .filter(s -> ESTADO_ACEPTADO.equals(s.getEstado()))
                .isPresent();
        boolean haSolicitado = seguimientoRepository.findBySeguidorIdAndSeguidoId(visitanteId, usuarioId)
                .filter(s -> ESTADO_PENDIENTE.equals(s.getEstado()))
                .isPresent();

        int numSeguidores = (int) seguimientoRepository.countBySeguidoIdAndEstado(usuarioId, ESTADO_ACEPTADO);
        int numSeguidos = (int) seguimientoRepository.countBySeguidorIdAndEstado(usuarioId, ESTADO_ACEPTADO);
        int numRecetas = (int) recetaRepository.countByAutorIdAndEstado(usuarioId, ESTADO_PUBLICADA);

        return new PerfilPublicoResponseDTO(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getNombreUsuario(),
                usuario.getFotoPerfil(),
                usuario.getBiografia(),
                numSeguidores,
                numSeguidos,
                numRecetas,
                esSeguido,
                haSolicitado,
                estaBloqueado,
                usuario.getPrivacidad()
        );
    }

    public void verificarAccesoListado(String usuarioId, String visitanteId) {
        if (usuarioId.equals(visitanteId)) {
            return;
        }
        Usuario usuario = obtenerUsuario(usuarioId);
        if (usuario.getPrivacidad() == Privacidad.PUBLICA) {
            return;
        }
        boolean esSeguidorAceptado = seguimientoRepository.findBySeguidorIdAndSeguidoId(visitanteId, usuarioId)
                .filter(s -> ESTADO_ACEPTADO.equals(s.getEstado()))
                .isPresent();
        if (!esSeguidorAceptado) {
            throw new ApiException(HttpStatus.FORBIDDEN, "No tienes permiso para ver esta información");
        }
    }

    public List<UsuarioBusquedaResponseDTO> buscarUsuarios(String texto, String usuarioId) {
        return buscarUsuarios(texto, usuarioId, false);
    }

    public List<UsuarioBusquedaResponseDTO> buscarUsuarios(String texto, String usuarioId, boolean soloCompartibles) {
        return usuarioRepository
                .findByNombreContainingIgnoreCaseOrNombreUsuarioContainingIgnoreCase(texto, texto).stream()
                .filter(u -> !u.getId().equals(usuarioId))
                .filter(u -> !hayBloqueoEntre(usuarioId, u.getId()))
                .filter(u -> !soloCompartibles || puedeCompartirseCon(u, usuarioId))
                .map(u -> toUsuarioBusquedaResponse(u, usuarioId))
                .toList();
    }

    // ---------- Bloqueos ----------

    public void bloquearUsuario(String bloqueadorId, String bloqueadoId) {
        if (bloqueadorId.equals(bloqueadoId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No puedes bloquearte a ti mismo");
        }

        if (!usuarioRepository.existsById(bloqueadoId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
        }

        if (bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(bloqueadorId, bloqueadoId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Ya has bloqueado a este usuario");
        }

        bloqueoRepository.save(Bloqueo.builder()
                .bloqueadorId(bloqueadorId)
                .bloqueadoId(bloqueadoId)
                .build());

        seguimientoRepository.findBySeguidorIdAndSeguidoId(bloqueadorId, bloqueadoId)
                .ifPresent(seguimientoRepository::delete);
        seguimientoRepository.findBySeguidorIdAndSeguidoId(bloqueadoId, bloqueadorId)
                .ifPresent(seguimientoRepository::delete);
    }

    public void desbloquearUsuario(String bloqueadorId, String bloqueadoId) {
        Bloqueo bloqueo = bloqueoRepository.findByBloqueadorIdAndBloqueadoId(bloqueadorId, bloqueadoId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No has bloqueado a este usuario"));
        bloqueoRepository.delete(bloqueo);
    }

    public List<UsuarioBusquedaResponseDTO> obtenerBloqueados(String bloqueadorId) {
        return bloqueoRepository.findByBloqueadorId(bloqueadorId).stream()
                .map(b -> toUsuarioBusquedaResponse(obtenerUsuario(b.getBloqueadoId()), bloqueadorId))
                .toList();
    }

    /** Comprueba si existe un bloqueo entre dos usuarios en cualquiera de las dos direcciones. */
    public boolean estaBloqueado(String usuarioAId, String usuarioBId) {
        return hayBloqueoEntre(usuarioAId, usuarioBId);
    }

    /** IDs de usuarios que deben quedar ocultos para {@code usuarioId}: los que ha bloqueado y los que le han bloqueado. */
    public Set<String> obtenerIdsOcultosPara(String usuarioId) {
        Set<String> ocultos = new HashSet<>();
        bloqueoRepository.findByBloqueadorId(usuarioId).forEach(b -> ocultos.add(b.getBloqueadoId()));
        bloqueoRepository.findByBloqueadoId(usuarioId).forEach(b -> ocultos.add(b.getBloqueadorId()));
        return ocultos;
    }

    public boolean esSeguidorAceptado(String seguidorId, String seguidoId) {
        return seguimientoRepository.findBySeguidorIdAndSeguidoId(seguidorId, seguidoId)
                .filter(s -> ESTADO_ACEPTADO.equals(s.getEstado()))
                .isPresent();
    }

    // ---------- Helpers ----------

    private boolean puedeCompartirseCon(Usuario receptor, String visitanteId) {
        if (receptor.getPrivacidad() != Privacidad.PRIVADA) {
            return true;
        }
        return seguimientoRepository.findBySeguidorIdAndSeguidoId(visitanteId, receptor.getId())
                .filter(s -> ESTADO_ACEPTADO.equals(s.getEstado()))
                .isPresent();
    }

    private boolean hayBloqueoEntre(String usuarioAId, String usuarioBId) {
        return bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(usuarioAId, usuarioBId)
                || bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(usuarioBId, usuarioAId);
    }

    private Usuario obtenerUsuario(String usuarioId) {
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }

    private UsuarioBusquedaResponseDTO toUsuarioBusquedaResponse(Usuario usuario, String visitanteId) {
        boolean esSeguido = seguimientoRepository.findBySeguidorIdAndSeguidoId(visitanteId, usuario.getId())
                .filter(s -> ESTADO_ACEPTADO.equals(s.getEstado()))
                .isPresent();
        boolean haSolicitado = seguimientoRepository.findBySeguidorIdAndSeguidoId(visitanteId, usuario.getId())
                .filter(s -> ESTADO_PENDIENTE.equals(s.getEstado()))
                .isPresent();
        int numRecetas = (int) recetaRepository.countByAutorIdAndEstado(usuario.getId(), ESTADO_PUBLICADA);

        return new UsuarioBusquedaResponseDTO(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getNombreUsuario(),
                usuario.getFotoPerfil(),
                numRecetas,
                esSeguido,
                haSolicitado
        );
    }

    private SeguimientoResponseDTO toSeguimientoResponse(Seguimiento seguimiento, Usuario otroUsuario) {
        return new SeguimientoResponseDTO(
                seguimiento.getId(),
                otroUsuario.getId(),
                otroUsuario.getNombre(),
                otroUsuario.getNombreUsuario(),
                otroUsuario.getFotoPerfil(),
                seguimiento.getEstado(),
                seguimiento.getCreatedAt()
        );
    }
}
