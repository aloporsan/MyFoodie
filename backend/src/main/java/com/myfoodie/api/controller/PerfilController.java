package com.myfoodie.api.controller;

import com.myfoodie.application.dto.notificacion.PreferenciasNotificacionDTO;
import com.myfoodie.application.dto.perfil.EliminarCuentaDTO;
import com.myfoodie.application.dto.perfil.EstadisticasPerfilDTO;
import com.myfoodie.application.dto.perfil.PerfilResponseDTO;
import com.myfoodie.application.dto.perfil.PerfilUpdateDTO;
import com.myfoodie.application.dto.perfil.PreferenciasUpdateDTO;
import com.myfoodie.application.dto.perfil.PrivacidadUpdateDTO;
import com.myfoodie.application.service.PerfilService;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/perfil")
@RequiredArgsConstructor
public class PerfilController {

    private final PerfilService perfilService;
    private final UsuarioRepository usuarioRepository;

    @GetMapping
    public ResponseEntity<PerfilResponseDTO> obtenerPerfil(Principal principal) {
        return ResponseEntity.ok(perfilService.obtenerPerfil(getUsuarioId(principal)));
    }

    @PutMapping
    public ResponseEntity<PerfilResponseDTO> editarPerfil(Principal principal,
                                                           @Valid @RequestBody PerfilUpdateDTO dto) {
        return ResponseEntity.ok(perfilService.editarPerfil(getUsuarioId(principal), dto));
    }

    @GetMapping("/preferencias")
    public ResponseEntity<PreferenciasUpdateDTO> obtenerPreferencias(Principal principal) {
        return ResponseEntity.ok(perfilService.obtenerPreferencias(getUsuarioId(principal)));
    }

    @PutMapping("/preferencias")
    public ResponseEntity<PreferenciasUpdateDTO> actualizarPreferencias(Principal principal,
                                                                         @RequestBody PreferenciasUpdateDTO dto) {
        return ResponseEntity.ok(perfilService.actualizarPreferencias(getUsuarioId(principal), dto));
    }

    @GetMapping("/notificaciones")
    public ResponseEntity<PreferenciasNotificacionDTO> obtenerPreferenciasNotificacion(Principal principal) {
        return ResponseEntity.ok(perfilService.obtenerPreferenciasNotificacion(getUsuarioId(principal)));
    }

    @PutMapping("/notificaciones")
    public ResponseEntity<PreferenciasNotificacionDTO> actualizarPreferenciasNotificacion(
            Principal principal, @RequestBody PreferenciasNotificacionDTO dto) {
        return ResponseEntity.ok(perfilService.actualizarPreferenciasNotificacion(getUsuarioId(principal), dto));
    }

    @PutMapping("/privacidad")
    public ResponseEntity<Void> actualizarPrivacidad(Principal principal,
                                                      @RequestBody PrivacidadUpdateDTO dto) {
        perfilService.actualizarPrivacidad(getUsuarioId(principal), dto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/estadisticas")
    public ResponseEntity<EstadisticasPerfilDTO> obtenerEstadisticas(Principal principal) {
        return ResponseEntity.ok(perfilService.obtenerEstadisticasPerfil(getUsuarioId(principal)));
    }

    @PostMapping("/cerrar-sesion")
    public ResponseEntity<Void> cerrarSesion(Principal principal, HttpServletRequest request) {
        String token = extractToken(request);
        perfilService.cerrarSesion(getUsuarioId(principal), token);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> eliminarCuenta(Principal principal,
                                                @RequestBody EliminarCuentaDTO dto) {
        perfilService.eliminarCuenta(getUsuarioId(principal), dto);
        return ResponseEntity.noContent().build();
    }

    private String getUsuarioId(Principal principal) {
        return usuarioRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"))
                .getId();
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        return (header != null && header.startsWith("Bearer ")) ? header.substring(7) : null;
    }
}
