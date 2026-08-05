package com.myfoodie.api.controller;

import com.myfoodie.application.dto.notificacion.ContadorNotificacionesResponseDTO;
import com.myfoodie.application.service.NotificacionService;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {

    private final NotificacionService notificacionService;
    private final UsuarioRepository usuarioRepository;

    @GetMapping("/contador")
    public ResponseEntity<ContadorNotificacionesResponseDTO> contador(Principal principal) {
        return ResponseEntity.ok(
                new ContadorNotificacionesResponseDTO(
                        notificacionService.obtenerContadorNoLeidas(getUsuarioId(principal))));
    }

    private String getUsuarioId(Principal principal) {
        return usuarioRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"))
                .getId();
    }
}
