package com.myfoodie.application.service;

import com.myfoodie.application.dto.auth.AuthResponseDTO;
import com.myfoodie.application.dto.auth.LoginRequestDTO;
import com.myfoodie.application.dto.auth.RegisterRequestDTO;
import com.myfoodie.domain.model.Preferencias;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.repository.PreferenciasRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import com.myfoodie.infrastructure.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PreferenciasRepository preferenciasRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthResponseDTO register(RegisterRequestDTO request) {
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "El email ya está registrado");
        }
        if (usuarioRepository.existsByNombreUsuario(request.nombreUsuario())) {
            throw new ApiException(HttpStatus.CONFLICT, "El nombre de usuario ya está en uso");
        }

        Usuario usuario = Usuario.builder()
                .nombre(request.nombre())
                .nombreUsuario(request.nombreUsuario())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();

        Usuario saved = usuarioRepository.save(usuario);

        preferenciasRepository.save(
                Preferencias.builder().usuarioId(saved.getId()).build()
        );

        return buildResponse(saved);
    }

    public AuthResponseDTO login(LoginRequestDTO request) {
        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas"));

        if (!passwordEncoder.matches(request.password(), usuario.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas");
        }

        return buildResponse(usuario);
    }

    private AuthResponseDTO buildResponse(Usuario usuario) {
        return new AuthResponseDTO(
                jwtTokenProvider.generateToken(usuario),
                usuario.getId(),
                usuario.getEmail(),
                usuario.getNombreUsuario(),
                usuario.getNombre()
        );
    }

}
