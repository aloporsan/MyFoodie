package com.myfoodie.application.service;

import com.myfoodie.domain.model.AccionFeed;
import com.myfoodie.domain.model.Like;
import com.myfoodie.domain.model.Receta;
import com.myfoodie.domain.model.RecetaGuardada;
import com.myfoodie.domain.model.TipoInteraccion;
import com.myfoodie.domain.repository.AccionFeedRepository;
import com.myfoodie.domain.repository.LikeRepository;
import com.myfoodie.domain.repository.RecetaDescartadaRepository;
import com.myfoodie.domain.repository.RecetaGuardadaRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import com.myfoodie.exception.ApiException;
import org.junit.jupiter.api.DisplayName;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FeedAccionServiceTest {

    @Mock private RecetaGuardadaRepository recetaGuardadaRepository;
    @Mock private RecetaDescartadaRepository recetaDescartadaRepository;
    @Mock private LikeRepository likeRepository;
    @Mock private AccionFeedRepository accionFeedRepository;
    @Mock private InteraccionUsuarioService interaccionUsuarioService;
    @Mock private InteraccionSocialService interaccionSocialService;
    @Mock private RecetaRepository recetaRepository;
    @Mock private NotificacionService notificacionService;

    @InjectMocks private FeedAccionService feedAccionService;

    // -------------------------------------------------------------------------
    // guardarReceta
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("guardarReceta: si no estaba guardada, la guarda y registra la acción y las interacciones")
    void guardarReceta_nueva() {
        when(recetaGuardadaRepository.existsByUsuarioIdAndRecetaId("u1", "r1")).thenReturn(false);

        feedAccionService.guardarReceta("u1", "r1");

        verify(recetaGuardadaRepository).save(any(RecetaGuardada.class));
        verify(accionFeedRepository).save(any(AccionFeed.class));
        verify(interaccionUsuarioService).actualizarPerfilGustos("u1", "r1", "guardada");
        verify(interaccionSocialService).registrarInteraccion(
                "u1", TipoInteraccion.GUARDAR_RECETA, "RECETA", "r1");
    }

    @Test
    @DisplayName("guardarReceta: si ya estaba guardada, no hace nada")
    void guardarReceta_yaGuardada() {
        when(recetaGuardadaRepository.existsByUsuarioIdAndRecetaId("u1", "r1")).thenReturn(true);

        feedAccionService.guardarReceta("u1", "r1");

        verify(recetaGuardadaRepository, never()).save(any());
        verify(accionFeedRepository, never()).save(any());
        verifyNoInteractions(interaccionUsuarioService, interaccionSocialService);
    }

    // -------------------------------------------------------------------------
    // descartarReceta
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("descartarReceta: nueva -> guarda y registra")
    void descartarReceta_nueva() {
        when(recetaDescartadaRepository.existsByUsuarioIdAndRecetaId("u1", "r1")).thenReturn(false);

        feedAccionService.descartarReceta("u1", "r1");

        verify(recetaDescartadaRepository).save(any());
        verify(accionFeedRepository).save(any(AccionFeed.class));
        verify(interaccionSocialService).registrarInteraccion(
                "u1", TipoInteraccion.DESCARTAR_RECETA, "RECETA", "r1");
    }

    @Test
    @DisplayName("descartarReceta: ya descartada -> 409")
    void descartarReceta_yaDescartada() {
        when(recetaDescartadaRepository.existsByUsuarioIdAndRecetaId("u1", "r1")).thenReturn(true);

        assertThatThrownBy(() -> feedAccionService.descartarReceta("u1", "r1"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.CONFLICT));
        verify(recetaDescartadaRepository, never()).save(any());
    }

    // -------------------------------------------------------------------------
    // darLike / quitarLike
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("darLike: nueva y receta de otro autor -> guarda like y notifica al autor")
    void darLike_notificaAlAutor() {
        when(likeRepository.existsByUsuarioIdAndRecetaId("u1", "r1")).thenReturn(false);
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(
                Receta.builder().id("r1").autorId("autor-9").build()));

        feedAccionService.darLike("u1", "r1");

        verify(likeRepository).save(any(Like.class));
        verify(notificacionService).crearNotificacion(
                eq("autor-9"), eq("nuevo_like"), eq("u1"), eq("r1"), eq("receta"));
    }

    @Test
    @DisplayName("darLike: si la receta es del propio usuario, no se notifica")
    void darLike_propiaReceta_noNotifica() {
        when(likeRepository.existsByUsuarioIdAndRecetaId("u1", "r1")).thenReturn(false);
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(
                Receta.builder().id("r1").autorId("u1").build()));

        feedAccionService.darLike("u1", "r1");

        verify(likeRepository).save(any(Like.class));
        verifyNoInteractions(notificacionService);
    }

    @Test
    @DisplayName("darLike: like ya existente -> 409")
    void darLike_yaExiste() {
        when(likeRepository.existsByUsuarioIdAndRecetaId("u1", "r1")).thenReturn(true);

        assertThatThrownBy(() -> feedAccionService.darLike("u1", "r1"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    @DisplayName("quitarLike: si existe -> borra y registra la acción")
    void quitarLike_existente() {
        Like like = Like.builder().id("l1").usuarioId("u1").recetaId("r1").build();
        when(likeRepository.findByUsuarioIdAndRecetaId("u1", "r1")).thenReturn(Optional.of(like));

        feedAccionService.quitarLike("u1", "r1");

        verify(likeRepository).delete(like);
        verify(accionFeedRepository).save(any(AccionFeed.class));
    }

    @Test
    @DisplayName("quitarLike: si no existe -> no hace nada")
    void quitarLike_inexistente() {
        when(likeRepository.findByUsuarioIdAndRecetaId("u1", "r1")).thenReturn(Optional.empty());

        feedAccionService.quitarLike("u1", "r1");

        verify(likeRepository, never()).delete(any());
        verify(accionFeedRepository, never()).save(any());
    }

    // -------------------------------------------------------------------------
    // deshacerUltimaAccion
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("deshacer: sin acciones -> 404")
    void deshacer_sinAcciones() {
        when(accionFeedRepository.findFirstByUsuarioIdOrderByCreatedAtDesc("u1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> feedAccionService.deshacerUltimaAccion("u1"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    @DisplayName("deshacer: última acción 'guardada' -> borra la RecetaGuardada y la AccionFeed")
    void deshacer_guardada() {
        AccionFeed accion = AccionFeed.builder().id("a1").usuarioId("u1").tipo("guardada").recetaId("r1").build();
        when(accionFeedRepository.findFirstByUsuarioIdOrderByCreatedAtDesc("u1")).thenReturn(Optional.of(accion));
        RecetaGuardada guardada = RecetaGuardada.builder().usuarioId("u1").recetaId("r1").build();
        when(recetaGuardadaRepository.findByUsuarioIdAndRecetaId("u1", "r1")).thenReturn(Optional.of(guardada));

        feedAccionService.deshacerUltimaAccion("u1");

        verify(recetaGuardadaRepository).delete(guardada);
        verify(accionFeedRepository).delete(accion);
    }

    @Test
    @DisplayName("deshacer: última acción 'like' -> borra el Like")
    void deshacer_like() {
        AccionFeed accion = AccionFeed.builder().id("a1").usuarioId("u1").tipo("like").recetaId("r1").build();
        when(accionFeedRepository.findFirstByUsuarioIdOrderByCreatedAtDesc("u1")).thenReturn(Optional.of(accion));
        Like like = Like.builder().id("l1").usuarioId("u1").recetaId("r1").build();
        when(likeRepository.findByUsuarioIdAndRecetaId("u1", "r1")).thenReturn(Optional.of(like));

        feedAccionService.deshacerUltimaAccion("u1");

        verify(likeRepository).delete(like);
        verify(accionFeedRepository).delete(accion);
    }

    @Test
    @DisplayName("deshacer: tipo desconocido -> 500 y no borra la acción")
    void deshacer_tipoDesconocido() {
        AccionFeed accion = AccionFeed.builder().id("a1").usuarioId("u1").tipo("???").recetaId("r1").build();
        when(accionFeedRepository.findFirstByUsuarioIdOrderByCreatedAtDesc("u1")).thenReturn(Optional.of(accion));

        assertThatThrownBy(() -> feedAccionService.deshacerUltimaAccion("u1"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus())
                        .isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR));
        verify(accionFeedRepository, never()).delete(any());
    }

    // -------------------------------------------------------------------------
    // limpiarDescartadas
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("limpiarDescartadas: delega en deleteByUsuarioId")
    void limpiarDescartadas() {
        feedAccionService.limpiarDescartadas("u1");
        verify(recetaDescartadaRepository).deleteByUsuarioId("u1");
        verifyNoInteractions(accionFeedRepository);
    }

    @Test
    @DisplayName("darLike: registra la acción de feed 'like'")
    void darLike_registraAccion() {
        when(likeRepository.existsByUsuarioIdAndRecetaId(anyString(), anyString())).thenReturn(false);
        when(recetaRepository.findById("r1")).thenReturn(Optional.empty());

        feedAccionService.darLike("u1", "r1");

        verify(accionFeedRepository).save(any(AccionFeed.class));
        verify(interaccionUsuarioService).actualizarPerfilGustos("u1", "r1", "like");
    }
}
