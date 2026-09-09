package com.myfoodie.application.service;

import com.myfoodie.domain.model.PerfilGustos;
import com.myfoodie.domain.model.Receta;
import com.myfoodie.domain.repository.PerfilGustosRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InteraccionUsuarioServiceTest {

    @Mock private PerfilGustosRepository perfilGustosRepository;
    @Mock private RecetaRepository recetaRepository;

    @InjectMocks
    private InteraccionUsuarioService interaccionUsuarioService;

    private Receta receta(String categoria, String dificultad, List<String> etiquetas) {
        return Receta.builder()
                .id("receta-1")
                .autorId("autor-1")
                .categoria(categoria)
                .dificultad(dificultad)
                .etiquetas(etiquetas)
                .tiempoEstimado(30)
                .build();
    }

    private PerfilGustos perfilConPuntuaciones(Map<String, Integer> categorias) {
        return PerfilGustos.builder()
                .usuarioId("usuario-1")
                .categoriasPreferidas(new HashMap<>(categorias))
                .etiquetasPreferidas(new HashMap<>())
                .dificultadesPreferidas(new HashMap<>())
                .build();
    }

    @Test
    void actualizarPerfilGustos_señal_desconocida_no_hace_nada() {
        interaccionUsuarioService.actualizarPerfilGustos("usuario-1", "receta-1", "señal_inexistente");

        verify(recetaRepository, never()).findById(any());
        verify(perfilGustosRepository, never()).save(any());
    }

    @Test
    void actualizarPerfilGustos_receta_inexistente_no_hace_nada() {
        when(recetaRepository.findById("receta-1")).thenReturn(Optional.empty());

        interaccionUsuarioService.actualizarPerfilGustos("usuario-1", "receta-1", "like");

        verify(perfilGustosRepository, never()).save(any());
    }

    @Test
    void actualizarPerfilGustos_crea_perfil_nuevo_si_no_existe() {
        when(recetaRepository.findById("receta-1")).thenReturn(Optional.of(receta("Cena", "Fácil", List.of("saludable"))));
        when(perfilGustosRepository.findByUsuarioId("usuario-1")).thenReturn(Optional.empty());

        interaccionUsuarioService.actualizarPerfilGustos("usuario-1", "receta-1", "guardada");

        ArgumentCaptor<PerfilGustos> captor = ArgumentCaptor.forClass(PerfilGustos.class);
        verify(perfilGustosRepository).save(captor.capture());

        PerfilGustos guardado = captor.getValue();
        assertThat(guardado.getUsuarioId()).isEqualTo("usuario-1");
        assertThat(guardado.getCategoriasPreferidas()).containsEntry("Cena", 2);
        assertThat(guardado.getEtiquetasPreferidas()).containsEntry("saludable", 2);
        assertThat(guardado.getDificultadesPreferidas()).containsEntry("Fácil", 2);
    }

    @Test
    void actualizarPerfilGustos_suma_la_puntuacion_sobre_un_perfil_existente() {
        when(recetaRepository.findById("receta-1")).thenReturn(Optional.of(receta("Cena", null, null)));
        when(perfilGustosRepository.findByUsuarioId("usuario-1"))
                .thenReturn(Optional.of(perfilConPuntuaciones(Map.of("Cena", 5))));

        interaccionUsuarioService.actualizarPerfilGustos("usuario-1", "receta-1", "receta_realizada");

        ArgumentCaptor<PerfilGustos> captor = ArgumentCaptor.forClass(PerfilGustos.class);
        verify(perfilGustosRepository).save(captor.capture());

        assertThat(captor.getValue().getCategoriasPreferidas()).containsEntry("Cena", 8);
    }

    @Test
    void actualizarPerfilGustos_señal_negativa_resta_puntos() {
        when(recetaRepository.findById("receta-1")).thenReturn(Optional.of(receta("Cena", null, null)));
        when(perfilGustosRepository.findByUsuarioId("usuario-1"))
                .thenReturn(Optional.of(perfilConPuntuaciones(Map.of("Cena", 5))));

        interaccionUsuarioService.actualizarPerfilGustos("usuario-1", "receta-1", "descartada");

        ArgumentCaptor<PerfilGustos> captor = ArgumentCaptor.forClass(PerfilGustos.class);
        verify(perfilGustosRepository).save(captor.capture());

        assertThat(captor.getValue().getCategoriasPreferidas()).containsEntry("Cena", 3);
    }

    @Test
    void actualizarPerfilGustos_la_puntuacion_nunca_baja_de_cero() {
        when(recetaRepository.findById("receta-1")).thenReturn(Optional.of(receta("Cena", null, null)));
        when(perfilGustosRepository.findByUsuarioId("usuario-1"))
                .thenReturn(Optional.of(perfilConPuntuaciones(Map.of("Cena", 1))));

        interaccionUsuarioService.actualizarPerfilGustos("usuario-1", "receta-1", "reportada");

        ArgumentCaptor<PerfilGustos> captor = ArgumentCaptor.forClass(PerfilGustos.class);
        verify(perfilGustosRepository).save(captor.capture());

        assertThat(captor.getValue().getCategoriasPreferidas()).containsEntry("Cena", 0);
    }

    @Test
    void actualizarPerfilGustos_categoria_y_dificultad_en_blanco_se_ignoran() {
        when(recetaRepository.findById("receta-1")).thenReturn(Optional.of(receta("   ", "", null)));
        when(perfilGustosRepository.findByUsuarioId("usuario-1")).thenReturn(Optional.empty());

        interaccionUsuarioService.actualizarPerfilGustos("usuario-1", "receta-1", "like");

        ArgumentCaptor<PerfilGustos> captor = ArgumentCaptor.forClass(PerfilGustos.class);
        verify(perfilGustosRepository).save(captor.capture());

        assertThat(captor.getValue().getCategoriasPreferidas()).isEmpty();
        assertThat(captor.getValue().getDificultadesPreferidas()).isEmpty();
        assertThat(captor.getValue().getEtiquetasPreferidas()).isEmpty();
    }

    @Test
    void actualizarPerfilGustos_multiples_etiquetas_suman_puntuacion_a_cada_una() {
        when(recetaRepository.findById("receta-1"))
                .thenReturn(Optional.of(receta(null, null, List.of("vegano", "rápido"))));
        when(perfilGustosRepository.findByUsuarioId("usuario-1")).thenReturn(Optional.empty());

        interaccionUsuarioService.actualizarPerfilGustos("usuario-1", "receta-1", "comentario");

        ArgumentCaptor<PerfilGustos> captor = ArgumentCaptor.forClass(PerfilGustos.class);
        verify(perfilGustosRepository).save(captor.capture());

        assertThat(captor.getValue().getEtiquetasPreferidas())
                .containsEntry("vegano", 2)
                .containsEntry("rápido", 2);
    }

    // ===== totalInteracciones (RF-REC-005, umbral de cold start) =====

    @Test
    void actualizarPerfilGustos_incrementa_totalInteracciones_desde_cero_en_perfil_nuevo() {
        when(recetaRepository.findById("receta-1")).thenReturn(Optional.of(receta("Cena", null, null)));
        when(perfilGustosRepository.findByUsuarioId("usuario-1")).thenReturn(Optional.empty());

        interaccionUsuarioService.actualizarPerfilGustos("usuario-1", "receta-1", "like");

        ArgumentCaptor<PerfilGustos> captor = ArgumentCaptor.forClass(PerfilGustos.class);
        verify(perfilGustosRepository).save(captor.capture());

        assertThat(captor.getValue().getTotalInteracciones()).isEqualTo(1);
    }

    @Test
    void actualizarPerfilGustos_incrementa_totalInteracciones_sobre_un_perfil_existente() {
        when(recetaRepository.findById("receta-1")).thenReturn(Optional.of(receta("Cena", null, null)));
        PerfilGustos perfilExistente = perfilConPuntuaciones(Map.of("Cena", 5));
        perfilExistente.setTotalInteracciones(9);
        when(perfilGustosRepository.findByUsuarioId("usuario-1")).thenReturn(Optional.of(perfilExistente));

        interaccionUsuarioService.actualizarPerfilGustos("usuario-1", "receta-1", "like");

        ArgumentCaptor<PerfilGustos> captor = ArgumentCaptor.forClass(PerfilGustos.class);
        verify(perfilGustosRepository).save(captor.capture());

        assertThat(captor.getValue().getTotalInteracciones()).isEqualTo(10);
    }
}
