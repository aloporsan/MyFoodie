package com.myfoodie.application.service;

import com.myfoodie.application.dto.perfil.PerfilResponseDTO;
import com.myfoodie.application.dto.perfil.PerfilUpdateDTO;
import com.myfoodie.application.dto.perfil.PreferenciasUpdateDTO;
import com.myfoodie.domain.model.Preferencias;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.repository.PreferenciasRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PerfilService {

    private final UsuarioRepository usuarioRepository;
    private final PreferenciasRepository preferenciasRepository;

    public PerfilResponseDTO obtenerPerfil(String usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        return toPerfilResponse(usuario);
    }

    public PerfilResponseDTO editarPerfil(String usuarioId, PerfilUpdateDTO dto) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

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

        return toPreferenciasDTO(preferenciasRepository.save(pref));
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
                pref.getTiempoCoccionMax()
        );
    }
}
