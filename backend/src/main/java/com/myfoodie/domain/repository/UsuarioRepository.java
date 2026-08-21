package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.Usuario;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends MongoRepository<Usuario, String> {

    Optional<Usuario> findByEmail(String email);

    Optional<Usuario> findByNombreUsuario(String nombreUsuario);

    boolean existsByEmail(String email);

    boolean existsByNombreUsuario(String nombreUsuario);

    List<Usuario> findByNombreContainingIgnoreCaseOrNombreUsuarioContainingIgnoreCase(
            String nombre, String nombreUsuario);

}
