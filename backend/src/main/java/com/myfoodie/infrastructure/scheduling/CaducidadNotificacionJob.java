package com.myfoodie.infrastructure.scheduling;

import com.myfoodie.application.service.NotificacionService;
import com.myfoodie.domain.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CaducidadNotificacionJob {

    private final UsuarioRepository usuarioRepository;
    private final NotificacionService notificacionService;

    @Scheduled(cron = "0 0 9 * * *")
    public void generarNotificacionesCaducidadDiarias() {
        usuarioRepository.findAll()
                .forEach(usuario -> notificacionService.generarNotificacionesCaducidad(usuario.getId()));
    }
}
