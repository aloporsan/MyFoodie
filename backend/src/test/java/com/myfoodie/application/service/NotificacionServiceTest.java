package com.myfoodie.application.service;

import com.myfoodie.domain.repository.NotificacionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificacionServiceTest {

    @Mock private NotificacionRepository notificacionRepository;

    @InjectMocks
    private NotificacionService notificacionService;

    @Test
    void obtenerContadorNoLeidas_devuelve_el_conteo_del_repositorio() {
        when(notificacionRepository.countByUsuarioIdAndLeidaFalse("usuario-1")).thenReturn(4L);

        long resultado = notificacionService.obtenerContadorNoLeidas("usuario-1");

        assertThat(resultado).isEqualTo(4L);
    }

    @Test
    void obtenerContadorNoLeidas_devuelve_cero_si_no_hay_notificaciones() {
        when(notificacionRepository.countByUsuarioIdAndLeidaFalse("usuario-1")).thenReturn(0L);

        long resultado = notificacionService.obtenerContadorNoLeidas("usuario-1");

        assertThat(resultado).isZero();
    }
}
