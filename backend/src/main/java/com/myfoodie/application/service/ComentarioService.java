package com.myfoodie.application.service;

import com.myfoodie.application.dto.comentario.ComentarioResponseDTO;
import com.myfoodie.domain.model.Comentario;
import com.myfoodie.domain.model.TipoInteraccion;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.repository.ComentarioRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ComentarioService {

    private static final int MAX_LONGITUD_TEXTO = 500;

    private final ComentarioRepository comentarioRepository;
    private final RecetaRepository recetaRepository;
    private final UsuarioRepository usuarioRepository;
    private final InteraccionSocialService interaccionSocialService;

    public ComentarioResponseDTO crearComentario(String usuarioId, String recetaId, String texto) {
        if (texto == null || texto.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El comentario no puede estar vacío");
        }
        if (texto.length() > MAX_LONGITUD_TEXTO) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "El comentario no puede superar los " + MAX_LONGITUD_TEXTO + " caracteres");
        }
        if (!recetaRepository.existsById(recetaId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Receta no encontrada");
        }

        Comentario comentario = comentarioRepository.save(Comentario.builder()
                .recetaId(recetaId)
                .usuarioId(usuarioId)
                .texto(texto.trim())
                .build());

        interaccionSocialService.registrarInteraccion(usuarioId, TipoInteraccion.COMENTAR, "RECETA", recetaId);

        return toDTO(comentario, usuarioId);
    }

    public List<ComentarioResponseDTO> obtenerComentarios(String recetaId, String solicitanteId) {
        return comentarioRepository.findByRecetaIdAndEliminadoFalseOrderByCreatedAtDesc(recetaId).stream()
                .map(c -> toDTO(c, solicitanteId))
                .toList();
    }

    public void eliminarComentario(String usuarioId, String comentarioId) {
        Comentario comentario = comentarioRepository.findByIdAndUsuarioId(comentarioId, usuarioId)
                .filter(c -> !Boolean.TRUE.equals(c.getEliminado()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Comentario no encontrado"));

        comentario.setEliminado(true);
        comentario.setUpdatedAt(LocalDateTime.now());
        comentarioRepository.save(comentario);
    }

    private ComentarioResponseDTO toDTO(Comentario comentario, String solicitanteId) {
        Usuario autor = usuarioRepository.findById(comentario.getUsuarioId()).orElse(null);
        return new ComentarioResponseDTO(
                comentario.getId(),
                comentario.getUsuarioId(),
                autor != null ? autor.getNombreUsuario() : null,
                autor != null ? autor.getFotoPerfil() : null,
                comentario.getTexto(),
                comentario.getCreatedAt(),
                comentario.getUsuarioId().equals(solicitanteId)
        );
    }
}
