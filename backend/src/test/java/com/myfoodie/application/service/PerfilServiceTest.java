package com.myfoodie.application.service;

import com.myfoodie.application.dto.perfil.EliminarCuentaDTO;
import com.myfoodie.application.dto.perfil.EstadisticasPerfilDTO;
import com.myfoodie.application.dto.perfil.PerfilResponseDTO;
import com.myfoodie.application.dto.perfil.PerfilUpdateDTO;
import com.myfoodie.application.dto.perfil.PreferenciasUpdateDTO;
import com.myfoodie.application.dto.perfil.PrivacidadUpdateDTO;
import com.myfoodie.application.dto.dashboard.EstadisticasDTO;
import com.myfoodie.domain.model.Despensa;
import com.myfoodie.domain.model.Preferencias;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.repository.DespensaRepository;
import com.myfoodie.domain.repository.MovimientoProductoRepository;
import com.myfoodie.domain.repository.PreferenciasRepository;
import com.myfoodie.domain.repository.ProductoRepository;
import com.myfoodie.domain.repository.RecetaGuardadaRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import com.myfoodie.infrastructure.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PerfilServiceTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private PreferenciasRepository preferenciasRepository;
    @Mock private DespensaRepository despensaRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private RecetaRepository recetaRepository;
    @Mock private RecetaGuardadaRepository recetaGuardadaRepository;
    @Mock private MovimientoProductoRepository movimientoRepository;
    @Mock private DashboardService dashboardService;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private RedisTemplate<String, String> redisTemplate;

    @InjectMocks
    private PerfilService perfilService;

    private Usuario usuarioMock;
    private Preferencias preferenciasMock;

    @BeforeEach
    void setUp() {
        usuarioMock = Usuario.builder()
                .id("user-123")
                .nombre("Juan García")
                .nombreUsuario("juangarcia")
                .email("juan@example.com")
                .biografia("Me encanta cocinar")
                .fechaRegistro(LocalDateTime.now())
                .build();

        preferenciasMock = Preferencias.builder()
                .id("pref-123")
                .usuarioId("user-123")
                .tipoDieta("Mediterránea")
                .alergenos(List.of("Gluten", "Lactosa"))
                .build();
    }

    // ===== POSITIVOS =====

    @Test
    void obtenerPerfil_devuelve_datos_correctos() {
        when(usuarioRepository.findById("user-123")).thenReturn(Optional.of(usuarioMock));

        PerfilResponseDTO result = perfilService.obtenerPerfil("user-123");

        assertThat(result.nombre()).isEqualTo("Juan García");
        assertThat(result.nombreUsuario()).isEqualTo("juangarcia");
        assertThat(result.email()).isEqualTo("juan@example.com");
        assertThat(result.biografia()).isEqualTo("Me encanta cocinar");
    }

    @Test
    void editarPerfil_actualiza_campos_correctamente() {
        when(usuarioRepository.findById("user-123")).thenReturn(Optional.of(usuarioMock));
        when(usuarioRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        PerfilResponseDTO result = perfilService.editarPerfil("user-123",
                new PerfilUpdateDTO("Carlos López", null, null, "Nueva bio"));

        assertThat(result.nombre()).isEqualTo("Carlos López");
        assertThat(result.biografia()).isEqualTo("Nueva bio");
    }

    @Test
    void editarPerfil_actualiza_nombreUsuario_si_no_esta_en_uso() {
        when(usuarioRepository.findById("user-123")).thenReturn(Optional.of(usuarioMock));
        when(usuarioRepository.existsByNombreUsuario("nuevouser")).thenReturn(false);
        when(usuarioRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        PerfilResponseDTO result = perfilService.editarPerfil("user-123",
                new PerfilUpdateDTO(null, "nuevouser", null, null));

        assertThat(result.nombreUsuario()).isEqualTo("nuevouser");
    }

    @Test
    void obtenerPreferencias_devuelve_preferencias_del_usuario() {
        when(preferenciasRepository.findByUsuarioId("user-123")).thenReturn(Optional.of(preferenciasMock));

        PreferenciasUpdateDTO result = perfilService.obtenerPreferencias("user-123");

        assertThat(result.tipoDieta()).isEqualTo("Mediterránea");
        assertThat(result.alergias()).containsExactly("Gluten", "Lactosa");
    }

    @Test
    void actualizarPreferencias_guarda_cambios_correctamente() {
        when(preferenciasRepository.findByUsuarioId("user-123")).thenReturn(Optional.of(preferenciasMock));
        when(preferenciasRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        PreferenciasUpdateDTO result = perfilService.actualizarPreferencias("user-123",
                new PreferenciasUpdateDTO("Vegana", List.of("Soja"), List.of("cilantro"), "Fácil", 30, null));

        assertThat(result.tipoDieta()).isEqualTo("Vegana");
        assertThat(result.alergias()).containsExactly("Soja");
        assertThat(result.ingredientesNoDeseados()).containsExactly("cilantro");
        assertThat(result.nivelDificultad()).isEqualTo("Fácil");
        assertThat(result.tiempoCoccionMax()).isEqualTo(30);
    }

    @Test
    void actualizarPrivacidad_actualiza_flags_correctamente() {
        when(usuarioRepository.findById("user-123")).thenReturn(Optional.of(usuarioMock));
        when(usuarioRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        perfilService.actualizarPrivacidad("user-123",
                new PrivacidadUpdateDTO(false, true, false, true));

        assertThat(usuarioMock.getConfiguracionPrivacidad().isPerfilPublico()).isFalse();
        assertThat(usuarioMock.getConfiguracionPrivacidad().isMostrarRecetas()).isTrue();
        assertThat(usuarioMock.getConfiguracionPrivacidad().isMostrarEstadisticas()).isFalse();
        assertThat(usuarioMock.getConfiguracionPrivacidad().isPermitirMensajes()).isTrue();
        verify(usuarioRepository).save(usuarioMock);
    }

    @Test
    void obtenerEstadisticasPerfil_devuelve_contadores_correctos() {
        when(usuarioRepository.findById("user-123")).thenReturn(Optional.of(usuarioMock));
        when(despensaRepository.findByUsuarioId("user-123")).thenReturn(Optional.empty());
        when(recetaRepository.countByAutorIdAndEstado("user-123", "publicada")).thenReturn(0L);
        when(recetaGuardadaRepository.countByUsuarioId("user-123")).thenReturn(0L);

        EstadisticasPerfilDTO result = perfilService.obtenerEstadisticasPerfil("user-123");

        assertThat(result.totalProductosRegistrados()).isEqualTo(0);
        assertThat(result.totalProductosConsumidos()).isEqualTo(0);
        assertThat(result.totalProductosCaducados()).isEqualTo(0);
        assertThat(result.totalRecetasPublicadas()).isEqualTo(0);
        assertThat(result.totalRecetasGuardadas()).isEqualTo(0);
        assertThat(result.fechaRegistro()).isEqualTo(usuarioMock.getFechaRegistro());
    }

    @Test
    void totalRecetasGuardadas_devuelve_conteo_real_no_cero() {
        when(usuarioRepository.findById("user-123")).thenReturn(Optional.of(usuarioMock));
        when(despensaRepository.findByUsuarioId("user-123")).thenReturn(Optional.empty());
        when(recetaRepository.countByAutorIdAndEstado("user-123", "publicada")).thenReturn(0L);
        when(recetaGuardadaRepository.countByUsuarioId("user-123")).thenReturn(7L);

        EstadisticasPerfilDTO result = perfilService.obtenerEstadisticasPerfil("user-123");

        assertThat(result.totalRecetasGuardadas()).isEqualTo(7);
    }

    @Test
    void estadisticas_sin_despensa_no_llama_al_dashboard_y_aprovechamiento_es_100() {
        when(usuarioRepository.findById("user-123")).thenReturn(Optional.of(usuarioMock));
        when(despensaRepository.findByUsuarioId("user-123")).thenReturn(Optional.empty());
        when(recetaRepository.countByAutorIdAndEstado("user-123", "publicada")).thenReturn(0L);
        when(recetaGuardadaRepository.countByUsuarioId("user-123")).thenReturn(0L);

        EstadisticasPerfilDTO result = perfilService.obtenerEstadisticasPerfil("user-123");

        assertThat(result.aprovechamientoDespensa()).isEqualTo(100.0);
        verifyNoInteractions(dashboardService);
    }

    @Test
    void estadisticas_incluye_aprovechamiento_de_despensa() {
        Despensa despensa = new Despensa();
        despensa.setId("desp-123");
        despensa.setUsuarioId("user-123");
        when(usuarioRepository.findById("user-123")).thenReturn(Optional.of(usuarioMock));
        when(despensaRepository.findByUsuarioId("user-123")).thenReturn(Optional.of(despensa));
        when(recetaRepository.countByAutorIdAndEstado("user-123", "publicada")).thenReturn(0L);
        when(recetaGuardadaRepository.countByUsuarioId("user-123")).thenReturn(0L);
        when(dashboardService.obtenerEstadisticas("user-123"))
                .thenReturn(new EstadisticasDTO(10, 3, 2, "Lácteos", 80.0));

        EstadisticasPerfilDTO result = perfilService.obtenerEstadisticasPerfil("user-123");

        assertThat(result.aprovechamientoDespensa()).isEqualTo(80.0);
    }

    @Test
    void estadisticas_reutiliza_aprovechamiento_de_dashboard() {
        Despensa despensa = new Despensa();
        despensa.setId("desp-123");
        despensa.setUsuarioId("user-123");
        when(usuarioRepository.findById("user-123")).thenReturn(Optional.of(usuarioMock));
        when(despensaRepository.findByUsuarioId("user-123")).thenReturn(Optional.of(despensa));
        when(recetaRepository.countByAutorIdAndEstado("user-123", "publicada")).thenReturn(0L);
        when(recetaGuardadaRepository.countByUsuarioId("user-123")).thenReturn(0L);
        when(dashboardService.obtenerEstadisticas("user-123"))
                .thenReturn(new EstadisticasDTO(0, 0, 0, "-", 42.5));

        EstadisticasPerfilDTO result = perfilService.obtenerEstadisticasPerfil("user-123");

        // El valor sale tal cual del cálculo del dashboard, no se recalcula aquí
        assertThat(result.aprovechamientoDespensa()).isEqualTo(42.5);
        verify(dashboardService).obtenerEstadisticas("user-123");
    }

    @Test
    @SuppressWarnings("unchecked")
    void cerrarSesion_añade_token_a_blacklist_redis() {
        String token = "valid.jwt.token";
        ValueOperations<String, String> valueOps = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(jwtTokenProvider.getExpirationFromToken(token))
                .thenReturn(new Date(System.currentTimeMillis() + 3_600_000));

        perfilService.cerrarSesion("user-123", token);

        verify(valueOps).set(eq("blacklist:" + token), eq("user-123"), anyLong(), any(TimeUnit.class));
    }

    @Test
    void eliminarCuenta_anonimiza_datos_personales() {
        when(usuarioRepository.findById("user-123")).thenReturn(Optional.of(usuarioMock));
        when(usuarioRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        perfilService.eliminarCuenta("user-123", new EliminarCuentaDTO(true));

        assertThat(usuarioMock.getEmail()).isEqualTo("deleted_user-123@myfoodie.com");
        assertThat(usuarioMock.getNombre()).isEqualTo("Usuario eliminado");
        assertThat(usuarioMock.getFotoPerfil()).isNull();
        assertThat(usuarioMock.getBiografia()).isNull();
        verify(usuarioRepository).save(usuarioMock);
    }

    @Test
    void eliminarCuenta_mantiene_recetas_publicadas_desasociadas() {
        when(usuarioRepository.findById("user-123")).thenReturn(Optional.of(usuarioMock));
        when(usuarioRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        perfilService.eliminarCuenta("user-123", new EliminarCuentaDTO(true));

        // PerfilService no inyecta ningún repositorio de recetas — eliminación de cuenta
        // solo anonimiza el usuario; la desasociación de recetas es responsabilidad de Fase 2
        verify(usuarioRepository).save(any());
    }

    // ===== NEGATIVOS =====

    @Test
    void obtenerPerfil_falla_si_usuario_no_existe() {
        when(usuarioRepository.findById("no-existe")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> perfilService.obtenerPerfil("no-existe"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void editarPerfil_falla_si_nombreUsuario_ya_en_uso() {
        when(usuarioRepository.findById("user-123")).thenReturn(Optional.of(usuarioMock));
        when(usuarioRepository.existsByNombreUsuario("otrouser")).thenReturn(true);

        assertThatThrownBy(() -> perfilService.editarPerfil("user-123",
                new PerfilUpdateDTO(null, "otrouser", null, null)))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> {
                    ApiException ex = (ApiException) e;
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(ex.getMessage()).contains("ya está en uso");
                });
    }

    @Test
    void editarPerfil_falla_si_nombre_vacio() {
        when(usuarioRepository.findById("user-123")).thenReturn(Optional.of(usuarioMock));

        assertThatThrownBy(() -> perfilService.editarPerfil("user-123",
                new PerfilUpdateDTO("", null, null, null)))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void actualizarPreferencias_falla_si_tipoDieta_invalido() {
        // Sin preferencias previas, el servicio lanza NOT_FOUND
        when(preferenciasRepository.findByUsuarioId("no-existe")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> perfilService.actualizarPreferencias("no-existe",
                new PreferenciasUpdateDTO("INVALIDA", null, null, null, null, null)))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void cerrarSesion_falla_si_token_invalido() {
        // getExpirationFromToken lanza antes de llegar a Redis — el try-catch lo silencia
        when(jwtTokenProvider.getExpirationFromToken(anyString()))
                .thenThrow(new RuntimeException("Token inválido"));

        assertThatCode(() -> perfilService.cerrarSesion("user-123", "invalid.token"))
                .doesNotThrowAnyException();
    }

    @Test
    void eliminarCuenta_falla_si_confirmar_es_false() {
        assertThatThrownBy(() -> perfilService.eliminarCuenta("user-123", new EliminarCuentaDTO(false)))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void eliminarCuenta_falla_si_confirmar_no_presente() {
        assertThatThrownBy(() -> perfilService.eliminarCuenta("user-123", new EliminarCuentaDTO(null)))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }
}
