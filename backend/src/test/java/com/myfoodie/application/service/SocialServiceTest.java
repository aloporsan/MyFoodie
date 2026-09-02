package com.myfoodie.application.service;

import com.myfoodie.application.dto.social.PerfilPublicoResponseDTO;
import com.myfoodie.application.dto.social.SeguimientoResponseDTO;
import com.myfoodie.application.dto.social.UsuarioBusquedaResponseDTO;
import com.myfoodie.domain.model.Bloqueo;
import com.myfoodie.domain.model.Privacidad;
import com.myfoodie.domain.model.Seguimiento;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.repository.BloqueoRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import com.myfoodie.domain.repository.SeguimientoRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SocialServiceTest {

    @Mock private SeguimientoRepository seguimientoRepository;
    @Mock private BloqueoRepository bloqueoRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private RecetaRepository recetaRepository;
    @Mock private NotificacionService notificacionService;
    @Mock private InteraccionSocialService interaccionSocialService;

    @InjectMocks
    private SocialService socialService;

    private Usuario usuarioPublico;
    private Usuario usuarioPrivado;

    @BeforeEach
    void setUp() {
        usuarioPublico = Usuario.builder()
                .id("seguido-1")
                .nombre("Ana Pública")
                .nombreUsuario("anapublica")
                .privacidad(Privacidad.PUBLICA)
                .build();

        usuarioPrivado = Usuario.builder()
                .id("privado-1")
                .nombre("Bruno Privado")
                .nombreUsuario("brunoprivado")
                .privacidad(Privacidad.PRIVADA)
                .build();
    }

    // ===== POSITIVOS =====

    @Test
    void seguirUsuario_crea_seguimiento_aceptado_si_perfil_publico() {
        when(usuarioRepository.findById("seguido-1")).thenReturn(Optional.of(usuarioPublico));
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(anyString(), anyString())).thenReturn(false);
        when(seguimientoRepository.findBySeguidorIdAndSeguidoId("seguidor-1", "seguido-1"))
                .thenReturn(Optional.empty());
        when(seguimientoRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        SeguimientoResponseDTO result = socialService.seguirUsuario("seguidor-1", "seguido-1");

        assertThat(result.estado()).isEqualTo("aceptado");
        assertThat(result.usuarioId()).isEqualTo("seguido-1");
    }

    @Test
    void seguirUsuario_crea_notificacion_nuevo_seguidor() {
        when(usuarioRepository.findById("seguido-1")).thenReturn(Optional.of(usuarioPublico));
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(anyString(), anyString())).thenReturn(false);
        when(seguimientoRepository.findBySeguidorIdAndSeguidoId("seguidor-1", "seguido-1"))
                .thenReturn(Optional.empty());
        when(seguimientoRepository.save(any())).thenAnswer(i -> {
            Seguimiento s = i.getArgument(0);
            s.setId("seg-1");
            return s;
        });

        socialService.seguirUsuario("seguidor-1", "seguido-1");

        verify(notificacionService).crearNotificacion("seguido-1", "nuevo_seguidor", "seguidor-1", "seg-1", "seguimiento");
    }

    @Test
    void seguirUsuario_crea_seguimiento_pendiente_si_perfil_privado() {
        when(usuarioRepository.findById("privado-1")).thenReturn(Optional.of(usuarioPrivado));
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(anyString(), anyString())).thenReturn(false);
        when(seguimientoRepository.findBySeguidorIdAndSeguidoId("seguidor-1", "privado-1"))
                .thenReturn(Optional.empty());
        when(seguimientoRepository.save(any())).thenAnswer(i -> {
            Seguimiento s = i.getArgument(0);
            s.setId("seg-1");
            return s;
        });

        SeguimientoResponseDTO result = socialService.seguirUsuario("seguidor-1", "privado-1");

        assertThat(result.estado()).isEqualTo("pendiente");
        verify(notificacionService).crearNotificacion("privado-1", "solicitud_seguimiento", "seguidor-1", "seg-1", "seguimiento");
    }

    @Test
    void dejarDeSeguir_elimina_seguimiento_correctamente() {
        Seguimiento seguimiento = Seguimiento.builder()
                .id("seg-1").seguidorId("seguidor-1").seguidoId("seguido-1").estado("aceptado").build();
        when(seguimientoRepository.findBySeguidorIdAndSeguidoId("seguidor-1", "seguido-1"))
                .thenReturn(Optional.of(seguimiento));

        socialService.dejarDeSeguir("seguidor-1", "seguido-1");

        verify(seguimientoRepository).delete(seguimiento);
    }

    @Test
    void aceptarSolicitud_cambia_estado_a_aceptado() {
        Seguimiento seguimiento = Seguimiento.builder()
                .id("seg-1").seguidorId("seguidor-1").seguidoId("privado-1").estado("pendiente").build();
        when(seguimientoRepository.findBySeguidorIdAndSeguidoId("seguidor-1", "privado-1"))
                .thenReturn(Optional.of(seguimiento));
        when(seguimientoRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(usuarioRepository.findById("seguidor-1")).thenReturn(Optional.of(usuarioPublico));

        SeguimientoResponseDTO result = socialService.aceptarSolicitud("privado-1", "seguidor-1");

        assertThat(result.estado()).isEqualTo("aceptado");
        assertThat(seguimiento.getEstado()).isEqualTo("aceptado");
    }

    @Test
    void rechazarSolicitud_elimina_solicitud() {
        Seguimiento seguimiento = Seguimiento.builder()
                .id("seg-1").seguidorId("seguidor-1").seguidoId("privado-1").estado("pendiente").build();
        when(seguimientoRepository.findBySeguidorIdAndSeguidoId("seguidor-1", "privado-1"))
                .thenReturn(Optional.of(seguimiento));

        socialService.rechazarSolicitud("privado-1", "seguidor-1");

        verify(seguimientoRepository).delete(seguimiento);
    }

    @Test
    void obtenerSeguidores_devuelve_solo_aceptados() {
        Seguimiento seguimiento = Seguimiento.builder()
                .id("seg-1").seguidorId("seguido-1").seguidoId("usuario-x").estado("aceptado").build();
        when(seguimientoRepository.findBySeguidoIdAndEstado("usuario-x", "aceptado"))
                .thenReturn(List.of(seguimiento));
        when(usuarioRepository.findById("seguido-1")).thenReturn(Optional.of(usuarioPublico));

        List<SeguimientoResponseDTO> result = socialService.obtenerSeguidores("usuario-x");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).estado()).isEqualTo("aceptado");
        assertThat(result.get(0).usuarioId()).isEqualTo("seguido-1");
        verify(seguimientoRepository, never()).findBySeguidoIdAndEstado("usuario-x", "pendiente");
    }

    @Test
    void obtenerSolicitudes_devuelve_solo_pendientes() {
        Seguimiento seguimiento = Seguimiento.builder()
                .id("seg-1").seguidorId("seguidor-1").seguidoId("privado-1").estado("pendiente").build();
        when(seguimientoRepository.findBySeguidoIdAndEstado("privado-1", "pendiente"))
                .thenReturn(List.of(seguimiento));
        when(usuarioRepository.findById("seguidor-1")).thenReturn(Optional.of(usuarioPublico));

        List<SeguimientoResponseDTO> result = socialService.obtenerSolicitudesPendientes("privado-1");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).estado()).isEqualTo("pendiente");
    }

    @Test
    void obtenerPerfilPublico_incluye_flags_esSeguido_y_haSolicitado() {
        Seguimiento seguimiento = Seguimiento.builder()
                .id("seg-1").seguidorId("visitante-1").seguidoId("seguido-1").estado("aceptado").build();

        when(usuarioRepository.findById("seguido-1")).thenReturn(Optional.of(usuarioPublico));
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(anyString(), anyString())).thenReturn(false);
        when(seguimientoRepository.findBySeguidorIdAndSeguidoId("visitante-1", "seguido-1"))
                .thenReturn(Optional.of(seguimiento));
        when(seguimientoRepository.countBySeguidoIdAndEstado("seguido-1", "aceptado")).thenReturn(3L);
        when(seguimientoRepository.countBySeguidorIdAndEstado("seguido-1", "aceptado")).thenReturn(5L);
        when(recetaRepository.countByAutorIdAndEstado("seguido-1", "publicada")).thenReturn(2L);

        PerfilPublicoResponseDTO result = socialService.obtenerPerfilPublico("seguido-1", "visitante-1");

        assertThat(result.esSeguido()).isTrue();
        assertThat(result.haSolicitado()).isFalse();
        assertThat(result.numSeguidores()).isEqualTo(3);
        assertThat(result.numSeguidos()).isEqualTo(5);
        assertThat(result.numRecetas()).isEqualTo(2);
        assertThat(result.privacidad()).isEqualTo(Privacidad.PUBLICA);
    }

    @Test
    void buscarUsuarios_devuelve_coincidencias_por_nombre() {
        when(usuarioRepository.findByNombreContainingIgnoreCaseOrNombreUsuarioContainingIgnoreCase("ana", "ana"))
                .thenReturn(List.of(usuarioPublico));
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(anyString(), anyString())).thenReturn(false);
        when(seguimientoRepository.findBySeguidorIdAndSeguidoId(anyString(), anyString())).thenReturn(Optional.empty());
        when(recetaRepository.countByAutorIdAndEstado(anyString(), anyString())).thenReturn(0L);

        List<UsuarioBusquedaResponseDTO> result = socialService.buscarUsuarios("ana", "buscador-1");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).nombreUsuario()).isEqualTo("anapublica");
    }

    @Test
    void buscarUsuarios_excluye_usuarios_bloqueados() {
        Usuario usuarioBloqueado = Usuario.builder()
                .id("bloqueado-1").nombre("Carla Bloqueada").nombreUsuario("carlabloqueada")
                .privacidad(Privacidad.PUBLICA).build();

        when(usuarioRepository.findByNombreContainingIgnoreCaseOrNombreUsuarioContainingIgnoreCase("car", "car"))
                .thenReturn(List.of(usuarioBloqueado, usuarioPublico));
        // hayBloqueoEntre hace cortocircuito con ||: si la primera comprobación ya da true,
        // no llega a consultar la dirección inversa
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId("buscador-1", "bloqueado-1")).thenReturn(true);
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId("buscador-1", "seguido-1")).thenReturn(false);
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId("seguido-1", "buscador-1")).thenReturn(false);
        when(seguimientoRepository.findBySeguidorIdAndSeguidoId(anyString(), anyString())).thenReturn(Optional.empty());
        when(recetaRepository.countByAutorIdAndEstado(anyString(), anyString())).thenReturn(0L);

        List<UsuarioBusquedaResponseDTO> result = socialService.buscarUsuarios("car", "buscador-1");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo("seguido-1");
    }

    @Test
    void buscarUsuarios_soloCompartibles_excluye_privados_no_seguidos() {
        when(usuarioRepository.findByNombreContainingIgnoreCaseOrNombreUsuarioContainingIgnoreCase("bru", "bru"))
                .thenReturn(List.of(usuarioPrivado));
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(anyString(), anyString())).thenReturn(false);
        when(seguimientoRepository.findBySeguidorIdAndSeguidoId("buscador-1", "privado-1"))
                .thenReturn(Optional.empty());

        List<UsuarioBusquedaResponseDTO> result = socialService.buscarUsuarios("bru", "buscador-1", true);

        assertThat(result).isEmpty();
    }

    @Test
    void buscarUsuarios_soloCompartibles_incluye_privados_seguidos_confirmados() {
        Seguimiento seguimientoAceptado = Seguimiento.builder()
                .id("seg-1").seguidorId("buscador-1").seguidoId("privado-1").estado("aceptado").build();

        when(usuarioRepository.findByNombreContainingIgnoreCaseOrNombreUsuarioContainingIgnoreCase("bru", "bru"))
                .thenReturn(List.of(usuarioPrivado));
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(anyString(), anyString())).thenReturn(false);
        when(seguimientoRepository.findBySeguidorIdAndSeguidoId("buscador-1", "privado-1"))
                .thenReturn(Optional.of(seguimientoAceptado));
        when(recetaRepository.countByAutorIdAndEstado(anyString(), anyString())).thenReturn(0L);

        List<UsuarioBusquedaResponseDTO> result = socialService.buscarUsuarios("bru", "buscador-1", true);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo("privado-1");
    }

    @Test
    void buscarUsuarios_sin_soloCompartibles_incluye_privados_no_seguidos() {
        when(usuarioRepository.findByNombreContainingIgnoreCaseOrNombreUsuarioContainingIgnoreCase("bru", "bru"))
                .thenReturn(List.of(usuarioPrivado));
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(anyString(), anyString())).thenReturn(false);
        when(seguimientoRepository.findBySeguidorIdAndSeguidoId(anyString(), anyString())).thenReturn(Optional.empty());
        when(recetaRepository.countByAutorIdAndEstado(anyString(), anyString())).thenReturn(0L);

        List<UsuarioBusquedaResponseDTO> result = socialService.buscarUsuarios("bru", "buscador-1");

        assertThat(result).hasSize(1);
    }

    @Test
    void bloquearUsuario_crea_bloqueo_y_elimina_seguimientos() {
        Seguimiento seguimientoIda = Seguimiento.builder()
                .id("seg-ida").seguidorId("bloqueador-1").seguidoId("bloqueado-1").estado("aceptado").build();
        Seguimiento seguimientoVuelta = Seguimiento.builder()
                .id("seg-vuelta").seguidorId("bloqueado-1").seguidoId("bloqueador-1").estado("aceptado").build();

        when(usuarioRepository.existsById("bloqueado-1")).thenReturn(true);
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId("bloqueador-1", "bloqueado-1")).thenReturn(false);
        when(seguimientoRepository.findBySeguidorIdAndSeguidoId("bloqueador-1", "bloqueado-1"))
                .thenReturn(Optional.of(seguimientoIda));
        when(seguimientoRepository.findBySeguidorIdAndSeguidoId("bloqueado-1", "bloqueador-1"))
                .thenReturn(Optional.of(seguimientoVuelta));

        socialService.bloquearUsuario("bloqueador-1", "bloqueado-1");

        verify(bloqueoRepository).save(any(Bloqueo.class));
        verify(seguimientoRepository).delete(seguimientoIda);
        verify(seguimientoRepository).delete(seguimientoVuelta);
    }

    @Test
    void desbloquearUsuario_elimina_bloqueo() {
        Bloqueo bloqueo = Bloqueo.builder().id("bloq-1").bloqueadorId("bloqueador-1").bloqueadoId("bloqueado-1").build();
        when(bloqueoRepository.findByBloqueadorIdAndBloqueadoId("bloqueador-1", "bloqueado-1"))
                .thenReturn(Optional.of(bloqueo));

        socialService.desbloquearUsuario("bloqueador-1", "bloqueado-1");

        verify(bloqueoRepository).delete(bloqueo);
    }

    // ===== NEGATIVOS =====

    @Test
    void seguirUsuario_falla_si_se_sigue_a_si_mismo() {
        assertThatThrownBy(() -> socialService.seguirUsuario("usuario-1", "usuario-1"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void seguirUsuario_falla_si_ya_sigue() {
        when(usuarioRepository.findById("seguido-1")).thenReturn(Optional.of(usuarioPublico));
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(anyString(), anyString())).thenReturn(false);
        when(seguimientoRepository.findBySeguidorIdAndSeguidoId("seguidor-1", "seguido-1"))
                .thenReturn(Optional.of(Seguimiento.builder().id("seg-1").estado("aceptado").build()));

        assertThatThrownBy(() -> socialService.seguirUsuario("seguidor-1", "seguido-1"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void seguirUsuario_falla_si_bloqueado() {
        when(usuarioRepository.findById("seguido-1")).thenReturn(Optional.of(usuarioPublico));
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId("seguidor-1", "seguido-1")).thenReturn(false);
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId("seguido-1", "seguidor-1")).thenReturn(true);

        assertThatThrownBy(() -> socialService.seguirUsuario("seguidor-1", "seguido-1"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void obtenerPerfilPublico_falla_si_bloqueado() {
        when(usuarioRepository.findById("seguido-1")).thenReturn(Optional.of(usuarioPublico));
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId("seguido-1", "visitante-1")).thenReturn(true);

        assertThatThrownBy(() -> socialService.obtenerPerfilPublico("seguido-1", "visitante-1"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void bloquearUsuario_falla_si_se_bloquea_a_si_mismo() {
        assertThatThrownBy(() -> socialService.bloquearUsuario("usuario-1", "usuario-1"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

        verify(bloqueoRepository, never()).save(any());
    }

    @Test
    void estaBloqueado_detecta_bloqueo_en_ambas_direcciones() {
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId("a", "b")).thenReturn(false);
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId("b", "a")).thenReturn(true);

        assertThat(socialService.estaBloqueado("a", "b")).isTrue();
    }

    @Test
    void estaBloqueado_es_falso_si_no_hay_bloqueo_en_ninguna_direccion() {
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId("a", "b")).thenReturn(false);
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId("b", "a")).thenReturn(false);

        assertThat(socialService.estaBloqueado("a", "b")).isFalse();
    }
}
