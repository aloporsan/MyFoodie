package com.myfoodie.application.service;

import com.myfoodie.application.dto.reporte.ReporteResponseDTO;
import com.myfoodie.domain.model.Comentario;
import com.myfoodie.domain.model.EstadoReporte;
import com.myfoodie.domain.model.MotivoReporte;
import com.myfoodie.domain.model.Reporte;
import com.myfoodie.domain.model.TipoContenidoReporte;
import com.myfoodie.domain.repository.ComentarioRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import com.myfoodie.domain.repository.ReporteRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReporteServiceTest {

    @Mock private ReporteRepository reporteRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private RecetaRepository recetaRepository;
    @Mock private ComentarioRepository comentarioRepository;
    @Mock private InteraccionSocialService interaccionSocialService;
    @Mock private RecetaService recetaService;
    @Mock private NotificacionService notificacionService;

    @InjectMocks private ReporteService reporteService;

    private void devuelveReporteGuardado() {
        when(reporteRepository.save(any(Reporte.class))).thenAnswer(i -> {
            Reporte r = i.getArgument(0);
            r.setId("rep-1");
            return r;
        });
    }

    @Test
    void crearReporte_guarda_reporte_de_receta() {
        when(recetaRepository.existsById("receta-1")).thenReturn(true);
        when(reporteRepository.existsByUsuarioReportanteIdAndTipoContenidoAndContenidoId(
                "user-1", TipoContenidoReporte.RECETA, "receta-1")).thenReturn(false);
        devuelveReporteGuardado();

        ReporteResponseDTO dto = reporteService.crearReporte(
                "user-1", TipoContenidoReporte.RECETA, "receta-1", MotivoReporte.SPAM, null);

        assertThat(dto.tipoContenido()).isEqualTo(TipoContenidoReporte.RECETA);
        assertThat(dto.estado()).isEqualTo(EstadoReporte.PENDIENTE);
    }

    @Test
    void crearReporte_guarda_reporte_de_comentario() {
        when(comentarioRepository.findById("com-1")).thenReturn(Optional.of(
                Comentario.builder().id("com-1").recetaId("receta-1").usuarioId("autor").texto("x").build()));
        when(reporteRepository.existsByUsuarioReportanteIdAndTipoContenidoAndContenidoId(
                "user-1", TipoContenidoReporte.COMENTARIO, "com-1")).thenReturn(false);
        devuelveReporteGuardado();

        ReporteResponseDTO dto = reporteService.crearReporte(
                "user-1", TipoContenidoReporte.COMENTARIO, "com-1", MotivoReporte.CONTENIDO_OFENSIVO, null);

        assertThat(dto.tipoContenido()).isEqualTo(TipoContenidoReporte.COMENTARIO);
    }

    @Test
    void crearReporte_rechaza_duplicado_mismo_usuario_mismo_contenido() {
        when(recetaRepository.existsById("receta-1")).thenReturn(true);
        when(reporteRepository.existsByUsuarioReportanteIdAndTipoContenidoAndContenidoId(
                "user-1", TipoContenidoReporte.RECETA, "receta-1")).thenReturn(true);

        assertThatThrownBy(() -> reporteService.crearReporte(
                "user-1", TipoContenidoReporte.RECETA, "receta-1", MotivoReporte.SPAM, null))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void crearReporte_retira_la_receta_y_avisa_al_autor_al_alcanzar_el_umbral() {
        when(recetaRepository.existsById("receta-1")).thenReturn(true);
        when(reporteRepository.existsByUsuarioReportanteIdAndTipoContenidoAndContenidoId(
                anyString(), any(), anyString())).thenReturn(false);
        devuelveReporteGuardado();
        when(reporteRepository.countByTipoContenidoAndContenidoId(TipoContenidoReporte.RECETA, "receta-1"))
                .thenReturn((long) ReporteService.UMBRAL_RETIRADA_AUTOMATICA);
        when(recetaService.eliminarRecetaPorModeracion("receta-1")).thenReturn(Optional.of("autor-1"));

        reporteService.crearReporte("user-5", TipoContenidoReporte.RECETA, "receta-1", MotivoReporte.SPAM, null);

        verify(recetaService).eliminarRecetaPorModeracion("receta-1");
        verify(notificacionService).crearNotificacion(
                eq("autor-1"), eq("contenido_retirado"), isNull(), eq("receta-1"), eq("RECETA"));
    }

    @Test
    void crearReporte_no_retira_ni_toca_la_cuenta_al_reportar_un_perfil() {
        when(usuarioRepository.existsById("perfil-1")).thenReturn(true);
        when(reporteRepository.existsByUsuarioReportanteIdAndTipoContenidoAndContenidoId(
                anyString(), any(), anyString())).thenReturn(false);
        devuelveReporteGuardado();

        reporteService.crearReporte("user-9", TipoContenidoReporte.PERFIL, "perfil-1", MotivoReporte.OTRO, "spam");

        verify(reporteRepository, never()).countByTipoContenidoAndContenidoId(any(), anyString());
        verifyNoInteractions(recetaService);
        verifyNoInteractions(notificacionService);
    }
}
