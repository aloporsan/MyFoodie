package com.myfoodie.application.service;

import com.myfoodie.application.dto.compartir.CompartirRecetaRequestDTO;
import com.myfoodie.application.dto.compartir.RecetaCompartidaResponseDTO;
import com.myfoodie.application.dto.receta.RecetaResponseDTO;
import com.myfoodie.domain.model.RecetaCompartida;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.repository.BloqueoRepository;
import com.myfoodie.domain.repository.RecetaCompartidaRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompartirService {

    private static final String ESTADO_PUBLICADA = "publicada";
    private static final int MAX_RECEPTORES = 10;
    private static final int MENSAJE_MAX_LENGTH = 200;

    private final RecetaCompartidaRepository recetaCompartidaRepository;
    private final BloqueoRepository bloqueoRepository;
    private final UsuarioRepository usuarioRepository;
    private final RecetaService recetaService;

    public List<RecetaCompartidaResponseDTO> compartirReceta(String emisorId, String recetaId,
                                                               CompartirRecetaRequestDTO dto) {
        if (dto.receptorIds() == null || dto.receptorIds().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Debes seleccionar al menos un receptor");
        }
        if (dto.receptorIds().size() > MAX_RECEPTORES) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "No puedes compartir con más de " + MAX_RECEPTORES + " usuarios a la vez");
        }
        if (dto.mensaje() != null && dto.mensaje().length() > MENSAJE_MAX_LENGTH) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "El mensaje no puede superar los " + MENSAJE_MAX_LENGTH + " caracteres");
        }

        RecetaResponseDTO receta = recetaService.obtenerReceta(recetaId, emisorId);
        if (!ESTADO_PUBLICADA.equals(receta.estado())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La receta no está publicada");
        }

        for (String receptorId : dto.receptorIds()) {
            if (receptorId.equals(emisorId)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "No puedes compartir una receta contigo mismo");
            }
            if (hayBloqueoEntre(emisorId, receptorId)) {
                throw new ApiException(HttpStatus.FORBIDDEN, "No puedes compartir con este usuario");
            }
        }

        List<RecetaCompartida> creadas = dto.receptorIds().stream()
                .map(receptorId -> recetaCompartidaRepository.save(RecetaCompartida.builder()
                        .emisorId(emisorId)
                        .receptorId(receptorId)
                        .recetaId(recetaId)
                        .mensaje(dto.mensaje())
                        .build()))
                .toList();

        Usuario emisor = obtenerUsuario(emisorId);
        return creadas.stream().map(rc -> toResponseDTO(rc, emisor, receta)).toList();
    }

    public List<RecetaCompartidaResponseDTO> obtenerRecetasRecibidas(String usuarioId) {
        return recetaCompartidaRepository.findByReceptorIdOrderByCreatedAtDesc(usuarioId).stream()
                .map(this::toResponseDTO)
                .toList();
    }

    public void marcarComoLeida(String usuarioId, String recetaCompartidaId) {
        RecetaCompartida compartida = getRecetaCompartidaDelReceptor(usuarioId, recetaCompartidaId);
        compartida.setLeida(true);
        recetaCompartidaRepository.save(compartida);
    }

    public long obtenerContadorNoLeidas(String usuarioId) {
        return recetaCompartidaRepository.countByReceptorIdAndLeidaFalse(usuarioId);
    }

    public void guardarRecetaCompartida(String usuarioId, String recetaCompartidaId) {
        RecetaCompartida compartida = getRecetaCompartidaDelReceptor(usuarioId, recetaCompartidaId);
        recetaService.guardarReceta(usuarioId, compartida.getRecetaId());
        compartida.setLeida(true);
        recetaCompartidaRepository.save(compartida);
    }

    // ---------- Helpers ----------

    private RecetaCompartida getRecetaCompartidaDelReceptor(String usuarioId, String recetaCompartidaId) {
        RecetaCompartida compartida = recetaCompartidaRepository.findById(recetaCompartidaId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Receta compartida no encontrada"));
        if (!compartida.getReceptorId().equals(usuarioId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "No tienes permiso sobre esta receta compartida");
        }
        return compartida;
    }

    private boolean hayBloqueoEntre(String usuarioAId, String usuarioBId) {
        return bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(usuarioAId, usuarioBId)
                || bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(usuarioBId, usuarioAId);
    }

    private Usuario obtenerUsuario(String usuarioId) {
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }

    private RecetaCompartidaResponseDTO toResponseDTO(RecetaCompartida rc) {
        Usuario emisor = obtenerUsuario(rc.getEmisorId());
        RecetaResponseDTO receta = recetaService.obtenerReceta(rc.getRecetaId(), rc.getReceptorId());
        return toResponseDTO(rc, emisor, receta);
    }

    private RecetaCompartidaResponseDTO toResponseDTO(RecetaCompartida rc, Usuario emisor, RecetaResponseDTO receta) {
        return new RecetaCompartidaResponseDTO(
                rc.getId(),
                new RecetaCompartidaResponseDTO.EmisorDTO(
                        emisor.getNombre(), emisor.getNombreUsuario(), emisor.getFotoPerfil()),
                receta,
                rc.getMensaje(),
                rc.getLeida(),
                rc.getCreatedAt()
        );
    }
}
