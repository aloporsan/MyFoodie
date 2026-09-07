package com.myfoodie.application.service;

import com.myfoodie.application.dto.despensa.ProductoUpdateCantidadDTO;
import com.myfoodie.application.dto.matching.SimilitudResultDTO;
import com.myfoodie.application.dto.receta.*;
import com.myfoodie.application.dto.unidad.UnidadConvertidaDTO;
import com.myfoodie.domain.model.Despensa;
import com.myfoodie.domain.model.IngredienteReceta;
import com.myfoodie.domain.model.Paso;
import com.myfoodie.domain.model.Producto;
import com.myfoodie.domain.model.Receta;
import com.myfoodie.domain.model.TipoMatch;
import com.myfoodie.domain.repository.ComentarioRepository;
import com.myfoodie.domain.repository.DespensaRepository;
import com.myfoodie.domain.repository.IngredienteRecetaRepository;
import com.myfoodie.domain.repository.LikeRepository;
import com.myfoodie.domain.repository.PasoRepository;
import com.myfoodie.domain.repository.ProductoRepository;
import com.myfoodie.domain.repository.RecetaGuardadaRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RecetaService — CRUD, ingredientes, pasos y publicación")
class RecetaServiceTest {

    @Mock private RecetaRepository recetaRepository;
    @Mock private IngredienteRecetaRepository ingredienteRepository;
    @Mock private PasoRepository pasoRepository;
    @Mock private RecetaGuardadaRepository recetaGuardadaRepository;
    @Mock private LikeRepository likeRepository;
    @Mock private ComentarioRepository comentarioRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private DespensaRepository despensaRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private DespensaService despensaService;
    @Mock private CarritoInteligenteService carritoInteligenteService;
    @Mock private UnidadNormalizadorService unidadNormalizadorService;
    @Mock private MatchingService matchingService;
    @Mock private SocialService socialService;

    @InjectMocks private RecetaService recetaService;

