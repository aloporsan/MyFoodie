package com.myfoodie.application.service;

import com.myfoodie.application.dto.notificacion.NotificacionResponseDTO;
import com.myfoodie.domain.model.Notificacion;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificacionService {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
    private static final String TIPO_NUEVO_SEGUIDOR = "nuevo_seguidor";
    private static final String TIPO_SOLICITUD_SEGUIMIENTO = "solicitud_seguimiento";
    private static final String TIPO_SOLICITUD_ACEPTADA = "solicitud_aceptada";
    private static final String TIPO_RECETA_COMPARTIDA = "receta_compartida";
    private static final String TIPO_NUEVO_LIKE = "nuevo_like";
    private static final String TIPO_NUEVO_COMENTARIO = "nuevo_comentario";
    private static final String TIPO_PRODUCTO_CADUCA_HOY = "producto_caduca_hoy";
    private static final String TIPO_PRODUCTO_CADUCA_PRONTO = "producto_caduca_pronto";
    private static final String TIPO_PRODUCTO_SIN_STOCK = "producto_sin_stock";
    private static final String TIPO_CARRITO_ACTUALIZADO = "carrito_actualizado";
    private static final String REFERENCIA_PRODUCTO = "producto";

    private static final Map<String, java.util.function.Predicate<PreferenciasNotificacion>> PREFERENCIA_POR_TIPO = Map.ofEntries(
            Map.entry(TIPO_NUEVO_SEGUIDOR, PreferenciasNotificacion::isNotificarNuevoSeguidor),
            Map.entry(TIPO_SOLICITUD_SEGUIMIENTO, PreferenciasNotificacion::isNotificarSolicitudSeguimiento),
            Map.entry(TIPO_SOLICITUD_ACEPTADA, PreferenciasNotificacion::isNotificarSolicitudSeguimiento),
            Map.entry(TIPO_RECETA_COMPARTIDA, PreferenciasNotificacion::isNotificarRecetasCompartidas),
            Map.entry(TIPO_NUEVO_LIKE, PreferenciasNotificacion::isNotificarLikes),
            Map.entry(TIPO_NUEVO_COMENTARIO, PreferenciasNotificacion::isNotificarComentarios),
            Map.entry(TIPO_PRODUCTO_CADUCA_HOY, PreferenciasNotificacion::isNotificarCaducidades),
            Map.entry(TIPO_PRODUCTO_CADUCA_PRONTO, PreferenciasNotificacion::isNotificarCaducidades),
            Map.entry(TIPO_PRODUCTO_SIN_STOCK, PreferenciasNotificacion::isNotificarCaducidades),
            Map.entry(TIPO_CARRITO_ACTUALIZADO, PreferenciasNotificacion::isNotificarCarrito)
    );

    private final NotificacionRepository notificacionRepository;
    private final PreferenciasRepository preferenciasRepository;
    private final BloqueoRepository bloqueoRepository;
    private final UsuarioRepository usuarioRepository;
    private final DespensaRepository despensaRepository;
    private final ProductoRepository productoRepository;

    private final RestClient restClient = RestClient.create();

    public void crearNotificacion(String usuarioId, String tipo, String emisorId,
                                   String referenciaId, String referenciaType) {
        if (emisorId != null && bloqueoRepository.existsByBloqueadorIdAndBloqueadoId(usuarioId, emisorId)) {
            return;
        }
        if (!tipoHabilitado(usuarioId, tipo)) {
            return;
        }

        Notificacion notificacion = notificacionRepository.save(Notificacion.builder()
                .usuarioId(usuarioId)
                .tipo(tipo)
                .emisorId(emisorId)
                .referenciaId(referenciaId)
                .referenciaType(referenciaType)
                .titulo(resolverTitulo(tipo, emisorId, referenciaId, referenciaType))
                .cuerpo(resolverCuerpo(tipo, emisorId, referenciaId, referenciaType))
                .build());

        enviarPushSiProcede(notificacion);
    }

    @Async
    public void enviarPushSiProcede(Notificacion notificacion) {
        Usuario receptor = usuarioRepository.findById(notificacion.getUsuarioId()).orElse(null);
        if (receptor == null || receptor.getExpoPushToken() == null || receptor.getExpoPushToken().isBlank()) {
            return;
        }

        Map<String, Object> data = new HashMap<>();
        data.put("tipo", notificacion.getTipo());
        data.put("emisorId", notificacion.getEmisorId());
        data.put("referenciaId", notificacion.getReferenciaId());
        data.put("referenciaType", notificacion.getReferenciaType());

        Map<String, Object> payload = Map.of(
                "to", receptor.getExpoPushToken(),
                "title", notificacion.getTitulo(),
                "body", notificacion.getCuerpo(),
                "data", data,
                "sound", "default",
                "badge", 1
        );

        try {
            restClient.post()
                    .uri(EXPO_PUSH_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
            notificacion.setPushEnviada(true);
            notificacionRepository.save(notificacion);
        } catch (Exception e) {
            log.error("Error al enviar push notification a usuario {}: {}", notificacion.getUsuarioId(), e.getMessage());
        }
    }

    public void registrarPushToken(String usuarioId, String token) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        usuario.setExpoPushToken(token);
        usuarioRepository.save(usuario);
    }

    public List<NotificacionResponseDTO> obtenerNotificaciones(String usuarioId, int pagina, int tamaño) {
        return notificacionRepository
                .findByUsuarioIdOrderByCreatedAtDesc(usuarioId, PageRequest.of(pagina, tamaño))
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    public void marcarComoLeida(String usuarioId, String notificacionId) {
        Notificacion notificacion = obtenerNotificacionDeUsuario(usuarioId, notificacionId);
        notificacion.setLeida(true);
        notificacionRepository.save(notificacion);
    }

    public void marcarTodasComoLeidas(String usuarioId) {
        List<Notificacion> pendientes = notificacionRepository.findByUsuarioIdAndLeidaFalse(usuarioId);
        pendientes.forEach(n -> n.setLeida(true));
        notificacionRepository.saveAll(pendientes);
    }

    public long obtenerContadorNoLeidas(String usuarioId) {
        return notificacionRepository.countByUsuarioIdAndLeidaFalse(usuarioId);
    }

    public void eliminarNotificacion(String usuarioId, String notificacionId) {
        Notificacion notificacion = obtenerNotificacionDeUsuario(usuarioId, notificacionId);
        notificacionRepository.delete(notificacion);
    }

    @Async
    public void generarNotificacionesCaducidad(String usuarioId) {
        despensaRepository.findByUsuarioId(usuarioId).ifPresent(despensa ->
                productoRepository.findByDespensaId(despensa.getId())
                        .forEach(producto -> generarNotificacionParaProducto(usuarioId, producto)));
    }

    // ---------- Helpers ----------

    private void generarNotificacionParaProducto(String usuarioId, Producto producto) {
        String tipo = calcularTipoAlertaProducto(producto);
        if (tipo == null) {
            return;
        }
        boolean yaNotificado = notificacionRepository.existsByUsuarioIdAndTipoAndReferenciaIdAndCreatedAtAfter(
                usuarioId, tipo, producto.getId(), LocalDateTime.now().minusHours(24));
        if (yaNotificado) {
            return;
        }
        crearNotificacion(usuarioId, tipo, null, producto.getId(), REFERENCIA_PRODUCTO);
    }

    private String calcularTipoAlertaProducto(Producto producto) {
        if (producto.getCantidad() <= 0) {
            return TIPO_PRODUCTO_SIN_STOCK;
        }
        if (producto.getFechaCaducidad() == null) {
            return null;
        }
        long dias = ChronoUnit.DAYS.between(LocalDate.now(), producto.getFechaCaducidad());
        if (dias == 0) {
            return TIPO_PRODUCTO_CADUCA_HOY;
        }
        if (dias > 0 && dias <= 3) {
            return TIPO_PRODUCTO_CADUCA_PRONTO;
        }
        return null;
    }

    private boolean tipoHabilitado(String usuarioId, String tipo) {
        PreferenciasNotificacion preferencias = preferenciasRepository.findByUsuarioId(usuarioId)
                .map(com.myfoodie.domain.model.Preferencias::getPreferenciasNotificacion)
                .orElseGet(() -> PreferenciasNotificacion.builder().build());
        var predicado = PREFERENCIA_POR_TIPO.get(tipo);
        return predicado == null || predicado.test(preferencias);
    }

    private Notificacion obtenerNotificacionDeUsuario(String usuarioId, String notificacionId) {
        Notificacion notificacion = notificacionRepository.findById(notificacionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notificación no encontrada"));
        if (!notificacion.getUsuarioId().equals(usuarioId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "No puedes acceder a esta notificación");
        }
        return notificacion;
    }

    private String resolverTitulo(String tipo, String emisorId, String referenciaId, String referenciaType) {
        String nombreEmisor = emisorId != null ? nombreUsuario(emisorId) : null;
        return switch (tipo) {
            case TIPO_NUEVO_SEGUIDOR -> nombreEmisor + " te ha seguido";
            case TIPO_SOLICITUD_SEGUIMIENTO -> nombreEmisor + " quiere seguirte";
            case TIPO_SOLICITUD_ACEPTADA -> nombreEmisor + " aceptó tu solicitud";
            case TIPO_RECETA_COMPARTIDA -> nombreEmisor + " te ha compartido una receta";
            case TIPO_NUEVO_LIKE -> "A " + nombreEmisor + " le gusta tu receta";
            case TIPO_NUEVO_COMENTARIO -> nombreEmisor + " ha comentado tu receta";
            case TIPO_PRODUCTO_CADUCA_HOY -> nombreProducto(referenciaId, referenciaType) + " caduca hoy";
            case TIPO_PRODUCTO_CADUCA_PRONTO -> nombreProducto(referenciaId, referenciaType) + " caduca pronto";
            case TIPO_PRODUCTO_SIN_STOCK -> nombreProducto(referenciaId, referenciaType) + " sin stock";
            case TIPO_CARRITO_ACTUALIZADO -> "Tu carrito tiene novedades";
            default -> "Nueva notificación";
        };
    }

    private String resolverCuerpo(String tipo, String emisorId, String referenciaId, String referenciaType) {
        String nombreEmisor = emisorId != null ? nombreUsuario(emisorId) : null;
        String nombreProducto = nombreProducto(referenciaId, referenciaType);
        return switch (tipo) {
            case TIPO_NUEVO_SEGUIDOR -> nombreEmisor + " ha empezado a seguirte";
            case TIPO_SOLICITUD_SEGUIMIENTO -> nombreEmisor + " ha solicitado seguirte";
            case TIPO_SOLICITUD_ACEPTADA -> nombreEmisor + " ha aceptado tu solicitud de seguimiento";
            case TIPO_RECETA_COMPARTIDA -> nombreEmisor + " te ha enviado una receta nueva";
            case TIPO_NUEVO_LIKE -> nombreEmisor + " ha dado like a tu receta";
            case TIPO_NUEVO_COMENTARIO -> nombreEmisor + " ha dejado un comentario en tu receta";
            case TIPO_PRODUCTO_CADUCA_HOY -> "Tu producto " + nombreProducto + " caduca hoy";
            case TIPO_PRODUCTO_CADUCA_PRONTO -> "Tu producto " + nombreProducto + " caduca en menos de 3 días";
            case TIPO_PRODUCTO_SIN_STOCK -> "Te has quedado sin " + nombreProducto;
            case TIPO_CARRITO_ACTUALIZADO -> "El carrito inteligente tiene nuevas recomendaciones";
            default -> "";
        };
    }

    private String nombreUsuario(String usuarioId) {
        return usuarioRepository.findById(usuarioId).map(Usuario::getNombre).orElse("Alguien");
    }

    private String nombreProducto(String referenciaId, String referenciaType) {
        if (!REFERENCIA_PRODUCTO.equals(referenciaType) || referenciaId == null) {
            return "un producto";
        }
        return productoRepository.findById(referenciaId).map(Producto::getNombre).orElse("un producto");
    }

    private NotificacionResponseDTO toResponseDTO(Notificacion notificacion) {
        NotificacionResponseDTO.EmisorDTO emisor = notificacion.getEmisorId() == null
                ? null
                : usuarioRepository.findById(notificacion.getEmisorId())
                        .map(u -> new NotificacionResponseDTO.EmisorDTO(
                                u.getId(), u.getNombre(), u.getNombreUsuario(), u.getFotoPerfil()))
                        .orElse(null);

        return new NotificacionResponseDTO(
                notificacion.getId(),
                notificacion.getTipo(),
                emisor,
                notificacion.getTitulo(),
                notificacion.getCuerpo(),
                Boolean.TRUE.equals(notificacion.getLeida()),
                notificacion.getReferenciaId(),
                notificacion.getReferenciaType(),
                notificacion.getCreatedAt()
        );
    }
}
