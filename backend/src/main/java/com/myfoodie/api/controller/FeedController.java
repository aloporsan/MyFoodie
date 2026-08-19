package com.myfoodie.api.controller;

import com.myfoodie.application.dto.feed.FeedResponseDTO;
import com.myfoodie.application.dto.feed.PerfilGustosResponseDTO;
import com.myfoodie.application.dto.receta.RecetaResponseDTO;
import com.myfoodie.application.service.FeedAccionService;
import com.myfoodie.application.service.FeedService;
import com.myfoodie.application.service.RecetaService;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/feed")
@RequiredArgsConstructor
public class FeedController {

    private final FeedService feedService;
    private final FeedAccionService feedAccionService;
    private final RecetaService recetaService;
    private final UsuarioRepository usuarioRepository;

    @GetMapping
    public ResponseEntity<FeedResponseDTO> obtenerFeed(
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(name = "tamaño", defaultValue = "10") int tamaño,
            Principal principal) {
        return ResponseEntity.ok(feedService.obtenerFeed(getUsuarioId(principal), pagina, tamaño));
    }

    @GetMapping("/recetas/{id}")
    public ResponseEntity<RecetaResponseDTO> obtenerDetalle(
            @PathVariable String id,
            Principal principal) {
        return ResponseEntity.ok(recetaService.obtenerReceta(id, getUsuarioId(principal)));
    }

    @PostMapping("/recetas/{id}/guardar")
    public ResponseEntity<Void> guardar(
            @PathVariable String id,
            Principal principal) {
        feedAccionService.guardarReceta(getUsuarioId(principal), id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/recetas/{id}/descartar")
    public ResponseEntity<Void> descartar(
            @PathVariable String id,
            Principal principal) {
        feedAccionService.descartarReceta(getUsuarioId(principal), id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/recetas/{id}/like")
    public ResponseEntity<Void> darLike(
            @PathVariable String id,
            Principal principal) {
        feedAccionService.darLike(getUsuarioId(principal), id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/recetas/{id}/like")
    public ResponseEntity<Void> quitarLike(
            @PathVariable String id,
            Principal principal) {
        feedAccionService.quitarLike(getUsuarioId(principal), id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/deshacer")
    public ResponseEntity<Void> deshacer(Principal principal) {
        feedAccionService.deshacerUltimaAccion(getUsuarioId(principal));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/descartadas")
    public ResponseEntity<Void> limpiarDescartadas(Principal principal) {
        feedAccionService.limpiarDescartadas(getUsuarioId(principal));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/perfil-gustos")
    public ResponseEntity<PerfilGustosResponseDTO> obtenerPerfilGustos(Principal principal) {
        return ResponseEntity.ok(feedService.obtenerPerfilGustos(getUsuarioId(principal)));
    }

    @DeleteMapping("/perfil-gustos")
    public ResponseEntity<Void> resetearPerfilGustos(Principal principal) {
        feedService.resetearPerfilGustos(getUsuarioId(principal));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/recetas-seguidos")
    public ResponseEntity<FeedResponseDTO> obtenerRecetasSeguidos(
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(name = "tamaño", defaultValue = "10") int tamaño,
            Principal principal) {
        return ResponseEntity.ok(feedService.obtenerRecetasSeguidos(getUsuarioId(principal), pagina, tamaño));
    }

    private String getUsuarioId(Principal principal) {
        return usuarioRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"))
                .getId();
    }
}