    // Por defecto, unidadNormalizadorService devuelve la cantidad/unidad tal cual (comportamiento
    // real para unidades ya objetivas, que es lo que usa el helper ingrediente() por defecto: "g").
    // matchingService, al ser un mock, no reproduce el algoritmo real: para estos tests basta con
    // que considere "coincidencia" cuando los nombres son exactamente iguales (el comportamiento
    // que tenía este servicio antes de introducir MatchingService para el matching de ingredientes).
    @BeforeEach
    void configurarNormalizadorPorDefecto() {
        lenient().when(unidadNormalizadorService.normalizarUnidades(anyDouble(), anyString()))
                .thenAnswer(inv -> new UnidadConvertidaDTO(inv.getArgument(0), inv.getArgument(1), false));
        // cantidadComparable: comportamiento real (compara por familia de unidad), suficiente para
        // estos tests, que usan unidades objetivas iguales ("g").
        UnidadNormalizadorService unidadesReal = new UnidadNormalizadorService();
        lenient().when(unidadNormalizadorService.cantidadComparable(anyDouble(), any(), any()))
                .thenAnswer(inv -> unidadesReal.cantidadComparable(
                        inv.getArgument(0), inv.getArgument(1), inv.getArgument(2)));
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

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private Receta receta(String id, String autorId) {
        return Receta.builder()
                .id(id).autorId(autorId)
                .titulo("Paella valenciana").descripcion("Receta tradicional")
                .tiempoEstimado(60).dificultad("Difícil").categoria("Arroces")
                .etiquetas(new ArrayList<>()).imagenUrl("/recetas/paella.jpg").estado("borrador")
                .build();
    }

    private Despensa despensa(String id, String usuarioId) {
        Despensa d = new Despensa();
        d.setId(id);
        d.setUsuarioId(usuarioId);
        return d;
    }

    private Producto productoDespensa(String id, String despensaId, String nombre, double cantidad) {
        return Producto.builder()
                .id(id).despensaId(despensaId).nombre(nombre).cantidad(cantidad).unidad("g")
                .build();
    }

    private RecetaRequestDTO request(String titulo) {
        return new RecetaRequestDTO(titulo, "Descripción", 30, "Fácil", "Pasta", List.of(), null, null, null);
    }

    private IngredienteReceta ingrediente(String id, String recetaId) {
        return IngredienteReceta.builder().id(id).recetaId(recetaId)
                .nombre("Arroz").cantidad(200).unidad("g").build();
    }

    private IngredienteReceta ingrediente(String id, String recetaId, String nombre, double cantidad, String unidad) {
        return IngredienteReceta.builder().id(id).recetaId(recetaId)
                .nombre(nombre).cantidad(cantidad).unidad(unidad).build();
    }

    private Paso paso(String id, String recetaId, int orden) {
        return Paso.builder().id(id).recetaId(recetaId)
                .orden(orden).descripcion("Descripción del paso").build();
    }

    // -------------------------------------------------------------------------
    // crearReceta — positivos
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("crearReceta_exitoso_conDatosValidos")
    void crearReceta_exitoso_conDatosValidos() {
        when(recetaRepository.save(any())).thenAnswer(inv -> {
            Receta r = inv.getArgument(0);
            r.setId("r1");
            return r;
        });
        when(ingredienteRepository.findByRecetaId("r1")).thenReturn(List.of());
        when(pasoRepository.findByRecetaIdOrderByOrdenAsc("r1")).thenReturn(List.of());

        RecetaResponseDTO result = recetaService.crearReceta("user-1", request("Paella"));

        assertThat(result.estado()).isEqualTo("borrador");
        assertThat(result.titulo()).isEqualTo("Paella");
    }

    @Test
    @DisplayName("crearReceta_asigna_autorId_correctamente")
    void crearReceta_asigna_autorId_correctamente() {
        when(recetaRepository.save(any())).thenAnswer(inv -> {
            Receta r = inv.getArgument(0);
            r.setId("r1");
            return r;
        });
        when(ingredienteRepository.findByRecetaId("r1")).thenReturn(List.of());
        when(pasoRepository.findByRecetaIdOrderByOrdenAsc("r1")).thenReturn(List.of());

        RecetaResponseDTO result = recetaService.crearReceta("user-42", request("Tortilla"));

        assertThat(result.autorId()).isEqualTo("user-42");
    }

    @Test
    @DisplayName("crearReceta_con_numPersonas_guarda_valor_correctamente")
    void crearReceta_con_numPersonas_guarda_valor_correctamente() {
        when(recetaRepository.save(any())).thenAnswer(inv -> {
            Receta r = inv.getArgument(0);
            r.setId("r1");
            return r;
        });
        when(ingredienteRepository.findByRecetaId("r1")).thenReturn(List.of());
        when(pasoRepository.findByRecetaIdOrderByOrdenAsc("r1")).thenReturn(List.of());

        RecetaRequestDTO dto = new RecetaRequestDTO(
                "Paella", "Descripción", 30, "Fácil", "Pasta", List.of(), null, 6, null);

        RecetaResponseDTO result = recetaService.crearReceta("user-1", dto);

        assertThat(result.numPersonas()).isEqualTo(6);
    }

    @Test
    @DisplayName("crearReceta_sin_numPersonas_usa_valor_por_defecto_2")
    void crearReceta_sin_numPersonas_usa_valor_por_defecto_2() {
        when(recetaRepository.save(any())).thenAnswer(inv -> {
            Receta r = inv.getArgument(0);
            r.setId("r1");
            return r;
        });
        when(ingredienteRepository.findByRecetaId("r1")).thenReturn(List.of());
        when(pasoRepository.findByRecetaIdOrderByOrdenAsc("r1")).thenReturn(List.of());

        RecetaResponseDTO result = recetaService.crearReceta("user-1", request("Tortilla"));

        assertThat(result.numPersonas()).isEqualTo(2);
    }

    // -------------------------------------------------------------------------
    // editarReceta — positivos
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("editarReceta_exitoso_siEsAutor")
    void editarReceta_exitoso_siEsAutor() {
        Receta receta = receta("r1", "user-1");
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(recetaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(ingredienteRepository.findByRecetaId("r1")).thenReturn(List.of());
        when(pasoRepository.findByRecetaIdOrderByOrdenAsc("r1")).thenReturn(List.of());

        RecetaResponseDTO result = recetaService.editarReceta(
                "user-1", "r1", request("Nueva Paella"));

        assertThat(result.titulo()).isEqualTo("Nueva Paella");
    }

    // -------------------------------------------------------------------------
    // eliminarReceta
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("eliminarReceta_exitoso_siEsAutor")
    void eliminarReceta_exitoso_siEsAutor() {
        Receta receta = receta("r1", "user-1");
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));

        assertThatCode(() -> recetaService.eliminarReceta("user-1", "r1"))
                .doesNotThrowAnyException();

        verify(ingredienteRepository).deleteByRecetaId("r1");
        verify(pasoRepository).deleteByRecetaId("r1");
        verify(recetaRepository).delete(receta);
    }

