package com.myfoodie.api.controller;

import com.myfoodie.application.dto.comentario.ComentarioRequestDTO;
import com.myfoodie.application.dto.comentario.ComentarioResponseDTO;
import com.myfoodie.application.service.ComentarioService;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/recetas/{recetaId}/comentarios")
@RequiredArgsConstructor
public class ComentarioController {

    private final ComentarioService comentarioService;
    private final UsuarioRepository usuarioRepository;

    @GetMapping
    public ResponseEntity<List<ComentarioResponseDTO>> listar(
            @PathVariable String recetaId,
            Principal principal) {
        return ResponseEntity.ok(comentarioService.obtenerComentarios(recetaId, getUsuarioId(principal)));
    }

    @PostMapping
    public ResponseEntity<ComentarioResponseDTO> crear(
            @PathVariable String recetaId,
            @Valid @RequestBody ComentarioRequestDTO dto,
            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(comentarioService.crearComentario(getUsuarioId(principal), recetaId, dto.texto()));
    }

    @DeleteMapping("/{comentarioId}")
    public ResponseEntity<Void> eliminar(
            @PathVariable String recetaId,
            @PathVariable String comentarioId,
            Principal principal) {
        comentarioService.eliminarComentario(getUsuarioId(principal), comentarioId);
        return ResponseEntity.noContent().build();
    }

    private String getUsuarioId(Principal principal) {
        return usuarioRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"))
                .getId();
    }
}
