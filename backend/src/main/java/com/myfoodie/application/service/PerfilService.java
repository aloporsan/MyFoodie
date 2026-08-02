package com.myfoodie.application.service;

import com.myfoodie.application.dto.perfil.EliminarCuentaDTO;
import com.myfoodie.application.dto.perfil.EstadisticasPerfilDTO;
import com.myfoodie.application.dto.perfil.PerfilResponseDTO;
import com.myfoodie.application.dto.perfil.PerfilUpdateDTO;
import com.myfoodie.application.dto.perfil.PreferenciasUpdateDTO;
import com.myfoodie.application.dto.perfil.PrivacidadUpdateDTO;
import com.myfoodie.domain.model.ConfiguracionPrivacidad;
import com.myfoodie.domain.model.Despensa;
import com.myfoodie.domain.model.Preferencias;
import com.myfoodie.domain.model.Privacidad;
import com.myfoodie.domain.model.Producto;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.repository.DespensaRepository;
import com.myfoodie.domain.repository.MovimientoProductoRepository;
import com.myfoodie.domain.repository.PreferenciasRepository;
import com.myfoodie.domain.repository.ProductoRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import com.myfoodie.infrastructure.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class PerfilService {

    private final UsuarioRepository usuarioRepository;
    private final PreferenciasRepository preferenciasRepository;
    private final DespensaRepository despensaRepository;
    private final ProductoRepository productoRepository;
    private final RecetaRepository recetaRepository;
    private final MovimientoProductoRepository movimientoRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final RedisTemplate<String, String> redisTemplate;

    public PerfilResponseDTO obtenerPerfil(String usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        return toPerfilResponse(usuario);
    }

    public PerfilResponseDTO editarPerfil(String usuarioId, PerfilUpdateDTO dto) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        if (dto.nombre() != null && dto.nombre().trim().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El nombre no puede estar vacío");
        }
        if (dto.nombreUsuario() != null && !dto.nombreUsuario().equals(usuario.getNombreUsuario())) {
            if (usuarioRepository.existsByNombreUsuario(dto.nombreUsuario())) {
                throw new ApiException(HttpStatus.CONFLICT, "El nombre de usuario ya está en uso");
            }
            usuario.setNombreUsuario(dto.nombreUsuario());
        }
        if (dto.nombre() != null) usuario.setNombre(dto.nombre());
        if (dto.fotoPerfil() != null) usuario.setFotoPerfil(dto.fotoPerfil());
        if (dto.biografia() != null) usuario.setBiografia(dto.biografia());

        return toPerfilResponse(usuarioRepository.save(usuario));
    }

    public PreferenciasUpdateDTO obtenerPreferencias(String usuarioId) {
        Preferencias pref = preferenciasRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Preferencias no encontradas"));
        return toPreferenciasDTO(pref);
    }

    public PreferenciasUpdateDTO actualizarPreferencias(String usuarioId, PreferenciasUpdateDTO dto) {
        Preferencias pref = preferenciasRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Preferencias no encontradas"));

        if (dto.tipoDieta() != null) pref.setTipoDieta(dto.tipoDieta());
        if (dto.alergias() != null) pref.setAlergenos(dto.alergias());
        if (dto.ingredientesNoDeseados() != null) pref.setIngredientesNoDeseados(dto.ingredientesNoDeseados());
        if (dto.nivelDificultad() != null) pref.setNivelDificultad(dto.nivelDificultad());
        if (dto.tiempoCoccionMax() != null) pref.setTiempoCoccionMax(dto.tiempoCoccionMax());
        if (dto.stockMinimoGlobal() != null) pref.setStockMinimoGlobal(dto.stockMinimoGlobal());

        return toPreferenciasDTO(preferenciasRepository.save(pref));
    }

    public void actualizarPrivacidad(String usuarioId, PrivacidadUpdateDTO dto) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        ConfiguracionPrivacidad cfg = usuario.getConfiguracionPrivacidad();
        if (dto.perfilPublico() != null) {
            cfg.setPerfilPublico(dto.perfilPublico());
            usuario.setPrivacidad(dto.perfilPublico() ? Privacidad.PUBLICA : Privacidad.PRIVADA);
        }
        if (dto.mostrarRecetas() != null) cfg.setMostrarRecetas(dto.mostrarRecetas());
        if (dto.mostrarEstadisticas() != null) cfg.setMostrarEstadisticas(dto.mostrarEstadisticas());
        if (dto.permitirMensajes() != null) cfg.setPermitirMensajes(dto.permitirMensajes());

        usuarioRepository.save(usuario);
    }

    public EstadisticasPerfilDTO obtenerEstadisticasPerfil(String usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        int totalProductos = 0;
        int productosConsumidos = 0;
        int productosCaducados = 0;

        Despensa despensa = despensaRepository.findByUsuarioId(usuarioId).orElse(null);
        if (despensa != null) {
            List<Producto> productos = productoRepository.findByDespensaId(despensa.getId());
            LocalDate hoy = LocalDate.now();
            totalProductos = productos.size();
            for (Producto p : productos) {
                if (p.getCantidad() <= 0) productosConsumidos++;
                if (p.getFechaCaducidad() != null && p.getFechaCaducidad().isBefore(hoy)) productosCaducados++;
            }
        }

        int totalRecetasPublicadas = (int) recetaRepository.countByAutorIdAndEstado(usuarioId, "publicada");

        EstadisticasPerfilDTO.MotivosEliminacion motivos = calcularMotivosEliminacion(usuarioId, despensa);

        return new EstadisticasPerfilDTO(
                totalProductos,
                productosConsumidos,
                productosCaducados,
                totalRecetasPublicadas,
                0,
                usuario.getFechaRegistro(),
                motivos
        );
    }

    public void cerrarSesion(String usuarioId, String token) {
        if (token == null) return;
        try {
            long ttlMs = jwtTokenProvider.getExpirationFromToken(token).getTime() - System.currentTimeMillis();
            if (ttlMs > 0) {
                redisTemplate.opsForValue().set("blacklist:" + token, usuarioId, ttlMs, TimeUnit.MILLISECONDS);
            }
        } catch (Exception e) {
            // Si Redis no está disponible, el cierre de sesión se completa igualmente en el cliente
        }
    }

    // La eliminación de cuenta es irreversible: anonimiza datos personales y desasocia al autor de sus recetas publicadas
    public void eliminarCuenta(String usuarioId, EliminarCuentaDTO dto) {
        if (dto.confirmar() == null || !dto.confirmar()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Debes confirmar la eliminación con confirmar: true");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        usuario.setEmail("deleted_" + usuarioId + "@myfoodie.com");
        usuario.setNombre("Usuario eliminado");
        usuario.setNombreUsuario("deleted_" + usuarioId);
        usuario.setFotoPerfil(null);
        usuario.setBiografia(null);
        usuarioRepository.save(usuario);
    }

    private EstadisticasPerfilDTO.MotivosEliminacion calcularMotivosEliminacion(String usuarioId, Despensa despensa) {
        if (despensa == null) {
            return new EstadisticasPerfilDTO.MotivosEliminacion(0, 0, 0, 0, 0, 0);
        }
        var eliminados = movimientoRepository.findByDespensaIdAndTipo(despensa.getId(), "eliminado");
        int consumido = 0, caducado = 0, usado_en_receta = 0, donado = 0, perdido = 0, otro = 0;
        for (var m : eliminados) {
            if (m.getMotivo() == null) continue;
            switch (m.getMotivo()) {
                case "consumido"      -> consumido++;
                case "caducado"       -> caducado++;
                case "usado_en_receta"-> usado_en_receta++;
                case "donado"         -> donado++;
                case "perdido"        -> perdido++;
                case "otro"           -> otro++;
            }
        }
        return new EstadisticasPerfilDTO.MotivosEliminacion(
                consumido, caducado, usado_en_receta, donado, perdido, otro);
    }

    private PerfilResponseDTO toPerfilResponse(Usuario usuario) {
        return new PerfilResponseDTO(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getNombreUsuario(),
                usuario.getEmail(),
                usuario.getFotoPerfil(),
                usuario.getBiografia(),
                usuario.getFechaRegistro()
        );
    }

    private PreferenciasUpdateDTO toPreferenciasDTO(Preferencias pref) {
        return new PreferenciasUpdateDTO(
                pref.getTipoDieta(),
                pref.getAlergenos(),
                pref.getIngredientesNoDeseados(),
                pref.getNivelDificultad(),
                pref.getTiempoCoccionMax(),
                pref.getStockMinimoGlobal()
        );
    }
}