    // -------------------------------------------------------------------------
    // publicarReceta
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("publicarReceta_exitoso_conDatosCompletos")
    void publicarReceta_exitoso_conDatosCompletos() {
        Receta receta = receta("r1", "user-1");
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(ingredienteRepository.findByRecetaId("r1"))
                .thenReturn(List.of(ingrediente("ing-1", "r1")));
        when(pasoRepository.findByRecetaIdOrderByOrdenAsc("r1"))
                .thenReturn(List.of(paso("p1", "r1", 1)));
        when(recetaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RecetaResponseDTO result = recetaService.publicarReceta("user-1", "r1");

        assertThat(result.estado()).isEqualTo("publicada");
    }

    // -------------------------------------------------------------------------
    // guardarComoBorrador
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("guardarBorrador_mantiene_estado_borrador")
    void guardarBorrador_mantiene_estado_borrador() {
        Receta receta = receta("r1", "user-1");
        receta.setEstado("publicada");
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(recetaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(ingredienteRepository.findByRecetaId("r1")).thenReturn(List.of());
        when(pasoRepository.findByRecetaIdOrderByOrdenAsc("r1")).thenReturn(List.of());

        RecetaResponseDTO result = recetaService.guardarComoBorrador("user-1", "r1");

        assertThat(result.estado()).isEqualTo("borrador");
    }

    // -------------------------------------------------------------------------
    // ingredientes — positivos
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("añadirIngrediente_exitoso_conDatosValidos")
    void añadirIngrediente_exitoso_conDatosValidos() {
        Receta receta = receta("r1", "user-1");
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(ingredienteRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(recetaRepository.save(any())).thenReturn(receta);
        when(ingredienteRepository.findByRecetaId("r1"))
                .thenReturn(List.of(ingrediente("ing-1", "r1")));
        when(pasoRepository.findByRecetaIdOrderByOrdenAsc("r1")).thenReturn(List.of());

        RecetaResponseDTO result = recetaService.añadirIngrediente(
                "user-1", "r1", new IngredienteRequestDTO("Arroz", 200, "g", null));

        assertThat(result.ingredientes()).hasSize(1);
        assertThat(result.ingredientes().get(0).nombre()).isEqualTo("Arroz");
    }

    @Test
    @DisplayName("eliminarIngrediente_exitoso_siExiste")
    void eliminarIngrediente_exitoso_siExiste() {
        Receta receta = receta("r1", "user-1");
        IngredienteReceta ing = ingrediente("ing-1", "r1");
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(ingredienteRepository.findByRecetaIdAndId("r1", "ing-1")).thenReturn(Optional.of(ing));
        when(recetaRepository.save(any())).thenReturn(receta);

        assertThatCode(() -> recetaService.eliminarIngrediente("user-1", "r1", "ing-1"))
                .doesNotThrowAnyException();

        verify(ingredienteRepository).delete(ing);
    }

    // -------------------------------------------------------------------------
    // pasos — positivos
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("añadirPaso_asigna_orden_correctamente")
    void añadirPaso_asigna_orden_correctamente() {
        Receta receta = receta("r1", "user-1");
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(pasoRepository.findByRecetaIdOrderByOrdenAsc("r1"))
                .thenReturn(List.of())
                .thenReturn(List.of(paso("p1", "r1", 1)));
        when(pasoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(recetaRepository.save(any())).thenReturn(receta);
        when(ingredienteRepository.findByRecetaId("r1")).thenReturn(List.of());

        ArgumentCaptor<Paso> captor = ArgumentCaptor.forClass(Paso.class);
        recetaService.añadirPaso("user-1", "r1", new PasoRequestDTO("Primer paso", null));

        verify(pasoRepository).save(captor.capture());
        assertThat(captor.getValue().getOrden()).isEqualTo(1);
    }

    @Test
    @DisplayName("añadirPaso_segundo_paso_orden_2")
    void añadirPaso_segundo_paso_tiene_orden_2() {
        Receta receta = receta("r1", "user-1");
        Paso primerPaso = paso("p1", "r1", 1);
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(pasoRepository.findByRecetaIdOrderByOrdenAsc("r1"))
                .thenReturn(List.of(primerPaso))
                .thenReturn(List.of(primerPaso, paso("p2", "r1", 2)));
        when(pasoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(recetaRepository.save(any())).thenReturn(receta);
        when(ingredienteRepository.findByRecetaId("r1")).thenReturn(List.of());

        ArgumentCaptor<Paso> captor = ArgumentCaptor.forClass(Paso.class);
        recetaService.añadirPaso("user-1", "r1", new PasoRequestDTO("Segundo paso", null));

        verify(pasoRepository).save(captor.capture());
        assertThat(captor.getValue().getOrden()).isEqualTo(2);
    }

    @Test
    @DisplayName("reordenarPasos_actualiza_orden_correctamente")
    void reordenarPasos_actualiza_orden_correctamente() {
        Receta receta = receta("r1", "user-1");
        Paso p1 = paso("paso-1", "r1", 1);
        Paso p2 = paso("paso-2", "r1", 2);
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(pasoRepository.findByRecetaIdOrderByOrdenAsc("r1"))
                .thenReturn(List.of(p1, p2))
                .thenReturn(List.of(p2, p1));
        when(pasoRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));
        when(recetaRepository.save(any())).thenReturn(receta);
        when(ingredienteRepository.findByRecetaId("r1")).thenReturn(List.of());

        recetaService.reordenarPasos("user-1", "r1", List.of("paso-2", "paso-1"));

        assertThat(p2.getOrden()).isEqualTo(1);
        assertThat(p1.getOrden()).isEqualTo(2);
    }

    @Test
    @DisplayName("eliminarPaso_reordena_automaticamente")
    void eliminarPaso_reordena_automaticamente() {
        Receta receta = receta("r1", "user-1");
        Paso p1 = paso("paso-1", "r1", 1);
        Paso p2 = paso("paso-2", "r1", 2);
        Paso p3 = paso("paso-3", "r1", 3);
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(pasoRepository.findByRecetaIdAndId("r1", "paso-2")).thenReturn(Optional.of(p2));
        when(pasoRepository.findByRecetaIdOrderByOrdenAsc("r1")).thenReturn(List.of(p1, p3));
        when(pasoRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));
        when(recetaRepository.save(any())).thenReturn(receta);

        recetaService.eliminarPaso("user-1", "r1", "paso-2");

        verify(pasoRepository).delete(p2);
        assertThat(p3.getOrden()).isEqualTo(2);
    }

    // -------------------------------------------------------------------------
    // etiquetas
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("actualizarEtiquetas_reemplaza_etiquetas_anteriores")
    void actualizarEtiquetas_reemplaza_etiquetas_anteriores() {
        Receta receta = receta("r1", "user-1");
        receta.setEtiquetas(new ArrayList<>(List.of("vieja")));
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(recetaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(ingredienteRepository.findByRecetaId("r1")).thenReturn(List.of());
        when(pasoRepository.findByRecetaIdOrderByOrdenAsc("r1")).thenReturn(List.of());

        RecetaResponseDTO result = recetaService.actualizarEtiquetas(
                "user-1", "r1", List.of("vegano", "saludable"));

        assertThat(result.etiquetas()).containsExactly("vegano", "saludable");
    }

    // -------------------------------------------------------------------------
    // crearReceta — negativos
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("crearReceta_falla_siTituloVacio")
    void crearReceta_falla_siTituloVacio() {
        assertThatThrownBy(() ->
                recetaService.crearReceta("user-1", new RecetaRequestDTO("", "desc", 30, "Fácil", "Pasta", List.of(), null, null, null)))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    // -------------------------------------------------------------------------
    // publicarReceta — negativos
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("publicarReceta_falla_sinIngredientes")
    void publicarReceta_falla_sinIngredientes() {
        Receta receta = receta("r1", "user-1");
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(ingredienteRepository.findByRecetaId("r1")).thenReturn(List.of());
        when(pasoRepository.findByRecetaIdOrderByOrdenAsc("r1"))
                .thenReturn(List.of(paso("p1", "r1", 1)));

        assertThatThrownBy(() -> recetaService.publicarReceta("user-1", "r1"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("ingrediente");
    }

    @Test
    @DisplayName("publicarReceta_falla_sinPasos")
    void publicarReceta_falla_sinPasos() {
        Receta receta = receta("r1", "user-1");
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(ingredienteRepository.findByRecetaId("r1"))
                .thenReturn(List.of(ingrediente("ing-1", "r1")));
        when(pasoRepository.findByRecetaIdOrderByOrdenAsc("r1")).thenReturn(List.of());

        assertThatThrownBy(() -> recetaService.publicarReceta("user-1", "r1"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("paso");
    }

    @Test
    @DisplayName("publicarReceta_falla_sinDescripcion")
    void publicarReceta_falla_sinDescripcion() {
        Receta receta = receta("r1", "user-1");
        receta.setDescripcion("");
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(ingredienteRepository.findByRecetaId("r1"))
                .thenReturn(List.of(ingrediente("ing-1", "r1")));
        when(pasoRepository.findByRecetaIdOrderByOrdenAsc("r1"))
                .thenReturn(List.of(paso("p1", "r1", 1)));

        assertThatThrownBy(() -> recetaService.publicarReceta("user-1", "r1"))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("publicarReceta_falla_sinDificultad")
    void publicarReceta_falla_sinDificultad() {
        Receta receta = receta("r1", "user-1");
        receta.setDificultad("");
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(ingredienteRepository.findByRecetaId("r1"))
                .thenReturn(List.of(ingrediente("ing-1", "r1")));
        when(pasoRepository.findByRecetaIdOrderByOrdenAsc("r1"))
                .thenReturn(List.of(paso("p1", "r1", 1)));

        assertThatThrownBy(() -> recetaService.publicarReceta("user-1", "r1"))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("publicarReceta_falla_sinCategoria")
    void publicarReceta_falla_sinCategoria() {
        Receta receta = receta("r1", "user-1");
        receta.setCategoria("");
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(ingredienteRepository.findByRecetaId("r1"))
                .thenReturn(List.of(ingrediente("ing-1", "r1")));
        when(pasoRepository.findByRecetaIdOrderByOrdenAsc("r1"))
                .thenReturn(List.of(paso("p1", "r1", 1)));

        assertThatThrownBy(() -> recetaService.publicarReceta("user-1", "r1"))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("publicarReceta_falla_conTiempoEstimadoCero")
    void publicarReceta_falla_conTiempoEstimadoCero() {
        Receta receta = receta("r1", "user-1");
        receta.setTiempoEstimado(0);
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(ingredienteRepository.findByRecetaId("r1"))
                .thenReturn(List.of(ingrediente("ing-1", "r1")));
        when(pasoRepository.findByRecetaIdOrderByOrdenAsc("r1"))
                .thenReturn(List.of(paso("p1", "r1", 1)));

        assertThatThrownBy(() -> recetaService.publicarReceta("user-1", "r1"))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    // -------------------------------------------------------------------------
    // editarReceta / eliminarReceta — negativos
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("editarReceta_falla_siNoPropietario")
    void editarReceta_falla_siNoPropietario() {
        Receta receta = receta("r1", "otro-user");
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));

        assertThatThrownBy(() ->
                recetaService.editarReceta("user-1", "r1", request("Nueva")))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("eliminarReceta_falla_siNoPropietario")
    void eliminarReceta_falla_siNoPropietario() {
        Receta receta = receta("r1", "otro-user");
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));

        assertThatThrownBy(() -> recetaService.eliminarReceta("user-1", "r1"))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("editarReceta_falla_siRecetaNoExiste")
    void editarReceta_falla_siRecetaNoExiste() {
        when(recetaRepository.findById("no-existe")).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                recetaService.editarReceta("user-1", "no-existe", request("Nueva")))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("añadirIngrediente_falla_siRecetaNoExiste")
    void añadirIngrediente_falla_siRecetaNoExiste() {
        when(recetaRepository.findById("no-existe")).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                recetaService.añadirIngrediente("user-1", "no-existe",
                        new IngredienteRequestDTO("Sal", 1, "g", null)))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("añadirPaso_falla_siDescripcionVacia")
    void añadirPaso_falla_siDescripcionVacia() {
        assertThatThrownBy(() ->
                recetaService.añadirPaso("user-1", "r1", new PasoRequestDTO("", null)))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    // -------------------------------------------------------------------------
    // marcarRecetaComoRealizada / descontarIngredientesReceta
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("marcarRecetaComoRealizada_calcula_ingredientes_correctamente")
    void marcarRecetaComoRealizada_calcula_ingredientes_correctamente() {
        Receta receta = receta("r1", "user-1"); // numPersonas = 2
        Despensa despensa = despensa("desp-1", "user-1");
        Producto arroz = productoDespensa("prod-1", "desp-1", "Arroz", 150);

        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(recetaGuardadaRepository.existsByUsuarioIdAndRecetaId("user-1", "r1")).thenReturn(true);
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(despensa));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(arroz));
        when(ingredienteRepository.findByRecetaId("r1")).thenReturn(List.of(ingrediente("ing-1", "r1")));

        List<IngredienteConsumoDTO> resultado = recetaService.marcarRecetaComoRealizada("user-1", "r1", 2);

        assertThat(resultado).hasSize(1);
        IngredienteConsumoDTO consumo = resultado.get(0);
        assertThat(consumo.nombre()).isEqualTo("Arroz");
        assertThat(consumo.cantidadCalculada()).isEqualTo(200.0);
        assertThat(consumo.unidad()).isEqualTo("g");
        assertThat(consumo.productoEnDespensa()).isTrue();
        assertThat(consumo.cantidadDisponible()).isEqualTo(150.0);
        assertThat(consumo.suficiente()).isFalse();
    }

    @Test
    @DisplayName("marcarRecetaComoRealizada_escala_segun_raciones_elaboradas")
    void marcarRecetaComoRealizada_escala_segun_raciones_elaboradas() {
        Receta receta = receta("r1", "user-1"); // numPersonas = 2
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(recetaGuardadaRepository.existsByUsuarioIdAndRecetaId("user-1", "r1")).thenReturn(true);
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.empty());
        when(ingredienteRepository.findByRecetaId("r1")).thenReturn(List.of(ingrediente("ing-1", "r1")));

        List<IngredienteConsumoDTO> resultado = recetaService.marcarRecetaComoRealizada("user-1", "r1", 4);

        assertThat(resultado.get(0).cantidadCalculada()).isEqualTo(400.0);
        assertThat(resultado.get(0).productoEnDespensa()).isFalse();
    }

    @Test
    @DisplayName("descontarIngredientesReceta_actualiza_cantidades_en_despensa")
    void descontarIngredientesReceta_actualiza_cantidades_en_despensa() {
        Receta receta = receta("r1", "user-1"); // numPersonas = 2
        Despensa despensa = despensa("desp-1", "user-1");
        Producto arroz = productoDespensa("prod-1", "desp-1", "Arroz", 500);

        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(recetaGuardadaRepository.existsByUsuarioIdAndRecetaId("user-1", "r1")).thenReturn(true);
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(despensa));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(arroz));
        when(ingredienteRepository.findByRecetaId("r1")).thenReturn(List.of(ingrediente("ing-1", "r1")));

        DescuentoRecetaResponseDTO resultado = recetaService.descontarIngredientesReceta("user-1", "r1", 2);

        assertThat(resultado.descontados()).hasSize(1);
        assertThat(resultado.noDisponibles()).isEmpty();

        ArgumentCaptor<ProductoUpdateCantidadDTO> captor = ArgumentCaptor.forClass(ProductoUpdateCantidadDTO.class);
        verify(despensaService).actualizarCantidad(eq("user-1"), eq("prod-1"), captor.capture(), eq(false));
        assertThat(captor.getValue().delta()).isEqualTo(-200.0);
    }

    @Test
    @DisplayName("descontarIngredientesReceta_coincidenciaParcial_incluyeProductoCandidato")
    void descontarIngredientesReceta_coincidenciaParcial_incluyeProductoCandidato() {
        Receta receta = receta("r1", "user-1"); // numPersonas = 2
        Despensa despensa = despensa("desp-1", "user-1");
        Producto carnePicada = productoDespensa("prod-1", "desp-1", "Carne picada", 500);

        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(recetaGuardadaRepository.existsByUsuarioIdAndRecetaId("user-1", "r1")).thenReturn(true);
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(despensa));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(carnePicada));
        when(ingredienteRepository.findByRecetaId("r1")).thenReturn(List.of(ingrediente("ing-1", "r1", "Carne", 300, "g")));

        // "Carne" (receta) vs "Carne picada" (despensa) no son exactamente iguales: se simula
        // una coincidencia PROPONER (parecido, no automática) en vez del match exacto por defecto.
        when(matchingService.calcularSimilitud("Carne", "Carne picada"))
                .thenReturn(new SimilitudResultDTO(0.85, "carne", "carne picada", false));

        DescuentoRecetaResponseDTO resultado = recetaService.descontarIngredientesReceta("user-1", "r1", 2);

        assertThat(resultado.descontados()).isEmpty();
        assertThat(resultado.noDisponibles()).isEmpty();
        assertThat(resultado.coincidenciasParciales()).hasSize(1);
        IngredienteConsumoDTO coincidencia = resultado.coincidenciasParciales().get(0);
        assertThat(coincidencia.nombre()).isEqualTo("Carne");
        assertThat(coincidencia.tipoMatch()).isEqualTo(TipoMatch.PROPONER);
        assertThat(coincidencia.productoId()).isEqualTo("prod-1");
        assertThat(coincidencia.productoNombre()).isEqualTo("Carne picada");
        verify(despensaService, never()).actualizarCantidad(any(), any(), any(), anyBoolean());
    }

    @Test
    @DisplayName("descontarIngredientesReceta_deja_en_cero_si_stock_insuficiente")
    void descontarIngredientesReceta_deja_en_cero_si_stock_insuficiente() {
        Receta receta = receta("r1", "user-1"); // numPersonas = 2
        Despensa despensa = despensa("desp-1", "user-1");
        Producto arroz = productoDespensa("prod-1", "desp-1", "Arroz", 50);

        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(recetaGuardadaRepository.existsByUsuarioIdAndRecetaId("user-1", "r1")).thenReturn(true);
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(despensa));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(arroz));
        when(ingredienteRepository.findByRecetaId("r1")).thenReturn(List.of(ingrediente("ing-1", "r1")));

        DescuentoRecetaResponseDTO resultado = recetaService.descontarIngredientesReceta("user-1", "r1", 2);

        assertThat(resultado.descontados()).hasSize(1);
        assertThat(resultado.descontados().get(0).suficiente()).isFalse();

        // Deja el producto en 0 en vez de intentar restar más de lo disponible.
        ArgumentCaptor<ProductoUpdateCantidadDTO> captor = ArgumentCaptor.forClass(ProductoUpdateCantidadDTO.class);
        verify(despensaService).actualizarCantidad(eq("user-1"), eq("prod-1"), captor.capture(), eq(false));
        assertThat(captor.getValue().delta()).isEqualTo(-50.0);
    }

    @Test
    @DisplayName("descontarIngredientesReceta_registra_movimiento_con_descripcion_receta")
    void descontarIngredientesReceta_registra_movimiento_con_descripcion_receta() {
        Receta receta = receta("r1", "user-1"); // titulo = "Paella valenciana"
        Despensa despensa = despensa("desp-1", "user-1");
        Producto arroz = productoDespensa("prod-1", "desp-1", "Arroz", 500);

        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(recetaGuardadaRepository.existsByUsuarioIdAndRecetaId("user-1", "r1")).thenReturn(true);
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(despensa));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(arroz));
        when(ingredienteRepository.findByRecetaId("r1")).thenReturn(List.of(ingrediente("ing-1", "r1")));

        recetaService.descontarIngredientesReceta("user-1", "r1", 2);

        ArgumentCaptor<ProductoUpdateCantidadDTO> captor = ArgumentCaptor.forClass(ProductoUpdateCantidadDTO.class);
        verify(despensaService).actualizarCantidad(eq("user-1"), eq("prod-1"), captor.capture(), eq(false));
        assertThat(captor.getValue().descripcion()).isEqualTo("Usado en receta: Paella valenciana");
        assertThat(captor.getValue().motivo()).isEqualTo("usado_en_receta");
    }

    @Test
    @DisplayName("descontarIngredientesReceta_ingredientes_con_unidades_incompatibles_marcados_como_no_comparables")
    void descontarIngredientesReceta_ingredientesConUnidadesIncompatibles_marcadosComoNoComparables() {
        Receta receta = receta("r1", "user-1"); // numPersonas = 2
        Despensa despensa = despensa("desp-1", "user-1");
        Producto aceite = Producto.builder()
                .id("prod-1").despensaId("desp-1").nombre("Aceite").cantidad(500).unidad("ml").build();

        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(recetaGuardadaRepository.existsByUsuarioIdAndRecetaId("user-1", "r1")).thenReturn(true);
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(despensa));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(aceite));
        when(ingredienteRepository.findByRecetaId("r1")).thenReturn(
                List.of(ingrediente("ing-1", "r1", "Aceite", 100, "g")));

