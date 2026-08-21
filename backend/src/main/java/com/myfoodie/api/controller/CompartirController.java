package com.myfoodie.api.controller;

import com.myfoodie.application.dto.compartir.CompartirRecetaRequestDTO;
import com.myfoodie.application.dto.compartir.ContadorNoLeidasResponseDTO;
import com.myfoodie.application.dto.compartir.IngredienteFaltanteResponseDTO;
import com.myfoodie.application.dto.compartir.RecetaCompartidaResponseDTO;
import com.myfoodie.application.service.CompartirService;
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
@RequestMapping("/api/compartir")
@RequiredArgsConstructor
public class CompartirController {

    private final CompartirService compartirService;
    private final UsuarioRepository usuarioRepository;

    @PostMapping("/recetas/{recetaId}")
    public ResponseEntity<List<RecetaCompartidaResponseDTO>> compartir(
            @PathVariable String recetaId,
            @Valid @RequestBody CompartirRecetaRequestDTO dto,
            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(compartirService.compartirReceta(getUsuarioId(principal), recetaId, dto));
    }

    @GetMapping("/recibidas")
    public ResponseEntity<List<RecetaCompartidaResponseDTO>> recibidas(Principal principal) {
        return ResponseEntity.ok(compartirService.obtenerRecetasRecibidas(getUsuarioId(principal)));
    }

    @PutMapping("/recibidas/{id}/leer")
    public ResponseEntity<Void> marcarComoLeida(@PathVariable String id, Principal principal) {
        compartirService.marcarComoLeida(getUsuarioId(principal), id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/recibidas/{id}/guardar")
    public ResponseEntity<Void> guardar(@PathVariable String id, Principal principal) {
        compartirService.guardarRecetaCompartida(getUsuarioId(principal), id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/recibidas/contador")
    public ResponseEntity<ContadorNoLeidasResponseDTO> contador(Principal principal) {
        return ResponseEntity.ok(
                new ContadorNoLeidasResponseDTO(compartirService.obtenerContadorNoLeidas(getUsuarioId(principal))));
    }

    @GetMapping("/recibidas/{id}/ingredientes")
    public ResponseEntity<List<IngredienteFaltanteResponseDTO>> ingredientesFaltantes(
            @PathVariable String id,
            Principal principal) {
        return ResponseEntity.ok(compartirService.obtenerIngredientesFaltantes(getUsuarioId(principal), id));
    }

    private String getUsuarioId(Principal principal) {
        return usuarioRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"))
                .getId();
    }
}
