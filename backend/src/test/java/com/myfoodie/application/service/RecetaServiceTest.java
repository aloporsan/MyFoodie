package com.myfoodie.application.service;

import com.myfoodie.application.dto.receta.*;
import com.myfoodie.domain.model.IngredienteReceta;
import com.myfoodie.domain.model.Paso;
import com.myfoodie.domain.model.Receta;
import com.myfoodie.domain.repository.IngredienteRecetaRepository;
import com.myfoodie.domain.repository.LikeRepository;
import com.myfoodie.domain.repository.PasoRepository;
import com.myfoodie.domain.repository.RecetaGuardadaRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
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
    @Mock private UsuarioRepository usuarioRepository;

    @InjectMocks private RecetaService recetaService;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private Receta receta(String id, String autorId) {
        return Receta.builder()
                .id(id).autorId(autorId)
                .titulo("Paella valenciana").descripcion("Receta tradicional")
                .tiempoEstimado(60).dificultad("Difícil").categoria("Arroces")
                .etiquetas(new ArrayList<>()).estado("borrador")
                .build();
    }

    private RecetaRequestDTO request(String titulo) {
        return new RecetaRequestDTO(titulo, "Descripción", 30, "Fácil", "Pasta", List.of(), null, null);
    }

    private IngredienteReceta ingrediente(String id, String recetaId) {
        return IngredienteReceta.builder().id(id).recetaId(recetaId)
                .nombre("Arroz").cantidad(200).unidad("g").build();
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
                "Paella", "Descripción", 30, "Fácil", "Pasta", List.of(), null, 6);

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
                recetaService.crearReceta("user-1", new RecetaRequestDTO("", "desc", 30, "Fácil", "Pasta", List.of(), null, null)))
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
}
