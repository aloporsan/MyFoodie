package com.myfoodie.application.service;

import com.myfoodie.domain.model.Comentario;
import com.myfoodie.domain.model.InteraccionSocial;
import com.myfoodie.domain.model.Receta;
import com.myfoodie.domain.model.TipoInteraccion;
import com.myfoodie.domain.repository.ComentarioRepository;
import com.myfoodie.domain.repository.InteraccionSocialRepository;
import com.myfoodie.domain.repository.LikeRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HistorialInteraccionesServiceTest {

    @Mock private LikeRepository likeRepository;
    @Mock private ComentarioRepository comentarioRepository;
    @Mock private InteraccionSocialRepository interaccionSocialRepository;
    @Mock private RecetaRepository recetaRepository;
    @Mock private RecetaService recetaService;

    @InjectMocks
    private HistorialInteraccionesService historialInteraccionesService;

    private InteraccionSocial vista(String recetaId, LocalDateTime cuando) {
        return InteraccionSocial.builder()
                .usuarioId("user-1")
                .tipo(TipoInteraccion.VER_RECETA)
                .entidadTipo("RECETA")
                .entidadId(recetaId)
                .createdAt(cuando)
                .build();
    }

    private Comentario comentario(String recetaId) {
        return Comentario.builder()
                .recetaId(recetaId)
                .usuarioId("user-1")
                .texto("comentario")
                .eliminado(false)
                .build();
    }

    @SuppressWarnings("unchecked")
    private List<String> capturarIdsPedidos() {
        ArgumentCaptor<Iterable<String>> captor = ArgumentCaptor.forClass(Iterable.class);
        verify(recetaRepository).findAllById(captor.capture());
        List<String> ids = new ArrayList<>();
        captor.getValue().forEach(ids::add);
        return ids;
    }

    @Test
    void obtenerVistasRecientemente_deduplica_por_receta() {
        // La misma receta vista dos veces + otra receta; el repo las da ordenadas por fecha desc
        when(interaccionSocialRepository
                .findByUsuarioIdAndTipoOrderByCreatedAtDesc("user-1", TipoInteraccion.VER_RECETA))
                .thenReturn(List.of(
                        vista("receta-A", LocalDateTime.of(2025, 5, 3, 10, 0)),
                        vista("receta-A", LocalDateTime.of(2025, 5, 1, 10, 0)),
                        vista("receta-B", LocalDateTime.of(2025, 5, 2, 10, 0))));
        when(recetaRepository.findAllById(org.mockito.ArgumentMatchers.any()))
                .thenReturn(List.of(
                        Receta.builder().id("receta-A").build(),
                        Receta.builder().id("receta-B").build()));

        var resultado = historialInteraccionesService.obtenerVistasRecientemente("user-1");

        assertThat(capturarIdsPedidos()).containsExactly("receta-A", "receta-B");
        assertThat(resultado).hasSize(2);
    }

    @Test
    void obtenerComentadas_devuelve_recetas_distintas() {
        when(comentarioRepository.findByUsuarioIdAndEliminadoFalseOrderByCreatedAtDesc("user-1"))
                .thenReturn(List.of(
                        comentario("receta-A"),
                        comentario("receta-A"),
                        comentario("receta-B")));
        when(recetaRepository.findAllById(org.mockito.ArgumentMatchers.any()))
                .thenReturn(List.of(
                        Receta.builder().id("receta-A").build(),
                        Receta.builder().id("receta-B").build()));

        var resultado = historialInteraccionesService.obtenerComentadas("user-1");

        assertThat(capturarIdsPedidos()).containsExactly("receta-A", "receta-B");
        assertThat(resultado).hasSize(2);
    }
}
