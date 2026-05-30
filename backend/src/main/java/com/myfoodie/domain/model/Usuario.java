package com.myfoodie.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "usuarios")
public class Usuario {

    @Id
    private String id;

    private String nombre;

    @Indexed(unique = true)
    private String nombreUsuario;

    @Indexed(unique = true)
    private String email;

    private String passwordHash;

    private String fotoPerfil;

    private String biografia;

    @Builder.Default
    private Privacidad privacidad = Privacidad.PUBLICA;

    @Builder.Default
    private LocalDateTime fechaRegistro = LocalDateTime.now();

}
