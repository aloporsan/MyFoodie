package com.myfoodie.api.controller;

import com.myfoodie.application.dto.social.PerfilPublicoResponseDTO;
import com.myfoodie.application.dto.social.SeguimientoResponseDTO;
import com.myfoodie.application.dto.social.UsuarioBusquedaResponseDTO;
import com.myfoodie.application.service.SocialService;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class SocialController {

    private final SocialService socialService;
    private final UsuarioRepository usuarioRepository;

    @PostMapping("/seguir/{usuarioId}")
    public ResponseEntity<SeguimientoResponseDTO> seguir(@PathVariable String usuarioId, Principal principal) {
        return ResponseEntity.ok(socialService.seguirUsuario(getUsuarioId(principal), usuarioId));
    }

    @DeleteMapping("/seguir/{usuarioId}")
    public ResponseEntity<Void> dejarDeSeguir(@PathVariable String usuarioId, Principal principal) {
        socialService.dejarDeSeguir(getUsuarioId(principal), usuarioId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/solicitudes/{seguidorId}/aceptar")
    public ResponseEntity<SeguimientoResponseDTO> aceptarSolicitud(@PathVariable String seguidorId, Principal principal) {
        return ResponseEntity.ok(socialService.aceptarSolicitud(getUsuarioId(principal), seguidorId));
    }

    @PostMapping("/solicitudes/{seguidorId}/rechazar")
    public ResponseEntity<Void> rechazarSolicitud(@PathVariable String seguidorId, Principal principal) {
        socialService.rechazarSolicitud(getUsuarioId(principal), seguidorId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/seguidores")
    public ResponseEntity<List<SeguimientoResponseDTO>> misSeguidores(Principal principal) {
        return ResponseEntity.ok(socialService.obtenerSeguidores(getUsuarioId(principal)));
    }

    @GetMapping("/seguidores/{usuarioId}")
    public ResponseEntity<List<SeguimientoResponseDTO>> seguidoresDe(@PathVariable String usuarioId, Principal principal) {
        socialService.verificarAccesoListado(usuarioId, getUsuarioId(principal));
        return ResponseEntity.ok(socialService.obtenerSeguidores(usuarioId));
    }

    @GetMapping("/seguidos")
    public ResponseEntity<List<SeguimientoResponseDTO>> misSeguidos(Principal principal) {
        return ResponseEntity.ok(socialService.obtenerSeguidos(getUsuarioId(principal)));
    }

    @GetMapping("/seguidos/{usuarioId}")
    public ResponseEntity<List<SeguimientoResponseDTO>> seguidosDe(@PathVariable String usuarioId, Principal principal) {
        socialService.verificarAccesoListado(usuarioId, getUsuarioId(principal));
        return ResponseEntity.ok(socialService.obtenerSeguidos(usuarioId));
    }

    @GetMapping("/solicitudes")
    public ResponseEntity<List<SeguimientoResponseDTO>> misSolicitudes(Principal principal) {
        return ResponseEntity.ok(socialService.obtenerSolicitudesPendientes(getUsuarioId(principal)));
    }

    @GetMapping("/perfil/{usuarioId}")
    public ResponseEntity<PerfilPublicoResponseDTO> perfilPublico(@PathVariable String usuarioId, Principal principal) {
        return ResponseEntity.ok(socialService.obtenerPerfilPublico(usuarioId, getUsuarioId(principal)));
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<UsuarioBusquedaResponseDTO>> buscar(@RequestParam String q, Principal principal) {
        return ResponseEntity.ok(socialService.buscarUsuarios(q, getUsuarioId(principal)));
    }

    @PostMapping("/bloquear/{usuarioId}")
    public ResponseEntity<Void> bloquear(@PathVariable String usuarioId, Principal principal) {
        socialService.bloquearUsuario(getUsuarioId(principal), usuarioId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/bloquear/{usuarioId}")
    public ResponseEntity<Void> desbloquear(@PathVariable String usuarioId, Principal principal) {
        socialService.desbloquearUsuario(getUsuarioId(principal), usuarioId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/bloqueados")
    public ResponseEntity<List<UsuarioBusquedaResponseDTO>> bloqueados(Principal principal) {
        return ResponseEntity.ok(socialService.obtenerBloqueados(getUsuarioId(principal)));
    }

    private String getUsuarioId(Principal principal) {
        return usuarioRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"))
                .getId();
    }
}
