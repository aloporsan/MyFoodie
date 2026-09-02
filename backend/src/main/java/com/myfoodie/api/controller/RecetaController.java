package com.myfoodie.api.controller;

import com.myfoodie.application.dto.receta.*;
import com.myfoodie.application.service.RecetaService;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recetas")
@RequiredArgsConstructor
public class RecetaController {

    private final RecetaService recetaService;
    private final UsuarioRepository usuarioRepository;

    @PostMapping
    public ResponseEntity<RecetaResponseDTO> crear(
            @Valid @RequestBody RecetaRequestDTO dto,
            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recetaService.crearReceta(getUsuarioId(principal), dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecetaResponseDTO> obtener(
            @PathVariable String id,
            Principal principal) {
        return ResponseEntity.ok(recetaService.obtenerReceta(id, getUsuarioId(principal)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecetaResponseDTO> editar(
            @PathVariable String id,
            @RequestBody RecetaRequestDTO dto,
            Principal principal) {
        return ResponseEntity.ok(recetaService.editarReceta(getUsuarioId(principal), id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable String id,
            Principal principal) {
        recetaService.eliminarReceta(getUsuarioId(principal), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/publicar")
    public ResponseEntity<RecetaResponseDTO> publicar(
            @PathVariable String id,
            Principal principal) {
        return ResponseEntity.ok(recetaService.publicarReceta(getUsuarioId(principal), id));
    }

    @PostMapping("/{id}/borrador")
    public ResponseEntity<RecetaResponseDTO> borrador(
            @PathVariable String id,
            Principal principal) {
        return ResponseEntity.ok(recetaService.guardarComoBorrador(getUsuarioId(principal), id));
    }

    @PostMapping("/{id}/ingredientes")
    public ResponseEntity<RecetaResponseDTO> añadirIngrediente(
            @PathVariable String id,
            @Valid @RequestBody IngredienteRequestDTO dto,
            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recetaService.añadirIngrediente(getUsuarioId(principal), id, dto));
    }

    @DeleteMapping("/{id}/ingredientes/{ingredienteId}")
    public ResponseEntity<Void> eliminarIngrediente(
            @PathVariable String id,
            @PathVariable String ingredienteId,
            Principal principal) {
        recetaService.eliminarIngrediente(getUsuarioId(principal), id, ingredienteId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/pasos")
    public ResponseEntity<RecetaResponseDTO> añadirPaso(
            @PathVariable String id,
            @Valid @RequestBody PasoRequestDTO dto,
            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recetaService.añadirPaso(getUsuarioId(principal), id, dto));
    }

    @PutMapping("/{id}/pasos/reordenar")
    public ResponseEntity<RecetaResponseDTO> reordenarPasos(
            @PathVariable String id,
            @RequestBody List<String> ordenIds,
            Principal principal) {
        return ResponseEntity.ok(recetaService.reordenarPasos(getUsuarioId(principal), id, ordenIds));
    }

    @DeleteMapping("/{id}/pasos/{pasoId}")
    public ResponseEntity<Void> eliminarPaso(
            @PathVariable String id,
            @PathVariable String pasoId,
            Principal principal) {
        recetaService.eliminarPaso(getUsuarioId(principal), id, pasoId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/etiquetas")
    public ResponseEntity<RecetaResponseDTO> actualizarEtiquetas(
            @PathVariable String id,
            @RequestBody List<String> etiquetas,
            Principal principal) {
        return ResponseEntity.ok(recetaService.actualizarEtiquetas(getUsuarioId(principal), id, etiquetas));
    }

    @PutMapping("/{id}/imagen")
    public ResponseEntity<RecetaResponseDTO> actualizarImagen(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            Principal principal) {
        return ResponseEntity.ok(recetaService.subirImagenReceta(getUsuarioId(principal), id, body.get("imagenUrl")));
    }

    @GetMapping("/mis-recetas")
    public ResponseEntity<List<RecetaFeedDTO>> misRecetas(Principal principal) {
        return ResponseEntity.ok(recetaService.misRecetas(getUsuarioId(principal)));
    }

    @GetMapping("/mis-borradores")
    public ResponseEntity<List<RecetaResumenDTO>> misBorradores(Principal principal) {
        return ResponseEntity.ok(recetaService.misBorradores(getUsuarioId(principal)));
    }

    @GetMapping("/guardadas")
    public ResponseEntity<List<RecetaFeedDTO>> guardadas(Principal principal) {
        return ResponseEntity.ok(recetaService.recetasGuardadas(getUsuarioId(principal)));
    }

    @PostMapping("/{id}/guardar")
    public ResponseEntity<Void> guardar(
            @PathVariable String id,
            Principal principal) {
        recetaService.guardarReceta(getUsuarioId(principal), id);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{id}/guardar")
    public ResponseEntity<Void> quitarGuardado(
            @PathVariable String id,
            Principal principal) {
        recetaService.quitarGuardado(getUsuarioId(principal), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/realizada")
    public ResponseEntity<List<IngredienteConsumoDTO>> marcarRealizada(
            @PathVariable String id,
            @Valid @RequestBody RacionesElaboradasDTO dto,
            Principal principal) {
        return ResponseEntity.ok(
                recetaService.marcarRecetaComoRealizada(getUsuarioId(principal), id, dto.racionesElaboradas()));
    }

    @PostMapping("/{id}/descontar-stock")
    public ResponseEntity<DescuentoRecetaResponseDTO> descontarStock(
            @PathVariable String id,
            @Valid @RequestBody RacionesElaboradasDTO dto,
            Principal principal) {
        return ResponseEntity.ok(
                recetaService.descontarIngredientesReceta(getUsuarioId(principal), id, dto.racionesElaboradas()));
    }

    private String getUsuarioId(Principal principal) {
        return usuarioRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"))
                .getId();
    }
}
