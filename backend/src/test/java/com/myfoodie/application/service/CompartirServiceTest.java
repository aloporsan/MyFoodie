package com.myfoodie.application.service;

import com.myfoodie.application.dto.compartir.CompartirRecetaRequestDTO;
import com.myfoodie.application.dto.compartir.IngredienteFaltanteResponseDTO;
import com.myfoodie.application.dto.compartir.RecetaCompartidaResponseDTO;
import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import com.myfoodie.application.dto.receta.RecetaResponseDTO;
import com.myfoodie.domain.model.Privacidad;
import com.myfoodie.domain.model.RecetaCompartida;
import com.myfoodie.domain.model.Seguimiento;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.repository.BloqueoRepository;
import com.myfoodie.domain.repository.RecetaCompartidaRepository;
import com.myfoodie.domain.repository.SeguimientoRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompartirServiceTest {

    @Mock private RecetaCompartidaRepository recetaCompartidaRepository;
    @Mock private BloqueoRepository bloqueoRepository;
    @Mock private SeguimientoRepository seguimientoRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private RecetaService recetaService;
    @Mock private DespensaService despensaService;
    @Mock private NotificacionService notificacionService;

    @InjectMocks
    private CompartirService compartirService;

    private Usuario emisor;
    private Usuario receptorPublico;

    @BeforeEach
    void setUp() {
        emisor = Usuario.builder()
                .id("emisor-1")
                .nombre("Emisor Uno")
                .nombreUsuario("emisoruno")
                .fotoPerfil("foto.jpg")
                .build();
        receptorPublico = Usuario.builder()
                .id("receptor-1")
                .nombre("Receptor Uno")
                .nombreUsuario("receptoruno")
                .privacidad(Privacidad.PUBLICA)
                .build();
    }

    private RecetaResponseDTO recetaResponse(String id, String estado,
                                              List<RecetaResponseDTO.IngredienteResponseDTO> ingredientes) {
        return new RecetaResponseDTO(
                id, "autor-1", "Autor Uno", "autoruno", "Título", "Descripción",
                20, "facil", "entrante", List.of(), null, estado, 2,
                ingredientes, List.of(), LocalDateTime.now(), LocalDateTime.now());
    }

    private ProductoResponseDTO productoDespensa(String nombre) {
        return new ProductoResponseDTO(
                "p-1", "desp-1", nombre, 1, "unidades", null, null, null, null, null, null,
                null, false, "normal", null, null, null, null, null, null, null);
    }

    // ===== POSITIVOS =====

    @Test
    void compartirReceta_crea_recetaCompartida_por_cada_receptor() {
        CompartirRecetaRequestDTO dto = new CompartirRecetaRequestDTO(List.of("receptor-1"), null);
        when(recetaService.obtenerReceta("receta-1", "emisor-1"))
                .thenReturn(recetaResponse("receta-1", "publicada", List.of()));
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(anyString(), anyString())).thenReturn(false);
        when(recetaCompartidaRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(usuarioRepository.findById("emisor-1")).thenReturn(Optional.of(emisor));
        when(usuarioRepository.findById("receptor-1")).thenReturn(Optional.of(receptorPublico));

        List<RecetaCompartidaResponseDTO> resultado = compartirService.compartirReceta("emisor-1", "receta-1", dto);

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).emisor().nombreUsuario()).isEqualTo("emisoruno");
        assertThat(resultado.get(0).leida()).isFalse();

        ArgumentCaptor<RecetaCompartida> captor = ArgumentCaptor.forClass(RecetaCompartida.class);
        verify(recetaCompartidaRepository).save(captor.capture());
        assertThat(captor.getValue().getReceptorId()).isEqualTo("receptor-1");
        assertThat(captor.getValue().getEmisorId()).isEqualTo("emisor-1");
        assertThat(captor.getValue().getRecetaId()).isEqualTo("receta-1");
    }

    @Test
    void compartirReceta_con_mensaje_guarda_mensaje_correctamente() {
        CompartirRecetaRequestDTO dto = new CompartirRecetaRequestDTO(List.of("receptor-1"), "Prueba esta receta");
        when(recetaService.obtenerReceta("receta-1", "emisor-1"))
                .thenReturn(recetaResponse("receta-1", "publicada", List.of()));
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(anyString(), anyString())).thenReturn(false);
        when(recetaCompartidaRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(usuarioRepository.findById("emisor-1")).thenReturn(Optional.of(emisor));
        when(usuarioRepository.findById("receptor-1")).thenReturn(Optional.of(receptorPublico));

        List<RecetaCompartidaResponseDTO> resultado = compartirService.compartirReceta("emisor-1", "receta-1", dto);

        assertThat(resultado.get(0).mensaje()).isEqualTo("Prueba esta receta");
    }

    @Test
    void compartirReceta_con_multiples_receptores_crea_multiples_registros() {
        CompartirRecetaRequestDTO dto = new CompartirRecetaRequestDTO(List.of("receptor-1", "receptor-2"), null);
        when(recetaService.obtenerReceta("receta-1", "emisor-1"))
                .thenReturn(recetaResponse("receta-1", "publicada", List.of()));
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(anyString(), anyString())).thenReturn(false);
        when(recetaCompartidaRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(usuarioRepository.findById("emisor-1")).thenReturn(Optional.of(emisor));
        when(usuarioRepository.findById("receptor-1")).thenReturn(Optional.of(receptorPublico));
        when(usuarioRepository.findById("receptor-2")).thenReturn(Optional.of(
                Usuario.builder().id("receptor-2").nombre("Receptor Dos").nombreUsuario("receptordos")
                        .privacidad(Privacidad.PUBLICA).build()));

        List<RecetaCompartidaResponseDTO> resultado = compartirService.compartirReceta("emisor-1", "receta-1", dto);

        assertThat(resultado).hasSize(2);
        verify(recetaCompartidaRepository, times(2)).save(any());
    }

    @Test
    void obtenerRecibidas_devuelve_recetas_con_datos_completos() {
        RecetaCompartida compartida = RecetaCompartida.builder()
                .id("comp-1").emisorId("emisor-1").receptorId("receptor-1").recetaId("receta-1")
                .mensaje("Hola").leida(false).createdAt(LocalDateTime.now()).build();
        when(recetaCompartidaRepository.findByReceptorIdOrderByCreatedAtDesc("receptor-1"))
                .thenReturn(List.of(compartida));
        when(usuarioRepository.findById("emisor-1")).thenReturn(Optional.of(emisor));
        when(recetaService.obtenerReceta("receta-1", "receptor-1"))
                .thenReturn(recetaResponse("receta-1", "publicada", List.of()));

        List<RecetaCompartidaResponseDTO> resultado = compartirService.obtenerRecetasRecibidas("receptor-1");

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).emisor().nombre()).isEqualTo("Emisor Uno");
        assertThat(resultado.get(0).receta().id()).isEqualTo("receta-1");
        assertThat(resultado.get(0).mensaje()).isEqualTo("Hola");
    }

    @Test
    void obtenerRecibidas_ordena_por_fecha_descendente() {
        RecetaCompartida masReciente = RecetaCompartida.builder()
                .id("comp-2").emisorId("emisor-1").receptorId("receptor-1").recetaId("receta-1")
                .leida(false).createdAt(LocalDateTime.now()).build();
        RecetaCompartida masAntigua = RecetaCompartida.builder()
                .id("comp-1").emisorId("emisor-1").receptorId("receptor-1").recetaId("receta-1")
                .leida(false).createdAt(LocalDateTime.now().minusDays(1)).build();
        when(recetaCompartidaRepository.findByReceptorIdOrderByCreatedAtDesc("receptor-1"))
                .thenReturn(List.of(masReciente, masAntigua));
        when(usuarioRepository.findById("emisor-1")).thenReturn(Optional.of(emisor));
        when(recetaService.obtenerReceta("receta-1", "receptor-1"))
                .thenReturn(recetaResponse("receta-1", "publicada", List.of()));

        List<RecetaCompartidaResponseDTO> resultado = compartirService.obtenerRecetasRecibidas("receptor-1");

        assertThat(resultado).extracting(RecetaCompartidaResponseDTO::id).containsExactly("comp-2", "comp-1");
    }

    @Test
    void marcarComoLeida_actualiza_campo_leida() {
        RecetaCompartida compartida = RecetaCompartida.builder()
                .id("comp-1").emisorId("emisor-1").receptorId("receptor-1").recetaId("receta-1")
                .leida(false).build();
        when(recetaCompartidaRepository.findById("comp-1")).thenReturn(Optional.of(compartida));

        compartirService.marcarComoLeida("receptor-1", "comp-1");

        assertThat(compartida.getLeida()).isTrue();
        verify(recetaCompartidaRepository).save(compartida);
    }

    @Test
    void guardarRecetaCompartida_añade_a_recetasGuardadas() {
        RecetaCompartida compartida = RecetaCompartida.builder()
                .id("comp-1").emisorId("emisor-1").receptorId("receptor-1").recetaId("receta-1")
                .leida(false).build();
        when(recetaCompartidaRepository.findById("comp-1")).thenReturn(Optional.of(compartida));

        compartirService.guardarRecetaCompartida("receptor-1", "comp-1");

        verify(recetaService).guardarReceta("receptor-1", "receta-1");
    }

    @Test
    void guardarRecetaCompartida_marca_como_leida_automaticamente() {
        RecetaCompartida compartida = RecetaCompartida.builder()
                .id("comp-1").emisorId("emisor-1").receptorId("receptor-1").recetaId("receta-1")
                .leida(false).build();
        when(recetaCompartidaRepository.findById("comp-1")).thenReturn(Optional.of(compartida));

        compartirService.guardarRecetaCompartida("receptor-1", "comp-1");

        assertThat(compartida.getLeida()).isTrue();
        verify(recetaCompartidaRepository).save(compartida);
    }

    @Test
    void obtenerContador_devuelve_numero_correcto_de_no_leidas() {
        when(recetaCompartidaRepository.countByReceptorIdAndLeidaFalse("receptor-1")).thenReturn(3L);

        long resultado = compartirService.obtenerContadorNoLeidas("receptor-1");

        assertThat(resultado).isEqualTo(3L);
    }

    @Test
    void obtenerIngredientesFaltantes_compara_con_despensa() {
        RecetaCompartida compartida = RecetaCompartida.builder()
                .id("comp-1").emisorId("emisor-1").receptorId("receptor-1").recetaId("receta-1")
                .leida(false).build();
        when(recetaCompartidaRepository.findById("comp-1")).thenReturn(Optional.of(compartida));

        List<RecetaResponseDTO.IngredienteResponseDTO> ingredientes = List.of(
                new RecetaResponseDTO.IngredienteResponseDTO("ing-1", "Tomate", 2, "unidades", null),
                new RecetaResponseDTO.IngredienteResponseDTO("ing-2", "Pasta", 1, "kg", null));
        when(recetaService.obtenerReceta("receta-1", "receptor-1"))
                .thenReturn(recetaResponse("receta-1", "publicada", ingredientes));
        when(despensaService.listarProductos("receptor-1")).thenReturn(List.of(productoDespensa("TOMATE")));

        List<IngredienteFaltanteResponseDTO> resultado =
                compartirService.obtenerIngredientesFaltantes("receptor-1", "comp-1");

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).nombre()).isEqualTo("Pasta");
    }

    // ===== NEGATIVOS =====

    @Test
    void compartirReceta_falla_si_receta_no_publicada() {
        CompartirRecetaRequestDTO dto = new CompartirRecetaRequestDTO(List.of("receptor-1"), null);
        when(recetaService.obtenerReceta("receta-1", "emisor-1"))
                .thenReturn(recetaResponse("receta-1", "borrador", List.of()));

        assertThatThrownBy(() -> compartirService.compartirReceta("emisor-1", "receta-1", dto))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

        verify(recetaCompartidaRepository, never()).save(any());
    }

    @Test
    void compartirReceta_falla_si_sin_receptores() {
        CompartirRecetaRequestDTO dto = new CompartirRecetaRequestDTO(List.of(), null);

        assertThatThrownBy(() -> compartirService.compartirReceta("emisor-1", "receta-1", dto))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

        verify(recetaCompartidaRepository, never()).save(any());
    }

    @Test
    void compartirReceta_falla_si_consigo_mismo() {
        CompartirRecetaRequestDTO dto = new CompartirRecetaRequestDTO(List.of("emisor-1"), null);
        when(recetaService.obtenerReceta("receta-1", "emisor-1"))
                .thenReturn(recetaResponse("receta-1", "publicada", List.of()));

        assertThatThrownBy(() -> compartirService.compartirReceta("emisor-1", "receta-1", dto))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

        verify(recetaCompartidaRepository, never()).save(any());
    }

    @Test
    void compartirReceta_falla_si_mas_de_10_receptores() {
        List<String> receptores = List.of("r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "r9", "r10", "r11");
        CompartirRecetaRequestDTO dto = new CompartirRecetaRequestDTO(receptores, null);

        assertThatThrownBy(() -> compartirService.compartirReceta("emisor-1", "receta-1", dto))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

        verify(recetaCompartidaRepository, never()).save(any());
    }

    @Test
    void compartirReceta_falla_si_receptor_bloqueado() {
        CompartirRecetaRequestDTO dto = new CompartirRecetaRequestDTO(List.of("receptor-1"), null);
        when(recetaService.obtenerReceta("receta-1", "emisor-1"))
                .thenReturn(recetaResponse("receta-1", "publicada", List.of()));
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId("emisor-1", "receptor-1")).thenReturn(true);

        assertThatThrownBy(() -> compartirService.compartirReceta("emisor-1", "receta-1", dto))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        verify(recetaCompartidaRepository, never()).save(any());
    }

    // ===== RF-SOC-009 — privacidad y bloqueos =====

    @Test
    void compartirReceta_falla_si_receptor_tiene_perfil_privado_y_no_es_seguidor() {
        CompartirRecetaRequestDTO dto = new CompartirRecetaRequestDTO(List.of("receptor-1"), null);
        Usuario receptorPrivado = Usuario.builder()
                .id("receptor-1").nombre("Receptor Privado").nombreUsuario("receptorprivado")
                .privacidad(Privacidad.PRIVADA).build();

        when(recetaService.obtenerReceta("receta-1", "emisor-1"))
                .thenReturn(recetaResponse("receta-1", "publicada", List.of()));
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(anyString(), anyString())).thenReturn(false);
        when(usuarioRepository.findById("receptor-1")).thenReturn(Optional.of(receptorPrivado));
        when(seguimientoRepository.findBySeguidorIdAndSeguidoId("emisor-1", "receptor-1"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> compartirService.compartirReceta("emisor-1", "receta-1", dto))
                .isInstanceOf(ApiException.class)
                .hasMessage("No puedes enviar recetas a este usuario porque su perfil es privado")
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        verify(recetaCompartidaRepository, never()).save(any());
    }

    @Test
    void compartirReceta_exitoso_si_receptor_privado_y_es_seguidor_confirmado() {
        CompartirRecetaRequestDTO dto = new CompartirRecetaRequestDTO(List.of("receptor-1"), null);
        Usuario receptorPrivado = Usuario.builder()
                .id("receptor-1").nombre("Receptor Privado").nombreUsuario("receptorprivado")
                .privacidad(Privacidad.PRIVADA).build();
        Seguimiento seguimientoAceptado = Seguimiento.builder()
                .id("seg-1").seguidorId("emisor-1").seguidoId("receptor-1").estado("aceptado").build();

        when(recetaService.obtenerReceta("receta-1", "emisor-1"))
                .thenReturn(recetaResponse("receta-1", "publicada", List.of()));
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(anyString(), anyString())).thenReturn(false);
        when(usuarioRepository.findById("receptor-1")).thenReturn(Optional.of(receptorPrivado));
        when(seguimientoRepository.findBySeguidorIdAndSeguidoId("emisor-1", "receptor-1"))
                .thenReturn(Optional.of(seguimientoAceptado));
        when(recetaCompartidaRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(usuarioRepository.findById("emisor-1")).thenReturn(Optional.of(emisor));

        List<RecetaCompartidaResponseDTO> resultado = compartirService.compartirReceta("emisor-1", "receta-1", dto);

        assertThat(resultado).hasSize(1);
        verify(recetaCompartidaRepository).save(any());
    }

    @Test
    void compartirReceta_falla_si_existe_bloqueo_del_receptor_al_emisor() {
        CompartirRecetaRequestDTO dto = new CompartirRecetaRequestDTO(List.of("receptor-1"), null);
        when(recetaService.obtenerReceta("receta-1", "emisor-1"))
                .thenReturn(recetaResponse("receta-1", "publicada", List.of()));
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId("emisor-1", "receptor-1")).thenReturn(false);
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId("receptor-1", "emisor-1")).thenReturn(true);

        assertThatThrownBy(() -> compartirService.compartirReceta("emisor-1", "receta-1", dto))
                .isInstanceOf(ApiException.class)
                .hasMessage("No puedes interactuar con este usuario")
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        verify(recetaCompartidaRepository, never()).save(any());
    }

    @Test
    void compartirReceta_falla_si_existe_bloqueo_del_emisor_al_receptor() {
        CompartirRecetaRequestDTO dto = new CompartirRecetaRequestDTO(List.of("receptor-1"), null);
        when(recetaService.obtenerReceta("receta-1", "emisor-1"))
                .thenReturn(recetaResponse("receta-1", "publicada", List.of()));
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId("emisor-1", "receptor-1")).thenReturn(true);

        assertThatThrownBy(() -> compartirService.compartirReceta("emisor-1", "receta-1", dto))
                .isInstanceOf(ApiException.class)
                .hasMessage("No puedes interactuar con este usuario")
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        verify(recetaCompartidaRepository, never()).save(any());
    }

    @Test
    void compartirReceta_falla_si_mensaje_supera_200_caracteres() {
        String mensajeLargo = "a".repeat(201);
        CompartirRecetaRequestDTO dto = new CompartirRecetaRequestDTO(List.of("receptor-1"), mensajeLargo);

        assertThatThrownBy(() -> compartirService.compartirReceta("emisor-1", "receta-1", dto))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

        verify(recetaCompartidaRepository, never()).save(any());
    }

    @Test
    void marcarComoLeida_falla_si_no_es_receptor() {
        RecetaCompartida compartida = RecetaCompartida.builder()
                .id("comp-1").emisorId("emisor-1").receptorId("receptor-1").recetaId("receta-1")
                .leida(false).build();
        when(recetaCompartidaRepository.findById("comp-1")).thenReturn(Optional.of(compartida));

        assertThatThrownBy(() -> compartirService.marcarComoLeida("otro-usuario", "comp-1"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        verify(recetaCompartidaRepository, never()).save(any());
    }
}