        DescuentoRecetaResponseDTO resultado = recetaService.descontarIngredientesReceta("user-1", "r1", 2);

        assertThat(resultado.descontados()).isEmpty();
        assertThat(resultado.noDisponibles()).hasSize(1);
        assertThat(resultado.noDisponibles().get(0).noComparable()).isTrue();
        assertThat(resultado.noDisponibles().get(0).productoEnDespensa()).isTrue();
        verify(despensaService, never()).actualizarCantidad(anyString(), anyString(), any(), anyBoolean());
        verify(carritoInteligenteService, never()).actualizarCarritoTrasModificacionDespensa(anyString());
    }

    @Test
    @DisplayName("descontarIngredientesReceta_usa_unidades_normalizadas")
    void descontarIngredientesReceta_usaUnidadesNormalizadas() {
        Receta receta = receta("r1", "user-1"); // numPersonas = 2
        Despensa despensa = despensa("desp-1", "user-1");
        Producto leche = Producto.builder()
                .id("prod-1").despensaId("desp-1").nombre("Leche").cantidad(500).unidad("ml").build();

        when(unidadNormalizadorService.normalizarUnidades(1, "taza"))
                .thenReturn(new UnidadConvertidaDTO(250, "ml", true));
        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(recetaGuardadaRepository.existsByUsuarioIdAndRecetaId("user-1", "r1")).thenReturn(true);
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(despensa));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(leche));
        when(ingredienteRepository.findByRecetaId("r1")).thenReturn(
                List.of(ingrediente("ing-1", "r1", "Leche", 1, "taza")));

        DescuentoRecetaResponseDTO resultado = recetaService.descontarIngredientesReceta("user-1", "r1", 2);

        assertThat(resultado.descontados()).hasSize(1);
        assertThat(resultado.descontados().get(0).cantidadCalculada()).isEqualTo(250.0);
        assertThat(resultado.descontados().get(0).unidad()).isEqualTo("ml");

        ArgumentCaptor<ProductoUpdateCantidadDTO> captor = ArgumentCaptor.forClass(ProductoUpdateCantidadDTO.class);
        verify(despensaService).actualizarCantidad(eq("user-1"), eq("prod-1"), captor.capture(), eq(false));
        assertThat(captor.getValue().delta()).isEqualTo(-250.0);
    }

    @Test
    @DisplayName("descontarIngredientesReceta solo actualiza el carrito una vez, aunque se descuenten varios ingredientes")
    void descontarIngredientesReceta_actualizaCarritoUnaSolaVez_aunqueHayaVariosIngredientes() {
        Receta receta = receta("r1", "user-1"); // numPersonas = 2
        Despensa despensa = despensa("desp-1", "user-1");
        Producto arroz = productoDespensa("prod-1", "desp-1", "Arroz", 500);
        Producto sal = productoDespensa("prod-2", "desp-1", "Sal", 50);

        when(recetaRepository.findById("r1")).thenReturn(Optional.of(receta));
        when(recetaGuardadaRepository.existsByUsuarioIdAndRecetaId("user-1", "r1")).thenReturn(true);
        when(despensaRepository.findByUsuarioId("user-1")).thenReturn(Optional.of(despensa));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(arroz, sal));
        when(ingredienteRepository.findByRecetaId("r1")).thenReturn(List.of(
                ingrediente("ing-1", "r1", "Arroz", 200, "g"),
                ingrediente("ing-2", "r1", "Sal", 10, "g")));

        recetaService.descontarIngredientesReceta("user-1", "r1", 2);

        verify(despensaService, times(2)).actualizarCantidad(eq("user-1"), anyString(), any(), eq(false));
        verify(carritoInteligenteService, times(1)).actualizarCarritoTrasModificacionDespensa("user-1");
    }

    // -------------------------------------------------------------------------
    // Recetas publicadas de otro usuario (perfil público)
    // -------------------------------------------------------------------------

    @Test
    void recetasPublicadasDeUsuario_devuelve_las_publicadas_del_autor() {
        when(recetaRepository.findByAutorIdAndEstado("autor-1", "publicada"))
                .thenReturn(List.of(receta("r1", "autor-1"), receta("r2", "autor-1")));

        List<RecetaFeedDTO> resultado =
                recetaService.recetasPublicadasDeUsuario("autor-1", "visitante-1");

        assertThat(resultado).hasSize(2);
        verify(socialService).verificarAccesoListado("autor-1", "visitante-1");
    }

    @Test
    void recetasPublicadasDeUsuario_propaga_error_de_acceso_y_no_consulta_recetas() {
        doThrow(new ApiException(HttpStatus.FORBIDDEN, "Sin permiso"))
                .when(socialService).verificarAccesoListado("autor-1", "visitante-1");

        assertThatThrownBy(() -> recetaService.recetasPublicadasDeUsuario("autor-1", "visitante-1"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        verify(recetaRepository, never()).findByAutorIdAndEstado(anyString(), anyString());
    }
}
