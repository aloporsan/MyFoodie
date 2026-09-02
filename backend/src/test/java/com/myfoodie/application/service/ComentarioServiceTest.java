package com.myfoodie.application.service;

import com.myfoodie.application.dto.comentario.ComentarioResponseDTO;
import com.myfoodie.domain.model.Comentario;
import com.myfoodie.domain.model.TipoInteraccion;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.repository.ComentarioRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ComentarioServiceTest {

    @Mock private ComentarioRepository comentarioRepository;
    @Mock private RecetaRepository recetaRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private InteraccionSocialService interaccionSocialService;

    @InjectMocks private ComentarioService comentarioService;

    @Test
    void crearComentario_guarda_comentario_asociado_a_receta_y_usuario() {
        when(recetaRepository.existsById("receta-1")).thenReturn(true);
        when(comentarioRepository.save(any(Comentario.class))).thenAnswer(i -> {
            Comentario c = i.getArgument(0);
            c.setId("com-1");
            return c;
        });
        when(usuarioRepository.findById("user-1")).thenReturn(Optional.of(
                Usuario.builder().id("user-1").nombreUsuario("ana").build()));

        ComentarioResponseDTO dto = comentarioService.crearComentario("user-1", "receta-1", "  Qué rica  ");

        ArgumentCaptor<Comentario> captor = ArgumentCaptor.forClass(Comentario.class);
        verify(comentarioRepository).save(captor.capture());
        assertThat(captor.getValue().getRecetaId()).isEqualTo("receta-1");
        assertThat(captor.getValue().getUsuarioId()).isEqualTo("user-1");
        assertThat(captor.getValue().getTexto()).isEqualTo("Qué rica");
        assertThat(dto.esAutor()).isTrue();
        assertThat(dto.nombreUsuario()).isEqualTo("ana");
    }

    @Test
    void crearComentario_registra_interaccion_automaticamente() {
        when(recetaRepository.existsById("receta-1")).thenReturn(true);
        when(comentarioRepository.save(any(Comentario.class))).thenAnswer(i -> i.getArgument(0));

        comentarioService.crearComentario("user-1", "receta-1", "hola");

        verify(interaccionSocialService).registrarInteraccion(
                eq("user-1"), eq(TipoInteraccion.COMENTAR), eq("RECETA"), eq("receta-1"));
    }

    @Test
    void crearComentario_rechaza_texto_vacio() {
        assertThatThrownBy(() -> comentarioService.crearComentario("user-1", "receta-1", "   "))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void eliminarComentario_devuelve_404_si_no_es_autor() {
        when(comentarioRepository.findByIdAndUsuarioId("com-1", "otro")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> comentarioService.eliminarComentario("otro", "com-1"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void obtenerComentarios_devuelve_ordenados_por_fecha_desc() {
        Comentario reciente = Comentario.builder().id("c-nuevo").recetaId("receta-1").usuarioId("user-1")
                .texto("nuevo").createdAt(LocalDateTime.now()).build();
        Comentario antiguo = Comentario.builder().id("c-viejo").recetaId("receta-1").usuarioId("user-2")
                .texto("viejo").createdAt(LocalDateTime.now().minusDays(1)).build();
        when(comentarioRepository.findByRecetaIdAndEliminadoFalseOrderByCreatedAtDesc("receta-1"))
                .thenReturn(List.of(reciente, antiguo));
        when(usuarioRepository.findById(anyString())).thenReturn(Optional.empty());

        List<ComentarioResponseDTO> resultado = comentarioService.obtenerComentarios("receta-1", "user-1");

        assertThat(resultado).extracting(ComentarioResponseDTO::id).containsExactly("c-nuevo", "c-viejo");
        assertThat(resultado.get(0).esAutor()).isTrue();
        assertThat(resultado.get(1).esAutor()).isFalse();
    }
}
