package com.myfoodie.domain.repository;

import com.myfoodie.domain.model.PasswordResetToken;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PasswordResetTokenRepository extends MongoRepository<PasswordResetToken, String> {

    Optional<PasswordResetToken> findByToken(String token);

    List<PasswordResetToken> findByUsuarioIdAndUsadoFalse(String usuarioId);
}
