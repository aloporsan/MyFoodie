package com.myfoodie.application.service;

import com.myfoodie.application.dto.notificacion.NotificacionResponseDTO;
import com.myfoodie.domain.model.Despensa;
import com.myfoodie.domain.model.Notificacion;
import com.myfoodie.domain.model.Preferencias;
import com.myfoodie.domain.model.PreferenciasNotificacion;
import com.myfoodie.domain.model.Producto;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.repository.BloqueoRepository;
import com.myfoodie.domain.repository.DespensaRepository;
import com.myfoodie.domain.repository.NotificacionRepository;
import com.myfoodie.domain.repository.PreferenciasRepository;
import com.myfoodie.domain.repository.ProductoRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificacionServiceTest {

    @Mock private NotificacionRepository notificacionRepository;
    @Mock private PreferenciasRepository preferenciasRepository;
    @Mock private BloqueoRepository bloqueoRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private DespensaRepository despensaRepository;
    @Mock private ProductoRepository productoRepository;

    @InjectMocks
    private NotificacionService notificacionService;

    private Usuario emisor() {
        return Usuario.builder().id("emisor-1").nombre("Ana Pérez").nombreUsuario("anap")
                .fotoPerfil("foto.jpg").build();
    }

    // ===== obtenerContadorNoLeidas =====

    @Test
    void obtenerContadorNoLeidas_devuelve_el_conteo_del_repositorio() {
        when(notificacionRepository.countByUsuarioIdAndLeidaFalse("usuario-1")).thenReturn(4L);

        long resultado = notificacionService.obtenerContadorNoLeidas("usuario-1");

        assertThat(resultado).isEqualTo(4L);
    }

    @Test
    void obtenerContadorNoLeidas_devuelve_cero_si_no_hay_notificaciones() {
        when(notificacionRepository.countByUsuarioIdAndLeidaFalse("usuario-1")).thenReturn(0L);

        long resultado = notificacionService.obtenerContadorNoLeidas("usuario-1");

        assertThat(resultado).isZero();
    }

    // ===== crearNotificacion =====

    @Test
    void crearNotificacion_guarda_con_titulo_y_cuerpo_resueltos() {
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId("receptor-1", "emisor-1")).thenReturn(false);
        when(preferenciasRepository.findByUsuarioId("receptor-1")).thenReturn(Optional.empty());
        when(usuarioRepository.findById("emisor-1")).thenReturn(Optional.of(emisor()));
        when(notificacionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        notificacionService.crearNotificacion("receptor-1", "nuevo_seguidor", "emisor-1", null, null);

        ArgumentCaptor<Notificacion> captor = ArgumentCaptor.forClass(Notificacion.class);
        verify(notificacionRepository).save(captor.capture());
        assertThat(captor.getValue().getTitulo()).isEqualTo("Ana Pérez te ha seguido");
        assertThat(captor.getValue().getCuerpo()).isEqualTo("Ana Pérez ha empezado a seguirte");
    }

    @Test
    void crearNotificacion_no_guarda_si_emisor_esta_bloqueado() {
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId("receptor-1", "emisor-1")).thenReturn(true);

        notificacionService.crearNotificacion("receptor-1", "nuevo_seguidor", "emisor-1", null, null);

        verify(notificacionRepository, never()).save(any());
    }

    @Test
    void crearNotificacion_no_guarda_si_el_tipo_esta_deshabilitado_en_preferencias() {
        Preferencias preferencias = Preferencias.builder()
                .usuarioId("receptor-1")
                .preferenciasNotificacion(PreferenciasNotificacion.builder().notificarNuevoSeguidor(false).build())
                .build();
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId("receptor-1", "emisor-1")).thenReturn(false);
        when(preferenciasRepository.findByUsuarioId("receptor-1")).thenReturn(Optional.of(preferencias));

        notificacionService.crearNotificacion("receptor-1", "nuevo_seguidor", "emisor-1", null, null);

        verify(notificacionRepository, never()).save(any());
    }

    @Test
    void crearNotificacion_usa_preferencias_por_defecto_si_el_usuario_no_las_ha_configurado() {
        when(bloqueoRepository.existsByBloqueadorIdAndBloqueadoId("receptor-1", "emisor-1")).thenReturn(false);
        when(preferenciasRepository.findByUsuarioId("receptor-1")).thenReturn(Optional.empty());
        when(usuarioRepository.findById("emisor-1")).thenReturn(Optional.of(emisor()));
        when(notificacionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        notificacionService.crearNotificacion("receptor-1", "nuevo_seguidor", "emisor-1", null, null);

        verify(notificacionRepository).save(any());
    }

    // ===== obtenerNotificaciones =====

    @Test
    void obtenerNotificaciones_mapea_emisor_y_datos_almacenados() {
        Notificacion notificacion = Notificacion.builder()
                .id("notif-1").usuarioId("receptor-1").tipo("nuevo_seguidor").emisorId("emisor-1")
                .titulo("Ana Pérez te ha seguido").cuerpo("Ana Pérez ha empezado a seguirte")
                .leida(false).createdAt(LocalDateTime.now()).build();
        when(notificacionRepository.findByUsuarioIdOrderByCreatedAtDesc("receptor-1", PageRequest.of(0, 20)))
                .thenReturn(List.of(notificacion));
        when(usuarioRepository.findById("emisor-1")).thenReturn(Optional.of(emisor()));

        List<NotificacionResponseDTO> resultado = notificacionService.obtenerNotificaciones("receptor-1", 0, 20);

        assertThat(resultado).hasSize(1);
        NotificacionResponseDTO dto = resultado.get(0);
        assertThat(dto.emisor().id()).isEqualTo("emisor-1");
        assertThat(dto.emisor().nombreUsuario()).isEqualTo("anap");
        assertThat(dto.titulo()).isEqualTo("Ana Pérez te ha seguido");
        assertThat(dto.cuerpo()).isEqualTo("Ana Pérez ha empezado a seguirte");
    }

    @Test
    void obtenerNotificaciones_recalcula_titulo_y_cuerpo_si_el_documento_no_los_tiene_guardados() {
        // Documentos creados antes de que titulo/cuerpo se persistieran (Mongo es schemaless):
        // deben resolverse igualmente en lectura en vez de mostrarse en blanco.
        Notificacion notificacionAntigua = Notificacion.builder()
                .id("notif-1").usuarioId("receptor-1").tipo("nuevo_seguidor").emisorId("emisor-1")
                .leida(false).createdAt(LocalDateTime.now()).build();
        when(notificacionRepository.findByUsuarioIdOrderByCreatedAtDesc("receptor-1", PageRequest.of(0, 20)))
                .thenReturn(List.of(notificacionAntigua));
        when(usuarioRepository.findById("emisor-1")).thenReturn(Optional.of(emisor()));

        List<NotificacionResponseDTO> resultado = notificacionService.obtenerNotificaciones("receptor-1", 0, 20);

        assertThat(resultado.get(0).titulo()).isEqualTo("Ana Pérez te ha seguido");
        assertThat(resultado.get(0).cuerpo()).isEqualTo("Ana Pérez ha empezado a seguirte");
    }

    @Test
    void obtenerNotificaciones_devuelve_emisor_nulo_para_notificaciones_del_sistema() {
        Notificacion notificacionSistema = Notificacion.builder()
                .id("notif-1").usuarioId("receptor-1").tipo("producto_caduca_hoy")
                .referenciaId("prod-1").referenciaType("producto")
                .leida(false).createdAt(LocalDateTime.now()).build();
        when(notificacionRepository.findByUsuarioIdOrderByCreatedAtDesc("receptor-1", PageRequest.of(0, 20)))
                .thenReturn(List.of(notificacionSistema));
        when(productoRepository.findById("prod-1"))
                .thenReturn(Optional.of(Producto.builder().id("prod-1").nombre("Leche").build()));

        List<NotificacionResponseDTO> resultado = notificacionService.obtenerNotificaciones("receptor-1", 0, 20);

        assertThat(resultado.get(0).emisor()).isNull();
        assertThat(resultado.get(0).titulo()).isEqualTo("Leche caduca hoy");
    }

    // ===== marcarComoLeida =====

    @Test
    void marcarComoLeida_marca_la_notificacion_propia_como_leida() {
        Notificacion notificacion = Notificacion.builder()
                .id("notif-1").usuarioId("receptor-1").tipo("nuevo_seguidor").leida(false).build();
        when(notificacionRepository.findById("notif-1")).thenReturn(Optional.of(notificacion));

        notificacionService.marcarComoLeida("receptor-1", "notif-1");

        assertThat(notificacion.getLeida()).isTrue();
        verify(notificacionRepository).save(notificacion);
    }

    @Test
    void marcarComoLeida_falla_si_la_notificacion_no_es_del_usuario() {
        Notificacion notificacion = Notificacion.builder()
                .id("notif-1").usuarioId("receptor-1").tipo("nuevo_seguidor").leida(false).build();
        when(notificacionRepository.findById("notif-1")).thenReturn(Optional.of(notificacion));

        assertThatThrownBy(() -> notificacionService.marcarComoLeida("otro-usuario", "notif-1"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        verify(notificacionRepository, never()).save(any());
    }

    @Test
    void marcarComoLeida_falla_si_la_notificacion_no_existe() {
        when(notificacionRepository.findById("notif-1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificacionService.marcarComoLeida("receptor-1", "notif-1"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void marcarTodasComoLeidas_marca_todas_las_pendientes_del_usuario() {
        Notificacion pendiente1 = Notificacion.builder().id("n1").usuarioId("receptor-1").leida(false).build();
        Notificacion pendiente2 = Notificacion.builder().id("n2").usuarioId("receptor-1").leida(false).build();
        when(notificacionRepository.findByUsuarioIdAndLeidaFalse("receptor-1"))
                .thenReturn(List.of(pendiente1, pendiente2));

        notificacionService.marcarTodasComoLeidas("receptor-1");

        assertThat(pendiente1.getLeida()).isTrue();
        assertThat(pendiente2.getLeida()).isTrue();
        verify(notificacionRepository).saveAll(List.of(pendiente1, pendiente2));
    }

    // ===== eliminarNotificacion =====

    @Test
    void eliminarNotificacion_elimina_la_notificacion_propia() {
        Notificacion notificacion = Notificacion.builder().id("notif-1").usuarioId("receptor-1").build();
        when(notificacionRepository.findById("notif-1")).thenReturn(Optional.of(notificacion));

        notificacionService.eliminarNotificacion("receptor-1", "notif-1");

        verify(notificacionRepository).delete(notificacion);
    }

    @Test
    void eliminarNotificacion_falla_si_la_notificacion_no_es_del_usuario() {
        Notificacion notificacion = Notificacion.builder().id("notif-1").usuarioId("receptor-1").build();
        when(notificacionRepository.findById("notif-1")).thenReturn(Optional.of(notificacion));

        assertThatThrownBy(() -> notificacionService.eliminarNotificacion("otro-usuario", "notif-1"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        verify(notificacionRepository, never()).delete(any(Notificacion.class));
    }

    // ===== registrarPushToken =====

    @Test
    void registrarPushToken_guarda_el_token_en_el_usuario() {
        Usuario usuario = Usuario.builder().id("receptor-1").expoPushToken(null).build();
        when(usuarioRepository.findById("receptor-1")).thenReturn(Optional.of(usuario));

        notificacionService.registrarPushToken("receptor-1", "ExponentPushToken[abc123]");

        assertThat(usuario.getExpoPushToken()).isEqualTo("ExponentPushToken[abc123]");
        verify(usuarioRepository).save(usuario);
    }

    @Test
    void registrarPushToken_falla_si_el_usuario_no_existe() {
        when(usuarioRepository.findById("receptor-1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificacionService.registrarPushToken("receptor-1", "token"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    // ===== generarNotificacionesCaducidad =====

    @Test
    void generarNotificacionesCaducidad_notifica_producto_sin_stock() {
        Despensa despensa = Despensa.builder().id("desp-1").usuarioId("receptor-1").build();
        Producto sinStock = Producto.builder().id("prod-1").despensaId("desp-1").nombre("Arroz").cantidad(0).build();
        when(despensaRepository.findByUsuarioId("receptor-1")).thenReturn(Optional.of(despensa));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(sinStock));
        when(notificacionRepository.existsByUsuarioIdAndTipoAndReferenciaIdAndCreatedAtAfter(
                any(), any(), any(), any())).thenReturn(false);
        when(preferenciasRepository.findByUsuarioId("receptor-1")).thenReturn(Optional.empty());
        when(notificacionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        notificacionService.generarNotificacionesCaducidad("receptor-1");

        ArgumentCaptor<Notificacion> captor = ArgumentCaptor.forClass(Notificacion.class);
        verify(notificacionRepository).save(captor.capture());
        assertThat(captor.getValue().getTipo()).isEqualTo("producto_sin_stock");
        assertThat(captor.getValue().getReferenciaId()).isEqualTo("prod-1");
    }

    @Test
    void generarNotificacionesCaducidad_notifica_producto_que_caduca_hoy() {
        Despensa despensa = Despensa.builder().id("desp-1").usuarioId("receptor-1").build();
        Producto caducaHoy = Producto.builder().id("prod-1").despensaId("desp-1").nombre("Yogur")
                .cantidad(2).fechaCaducidad(LocalDate.now()).build();
        when(despensaRepository.findByUsuarioId("receptor-1")).thenReturn(Optional.of(despensa));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(caducaHoy));
        when(notificacionRepository.existsByUsuarioIdAndTipoAndReferenciaIdAndCreatedAtAfter(
                any(), any(), any(), any())).thenReturn(false);
        when(preferenciasRepository.findByUsuarioId("receptor-1")).thenReturn(Optional.empty());
        when(notificacionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        notificacionService.generarNotificacionesCaducidad("receptor-1");

        ArgumentCaptor<Notificacion> captor = ArgumentCaptor.forClass(Notificacion.class);
        verify(notificacionRepository).save(captor.capture());
        assertThat(captor.getValue().getTipo()).isEqualTo("producto_caduca_hoy");
    }

    @Test
    void generarNotificacionesCaducidad_no_notifica_producto_que_caduca_dentro_de_mas_de_3_dias() {
        Despensa despensa = Despensa.builder().id("desp-1").usuarioId("receptor-1").build();
        Producto caducaTarde = Producto.builder().id("prod-1").despensaId("desp-1").nombre("Conserva")
                .cantidad(2).fechaCaducidad(LocalDate.now().plusDays(10)).build();
        when(despensaRepository.findByUsuarioId("receptor-1")).thenReturn(Optional.of(despensa));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(caducaTarde));

        notificacionService.generarNotificacionesCaducidad("receptor-1");

        verify(notificacionRepository, never()).save(any());
    }

    @Test
    void generarNotificacionesCaducidad_no_duplica_si_ya_se_notifico_en_las_ultimas_24_horas() {
        Despensa despensa = Despensa.builder().id("desp-1").usuarioId("receptor-1").build();
        Producto sinStock = Producto.builder().id("prod-1").despensaId("desp-1").nombre("Arroz").cantidad(0).build();
        when(despensaRepository.findByUsuarioId("receptor-1")).thenReturn(Optional.of(despensa));
        when(productoRepository.findByDespensaId("desp-1")).thenReturn(List.of(sinStock));
        when(notificacionRepository.existsByUsuarioIdAndTipoAndReferenciaIdAndCreatedAtAfter(
                any(), any(), any(), any())).thenReturn(true);

        notificacionService.generarNotificacionesCaducidad("receptor-1");

        verify(notificacionRepository, never()).save(any());
    }

    @Test
    void generarNotificacionesCaducidad_no_hace_nada_si_el_usuario_no_tiene_despensa() {
        when(despensaRepository.findByUsuarioId("receptor-1")).thenReturn(Optional.empty());

        notificacionService.generarNotificacionesCaducidad("receptor-1");

        verify(productoRepository, never()).findByDespensaId(any());
        verify(notificacionRepository, never()).save(any());
    }
}
