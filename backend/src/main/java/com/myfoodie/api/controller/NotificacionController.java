package com.myfoodie.api.controller;

import com.myfoodie.application.dto.notificacion.ContadorNotificacionesResponseDTO;
import com.myfoodie.application.dto.notificacion.NotificacionResponseDTO;
import com.myfoodie.application.service.NotificacionService;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {

    private static final int TAMAÑO_PAGINA_POR_DEFECTO = 20;

    private final NotificacionService notificacionService;
    private final UsuarioRepository usuarioRepository;

    @GetMapping
    public ResponseEntity<List<NotificacionResponseDTO>> listar(
            Principal principal,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(name = "tamaño", defaultValue = "" + TAMAÑO_PAGINA_POR_DEFECTO) int tamaño) {
        return ResponseEntity.ok(
                notificacionService.obtenerNotificaciones(getUsuarioId(principal), pagina, tamaño));
    }

    @GetMapping("/contador")
    public ResponseEntity<ContadorNotificacionesResponseDTO> contador(Principal principal) {
        return ResponseEntity.ok(
                new ContadorNotificacionesResponseDTO(
                        notificacionService.obtenerContadorNoLeidas(getUsuarioId(principal))));
    }

    @PutMapping("/{id}/leer")
    public ResponseEntity<Void> marcarComoLeida(Principal principal, @PathVariable String id) {
        notificacionService.marcarComoLeida(getUsuarioId(principal), id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/leer-todas")
    public ResponseEntity<Void> marcarTodasComoLeidas(Principal principal) {
        notificacionService.marcarTodasComoLeidas(getUsuarioId(principal));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(Principal principal, @PathVariable String id) {
        notificacionService.eliminarNotificacion(getUsuarioId(principal), id);
        return ResponseEntity.noContent().build();
    }

    private String getUsuarioId(Principal principal) {
        return usuarioRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"))
                .getId();
    }
}
