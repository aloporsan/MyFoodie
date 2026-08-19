package com.myfoodie.application.service;

import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import com.myfoodie.application.dto.feed.FeedResponseDTO;
import com.myfoodie.application.dto.feed.RecetaFeedDTO;
import com.myfoodie.domain.model.IngredienteReceta;
import com.myfoodie.domain.model.Receta;
import com.myfoodie.domain.model.RecetaDescartada;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.repository.IngredienteRecetaRepository;
import com.myfoodie.domain.repository.LikeRepository;
import com.myfoodie.domain.repository.PerfilGustosRepository;
import com.myfoodie.domain.repository.RecetaCompartidaRepository;
import com.myfoodie.domain.repository.RecetaDescartadaRepository;
import com.myfoodie.domain.repository.RecetaGuardadaRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("FeedService — feed de recetas, exclusiones y coincidencia con la despensa")
class FeedServiceTest {

    @Mock private RecetaRepository recetaRepository;
    @Mock private RecetaDescartadaRepository recetaDescartadaRepository;
    @Mock private RecetaGuardadaRepository recetaGuardadaRepository;
    @Mock private LikeRepository likeRepository;
    @Mock private RecetaCompartidaRepository recetaCompartidaRepository;
    @Mock private IngredienteRecetaRepository ingredienteRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private PerfilGustosRepository perfilGustosRepository;
    @Mock private DespensaService despensaService;
    @Mock private SocialService socialService;
    @Spy private RecomendacionService recomendacionService = new RecomendacionService();

    @InjectMocks private FeedService feedService;

    private Receta receta(String id, String autorId, int numIngredientes) {
        return Receta.builder()
                .id(id)
                .autorId(autorId)
                .titulo("Receta " + id)
                .tiempoEstimado(30)
                .dificultad("Fácil")
                .categoria("Almuerzo")
                .etiquetas(List.of("rápido"))
                .estado("publicada")
                .createdAt(LocalDateTime.now())
                .build();
    }

    private ProductoResponseDTO productoDespensa(String nombre) {
        return new ProductoResponseDTO(
                "p-1", "desp-1", nombre, 1, "unidades", null, null, null, null, null, null,
                null, false, "normal", null, null, null, null);
    }

    @Test
    @DisplayName("obtenerFeed excluye las recetas propias del usuario y las que ya ha descartado")
    void obtenerFeed_excluye_propias_y_descartadas() {
        RecetaDescartada descartada = RecetaDescartada.builder()
                .usuarioId("user-1").recetaId("receta-descartada").build();
        when(recetaDescartadaRepository.findByUsuarioId("user-1")).thenReturn(List.of(descartada));

        Receta r = receta("receta-1", "otro-usuario", 0);
        when(recetaRepository.findByEstadoAndAutorIdNotAndIdNotIn(
                eq("publicada"), eq("user-1"), anyList(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(r)));
        when(ingredienteRepository.findByRecetaId("receta-1")).thenReturn(List.of());
        when(despensaService.listarProductos("user-1")).thenReturn(List.of());
        when(usuarioRepository.findById("otro-usuario")).thenReturn(Optional.empty());

        feedService.obtenerFeed("user-1", 0, 10);

        ArgumentCaptor<List<String>> idsCaptor = ArgumentCaptor.forClass(List.class);
        verify(recetaRepository).findByEstadoAndAutorIdNotAndIdNotIn(
                eq("publicada"), eq("user-1"), idsCaptor.capture(), any(PageRequest.class));
        assertThat(idsCaptor.getValue()).containsExactly("receta-descartada");
    }

    @Test
    @DisplayName("obtenerFeed calcula el porcentaje de coincidencia con la despensa de forma case-insensitive")
    void obtenerFeed_calcula_coincidenciaDespensa_correctamente() {
        when(recetaDescartadaRepository.findByUsuarioId("user-1")).thenReturn(List.of());

        Receta r = receta("receta-1", "otro-usuario", 2);
        when(recetaRepository.findByEstadoAndAutorIdNotAndIdNotIn(
                anyString(), anyString(), anyList(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(r)));

        IngredienteReceta tomate = IngredienteReceta.builder()
                .recetaId("receta-1").nombre("Tomate").cantidad(2).unidad("unidades").build();
        IngredienteReceta pasta = IngredienteReceta.builder()
                .recetaId("receta-1").nombre("Pasta").cantidad(1).unidad("kg").build();
        when(ingredienteRepository.findByRecetaId("receta-1")).thenReturn(List.of(tomate, pasta));

        // El usuario tiene "TOMATE" (mayúsculas) en su despensa: debe coincidir con "Tomate"
        when(despensaService.listarProductos("user-1")).thenReturn(List.of(productoDespensa("TOMATE")));
        when(usuarioRepository.findById("otro-usuario")).thenReturn(Optional.empty());
        when(likeRepository.countByRecetaId("receta-1")).thenReturn(3L);
        when(likeRepository.existsByUsuarioIdAndRecetaId("user-1", "receta-1")).thenReturn(true);
        when(recetaGuardadaRepository.existsByUsuarioIdAndRecetaId("user-1", "receta-1")).thenReturn(false);

        FeedResponseDTO respuesta = feedService.obtenerFeed("user-1", 0, 10);

        RecetaFeedDTO dto = respuesta.recetas().get(0);
        assertThat(dto.ingredientesDisponibles()).isEqualTo(1);
        assertThat(dto.ingredientesFaltantes()).isEqualTo(1);
        assertThat(dto.coincidenciaDespensa()).isEqualTo(50.0);
        assertThat(dto.likes()).isEqualTo(3L);
        assertThat(dto.yaLike()).isTrue();
        assertThat(dto.yaGuardada()).isFalse();
    }
}
