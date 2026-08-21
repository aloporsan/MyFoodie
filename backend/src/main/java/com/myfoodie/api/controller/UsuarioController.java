package com.myfoodie.api.controller;

import com.myfoodie.application.dto.notificacion.PushTokenRequestDTO;
import com.myfoodie.application.service.NotificacionService;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final NotificacionService notificacionService;
    private final UsuarioRepository usuarioRepository;

    @PostMapping("/push-token")
    public ResponseEntity<Void> registrarPushToken(Principal principal,
                                                     @RequestBody PushTokenRequestDTO dto) {
        notificacionService.registrarPushToken(getUsuarioId(principal), dto.token());
        return ResponseEntity.ok().build();
    }

    private String getUsuarioId(Principal principal) {
        return usuarioRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"))
                .getId();
    }
}
