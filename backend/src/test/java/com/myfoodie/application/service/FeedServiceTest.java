package com.myfoodie.application.service;

import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import com.myfoodie.application.dto.feed.FeedResponseDTO;
import com.myfoodie.application.dto.feed.FiltrosFeedDTO;
import com.myfoodie.application.dto.feed.InicializarPerfilRequestDTO;
import com.myfoodie.application.dto.feed.RecetaFeedDTO;
import com.myfoodie.application.dto.matching.SimilitudResultDTO;
import com.myfoodie.application.dto.social.SeguimientoResponseDTO;
import com.myfoodie.domain.model.IngredienteReceta;
import com.myfoodie.domain.model.PerfilGustos;
import com.myfoodie.domain.model.Receta;
import com.myfoodie.domain.model.RecetaDescartada;
import com.myfoodie.domain.model.TipoMatch;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.repository.IngredienteRecetaRepository;
import com.myfoodie.domain.repository.LikeRepository;
import com.myfoodie.domain.repository.PerfilGustosRepository;
import com.myfoodie.domain.repository.PreferenciasRepository;
import com.myfoodie.domain.repository.RecetaCompartidaRepository;
import com.myfoodie.domain.repository.RecetaDescartadaRepository;
import com.myfoodie.domain.repository.RecetaGuardadaRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
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
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
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
    @Mock private PreferenciasRepository preferenciasRepository;
    @Mock private DespensaService despensaService;
    @Mock private SocialService socialService;
    @Mock private MatchingService matchingService;
    @Spy private RecomendacionService recomendacionService = new RecomendacionService();

    @InjectMocks private FeedService feedService;

    // matchingService, al ser un mock, no reproduce el algoritmo real: para estos tests basta con
    // que considere "coincidencia" cuando los nombres son iguales ignorando mayúsculas (el
    // comportamiento que tenía este servicio antes de introducir MatchingService).
    @BeforeEach
    void configurarMatchingPorDefecto() {
        lenient().when(preferenciasRepository.findByUsuarioId(anyString())).thenReturn(Optional.empty());
        lenient().when(matchingService.calcularSimilitud(anyString(), anyString())).thenAnswer(inv -> {
            String a = inv.getArgument(0);
            String b = inv.getArgument(1);
            boolean iguales = a != null && b != null && a.trim().equalsIgnoreCase(b.trim());
            return new SimilitudResultDTO(iguales ? 1.0 : 0.0, a, b, false);
        });
        lenient().when(matchingService.clasificarMatch(anyDouble())).thenAnswer(inv -> {
            double puntuacion = inv.getArgument(0);
            if (puntuacion >= 0.99) return TipoMatch.AUTOMATICO;
            if (puntuacion >= 0.60) return TipoMatch.PROPONER;
            return TipoMatch.NUEVO;
        });
    }

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

    private Receta recetaCompleta(String id, String autorId, String categoria, String dificultad,
                                    int tiempo, int personas, List<String> etiquetas) {
        return Receta.builder()
                .id(id)
                .autorId(autorId)
                .titulo("Receta " + id)
                .tiempoEstimado(tiempo)
                .dificultad(dificultad)
                .categoria(categoria)
                .numPersonas(personas)
                .etiquetas(etiquetas)
                .estado("publicada")
                .createdAt(LocalDateTime.now())
                .build();
    }

    /** Stubs mínimos para que el pipeline del feed no lance NPE en un test de filtrado. */
    private void stubsFeedBasicos() {
        lenient().when(recetaDescartadaRepository.findByUsuarioId(anyString())).thenReturn(List.of());
        lenient().when(ingredienteRepository.findByRecetaIdIn(anyCollection())).thenReturn(List.of());
        lenient().when(despensaService.listarProductos(anyString())).thenReturn(List.of());
        lenient().when(usuarioRepository.findById(anyString())).thenReturn(Optional.empty());
    }

    private ProductoResponseDTO productoDespensa(String nombre) {
        return new ProductoResponseDTO(
                "p-1", "desp-1", nombre, 1, "unidades", null, null, null, null, null, null,
                null, false, "normal", null, null, null, null, null, null, null);
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
        when(ingredienteRepository.findByRecetaIdIn(anyCollection())).thenReturn(List.of());
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
        when(ingredienteRepository.findByRecetaIdIn(anyCollection())).thenReturn(List.of(tomate, pasta));

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

    @Test
    @DisplayName("obtenerFeed marca modoFallback cuando el usuario no tiene interacciones suficientes (cold start)")
    void obtenerFeed_marca_modoFallback_con_perfil_insuficiente() {
        when(recetaDescartadaRepository.findByUsuarioId("user-1")).thenReturn(List.of());
        when(perfilGustosRepository.findByUsuarioId("user-1")).thenReturn(Optional.empty());

        Receta r = receta("receta-1", "otro-usuario", 0);
        when(recetaRepository.findByEstadoAndAutorIdNotAndIdNotIn(
                anyString(), anyString(), anyList(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(r)));
        when(ingredienteRepository.findByRecetaIdIn(anyCollection())).thenReturn(List.of());
        when(despensaService.listarProductos("user-1")).thenReturn(List.of());
        when(usuarioRepository.findById("otro-usuario")).thenReturn(Optional.empty());

        FeedResponseDTO respuesta = feedService.obtenerFeed("user-1", 0, 10);

        assertThat(respuesta.recetas().get(0).modoFallback()).isTrue();
    }

    @Test
    @DisplayName("obtenerFeed no usa modoFallback cuando el usuario ya tiene un perfil de gustos suficiente")
    void obtenerFeed_no_marca_modoFallback_con_perfil_suficiente() {
        when(recetaDescartadaRepository.findByUsuarioId("user-1")).thenReturn(List.of());
        PerfilGustos perfilSuficiente = PerfilGustos.builder().usuarioId("user-1").totalInteracciones(15).build();
        when(perfilGustosRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(perfilSuficiente));

        Receta r = receta("receta-1", "otro-usuario", 0);
        when(recetaRepository.findByEstadoAndAutorIdNotAndIdNotIn(
                anyString(), anyString(), anyList(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(r)));
        when(ingredienteRepository.findByRecetaIdIn(anyCollection())).thenReturn(List.of());
        when(despensaService.listarProductos("user-1")).thenReturn(List.of());
        when(usuarioRepository.findById("otro-usuario")).thenReturn(Optional.empty());

        FeedResponseDTO respuesta = feedService.obtenerFeed("user-1", 0, 10);

        assertThat(respuesta.recetas().get(0).modoFallback()).isFalse();
    }

    @Test
    @DisplayName("obtenerFeed excluye las recetas de autores con bloqueo activo (en cualquier dirección)")
    void obtenerFeed_excluye_recetas_de_usuarios_bloqueados() {
        when(recetaDescartadaRepository.findByUsuarioId("user-1")).thenReturn(List.of());
        when(socialService.obtenerIdsOcultosPara("user-1")).thenReturn(Set.of("autor-bloqueado"));

        Receta bloqueada = receta("receta-bloq", "autor-bloqueado", 0);
        Receta visible = receta("receta-ok", "autor-ok", 0);
        when(recetaRepository.findByEstadoAndAutorIdNotAndIdNotIn(
                anyString(), anyString(), anyList(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(bloqueada, visible)));
        when(ingredienteRepository.findByRecetaIdIn(anyCollection())).thenReturn(List.of());
        when(despensaService.listarProductos("user-1")).thenReturn(List.of());
        when(usuarioRepository.findById(anyString())).thenReturn(Optional.empty());

        FeedResponseDTO respuesta = feedService.obtenerFeed("user-1", 0, 10);

        assertThat(respuesta.recetas()).extracting(RecetaFeedDTO::id).containsExactly("receta-ok");
    }

    // ===== inicializarPerfilDesdeOnboarding =====

    @Test
    @DisplayName("inicializarPerfilDesdeOnboarding crea y guarda un perfil nuevo a partir de las preferencias del onboarding")
    void inicializarPerfilDesdeOnboarding_crea_perfil_si_no_existe() {
        when(perfilGustosRepository.findByUsuarioId("user-1")).thenReturn(Optional.empty());
        InicializarPerfilRequestDTO dto = new InicializarPerfilRequestDTO(List.of("Italiana"), "menos_30");

        feedService.inicializarPerfilDesdeOnboarding("user-1", dto);

        ArgumentCaptor<PerfilGustos> captor = ArgumentCaptor.forClass(PerfilGustos.class);
        verify(perfilGustosRepository).save(captor.capture());
        assertThat(captor.getValue().getCategoriasPreferidas()).containsEntry("Italiana", 50);
        assertThat(captor.getValue().getTiempoMaximoHabitual()).isEqualTo(30);
    }

    @Test
    @DisplayName("inicializarPerfilDesdeOnboarding no sobrescribe un perfil que ya existe")
    void inicializarPerfilDesdeOnboarding_no_hace_nada_si_ya_existe_perfil() {
        when(perfilGustosRepository.findByUsuarioId("user-1"))
                .thenReturn(Optional.of(PerfilGustos.builder().usuarioId("user-1").build()));
        InicializarPerfilRequestDTO dto = new InicializarPerfilRequestDTO(List.of("Italiana"), "menos_30");

        feedService.inicializarPerfilDesdeOnboarding("user-1", dto);

        verify(perfilGustosRepository, org.mockito.Mockito.never()).save(any());
    }

    // ===== Filtros multidimensionales del feed (#37 ampliado) =====

    private void stubPool(List<Receta> recetas) {
        when(recetaRepository.findByEstadoAndAutorIdNotAndIdNotIn(
                anyString(), anyString(), anyList(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(recetas));
    }

    @Test
    @DisplayName("obtenerFeed sin filtros devuelve todas las recetas del pool")
    void obtenerFeed_sin_filtros_no_filtra() {
        stubsFeedBasicos();
        stubPool(List.of(
                recetaCompleta("r-almuerzo", "a1", "Almuerzo", "Fácil", 30, 2, List.of("rápido")),
                recetaCompleta("r-postre", "a2", "Postre", "Media", 50, 6, List.of("dulce"))));

        FeedResponseDTO respuesta = feedService.obtenerFeed("user-1", 0, 10, FiltrosFeedDTO.vacios());

        assertThat(respuesta.recetas()).extracting(RecetaFeedDTO::id)
                .containsExactlyInAnyOrder("r-almuerzo", "r-postre");
    }

    @Test
    @DisplayName("obtenerFeed filtra por categoría y dificultad combinadas con AND")
    void obtenerFeed_combina_categoria_y_dificultad_con_AND() {
        stubsFeedBasicos();
        stubPool(List.of(
                recetaCompleta("r-ok", "a1", "Postre", "Fácil", 40, 4, List.of()),
                recetaCompleta("r-otra-cat", "a2", "Cena", "Fácil", 40, 4, List.of()),
                recetaCompleta("r-otra-dif", "a3", "Postre", "Difícil", 40, 4, List.of())));

        FeedResponseDTO respuesta = feedService.obtenerFeed("user-1", 0, 10,
                new FiltrosFeedDTO(List.of("Postre"), List.of("Fácil"), null, null, null));

        assertThat(respuesta.recetas()).extracting(RecetaFeedDTO::id).containsExactly("r-ok");
    }

    @Test
    @DisplayName("obtenerFeed filtra por tiempo usando buckets 'min-max'")
    void obtenerFeed_filtra_por_tiempo_con_buckets() {
        stubsFeedBasicos();
        stubPool(List.of(
                recetaCompleta("r-rapida", "a1", "Almuerzo", "Fácil", 12, 2, List.of()),
                recetaCompleta("r-media", "a2", "Almuerzo", "Fácil", 45, 2, List.of()),
                recetaCompleta("r-larga", "a3", "Almuerzo", "Fácil", 90, 2, List.of())));

        FeedResponseDTO respuesta = feedService.obtenerFeed("user-1", 0, 10,
                new FiltrosFeedDTO(null, null, null, List.of("0-15", "61-9999"), null));

        assertThat(respuesta.recetas()).extracting(RecetaFeedDTO::id)
                .containsExactlyInAnyOrder("r-rapida", "r-larga");
    }

    @Test
    @DisplayName("obtenerFeed neutraliza SOLO el eje filtrado en el perfil de gustos que ordena el feed")
    void obtenerFeed_neutraliza_solo_el_eje_filtrado() {
        stubsFeedBasicos();
        PerfilGustos perfil = PerfilGustos.builder()
                .usuarioId("user-1")
                .categoriasPreferidas(new java.util.HashMap<>(Map.of("Almuerzo", 5)))
                .dificultadesPreferidas(new java.util.HashMap<>(Map.of("Fácil", 5)))
                .totalInteracciones(20)
                .build();
        when(perfilGustosRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(perfil));
        stubPool(List.of(recetaCompleta("r1", "a1", "Almuerzo", "Media", 30, 2, List.of())));

        feedService.obtenerFeed("user-1", 0, 10,
                new FiltrosFeedDTO(null, List.of("Media"), null, null, null));

        ArgumentCaptor<PerfilGustos> captor = ArgumentCaptor.forClass(PerfilGustos.class);
        verify(recomendacionService).ordenarFeed(anyList(), eq("user-1"), any(), captor.capture(), any());
        assertThat(captor.getValue().getDificultadesPreferidas()).isEmpty();
        assertThat(captor.getValue().getCategoriasPreferidas()).containsEntry("Almuerzo", 5);
    }

    @Test
    @DisplayName("obtenerRecetasSeguidos también aplica los filtros")
    void obtenerRecetasSeguidos_aplica_filtros() {
        stubsFeedBasicos();
        when(socialService.obtenerSeguidos("user-1")).thenReturn(List.of(
                new SeguimientoResponseDTO("s1", "autor-seg", "N", "n", null, "aceptado", null)));
        when(recetaRepository.findByEstadoAndAutorIdInAndIdNotIn(
                anyString(), anyCollection(), anyList(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(
                        recetaCompleta("r-vegana", "autor-seg", "Almuerzo", "Fácil", 30, 2, List.of("vegano")),
                        recetaCompleta("r-no", "autor-seg", "Almuerzo", "Fácil", 30, 2, List.of("carne")))));

        FeedResponseDTO respuesta = feedService.obtenerRecetasSeguidos("user-1", 0, 10,
                new FiltrosFeedDTO(null, null, List.of("vegano"), null, null));

        assertThat(respuesta.recetas()).extracting(RecetaFeedDTO::id).containsExactly("r-vegana");
    }

    // ===== Buscador de recetas (#104 ampliado) =====

    @Test
    @DisplayName("buscarRecetas sin texto devuelve lista vacía sin consultar el repositorio")
    void buscarRecetas_sin_texto_devuelve_lista_vacia() {
        assertThat(feedService.buscarRecetas("user-1", "   ", FiltrosFeedDTO.vacios())).isEmpty();
        verify(recetaRepository, org.mockito.Mockito.never()).findByEstado(anyString());
    }

    @Test
    @DisplayName("buscarRecetas encuentra por título e ingrediente y ordena título antes que ingrediente")
    void buscarRecetas_ordena_por_relevancia() {
        stubsFeedBasicos();
        when(recetaRepository.findByEstado("publicada")).thenReturn(List.of(
                recetaConTitulo("r-ingr", "Ensalada verde"),
                recetaConTitulo("r-titulo", "Tomate al horno")));
        when(ingredienteRepository.findByNombreContainingIgnoreCase("tomate")).thenReturn(List.of(
                IngredienteReceta.builder().recetaId("r-ingr").nombre("tomate cherry").build()));

        List<RecetaFeedDTO> resultado = feedService.buscarRecetas("user-1", "Tomate", FiltrosFeedDTO.vacios());

        assertThat(resultado).extracting(RecetaFeedDTO::id).containsExactly("r-titulo", "r-ingr");
    }

    @Test
    @DisplayName("buscarRecetas aplica también los filtros multidimensionales")
    void buscarRecetas_aplica_filtros() {
        stubsFeedBasicos();
        Receta sopaPostre = recetaCompleta("r-postre", "a1", "Postre", "Fácil", 10, 2, List.of());
        sopaPostre.setTitulo("Sopa dulce");
        Receta sopaAlmuerzo = recetaCompleta("r-almuerzo", "a2", "Almuerzo", "Fácil", 10, 2, List.of());
        sopaAlmuerzo.setTitulo("Sopa fría");
        when(recetaRepository.findByEstado("publicada")).thenReturn(List.of(sopaPostre, sopaAlmuerzo));

        List<RecetaFeedDTO> resultado = feedService.buscarRecetas("user-1", "sopa",
                new FiltrosFeedDTO(List.of("Postre"), null, null, null, null));

        assertThat(resultado).extracting(RecetaFeedDTO::id).containsExactly("r-postre");
    }

    @Test
    @DisplayName("buscarRecetas devuelve la tarjeta con la coincidencia de despensa calculada")
    void buscarRecetas_incluye_coincidencia_de_despensa() {
        lenient().when(recetaDescartadaRepository.findByUsuarioId(anyString())).thenReturn(List.of());
        lenient().when(usuarioRepository.findById(anyString())).thenReturn(Optional.empty());
        Receta r = recetaConTitulo("r1", "Tomate frito");
        when(recetaRepository.findByEstado("publicada")).thenReturn(List.of(r));
        when(ingredienteRepository.findByRecetaIdIn(anyCollection())).thenReturn(List.of(
                IngredienteReceta.builder().recetaId("r1").nombre("Tomate").cantidad(2).unidad("unidades").build()));
        when(despensaService.listarProductos("user-1")).thenReturn(List.of(productoDespensa("Tomate")));

        List<RecetaFeedDTO> resultado = feedService.buscarRecetas("user-1", "tomate", FiltrosFeedDTO.vacios());

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).coincidenciaDespensa()).isEqualTo(100.0);
        assertThat(resultado.get(0).ingredientesFaltantes()).isZero();
    }

    private Receta recetaConTitulo(String id, String titulo) {
        Receta r = recetaCompleta(id, "autor-" + id, "Almuerzo", "Fácil", 30, 2, List.of());
        r.setTitulo(titulo);
        return r;
    }
}
