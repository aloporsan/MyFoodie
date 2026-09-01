package com.myfoodie.application.service;

import com.myfoodie.domain.model.InteraccionSocial;
import com.myfoodie.domain.model.TipoInteraccion;
import com.myfoodie.domain.repository.InteraccionSocialRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Registra las interacciones sociales relevantes (seguir, like, guardar, comentar, compartir,
 * descartar, bloquear, reportar) para auditoría interna y futuras recomendaciones (#101).
 *
 * <p>Pensado para llamarse como hook desde otros servicios: es asíncrono y nunca propaga errores,
 * de modo que un fallo al registrar no interrumpe el flujo principal.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class InteraccionSocialService {

    private final InteraccionSocialRepository interaccionSocialRepository;

    @Async
    public void registrarInteraccion(String usuarioId, TipoInteraccion tipo, String entidadTipo, String entidadId) {
        try {
            interaccionSocialRepository.save(InteraccionSocial.builder()
                    .usuarioId(usuarioId)
                    .tipo(tipo)
                    .entidadTipo(entidadTipo)
                    .entidadId(entidadId)
                    .build());
        } catch (RuntimeException e) {
            log.warn("No se pudo registrar la interacción social {} de {} sobre {}:{}",
                    tipo, usuarioId, entidadTipo, entidadId, e);
        }
    }
}
