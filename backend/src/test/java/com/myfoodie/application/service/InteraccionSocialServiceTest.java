package com.myfoodie.application.service;

import com.myfoodie.domain.model.InteraccionSocial;
import com.myfoodie.domain.model.TipoInteraccion;
import com.myfoodie.domain.repository.InteraccionSocialRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class InteraccionSocialServiceTest {

    @Mock private InteraccionSocialRepository interaccionSocialRepository;

    @InjectMocks private InteraccionSocialService interaccionSocialService;

    @Test
    void registrarInteraccion_guarda_tipo_entidad_y_usuario() {
        interaccionSocialService.registrarInteraccion("user-1", TipoInteraccion.COMENTAR, "RECETA", "receta-9");

        ArgumentCaptor<InteraccionSocial> captor = ArgumentCaptor.forClass(InteraccionSocial.class);
        verify(interaccionSocialRepository).save(captor.capture());
        InteraccionSocial guardada = captor.getValue();
        assertThat(guardada.getUsuarioId()).isEqualTo("user-1");
        assertThat(guardada.getTipo()).isEqualTo(TipoInteraccion.COMENTAR);
        assertThat(guardada.getEntidadTipo()).isEqualTo("RECETA");
        assertThat(guardada.getEntidadId()).isEqualTo("receta-9");
    }

    @Test
    void registrarInteraccion_no_propaga_errores_del_repositorio() {
        doThrow(new RuntimeException("mongo caído")).when(interaccionSocialRepository).save(org.mockito.ArgumentMatchers.any());

        assertThatCode(() -> interaccionSocialService.registrarInteraccion(
                "user-1", TipoInteraccion.LIKE, "RECETA", "receta-1")).doesNotThrowAnyException();
    }
}
