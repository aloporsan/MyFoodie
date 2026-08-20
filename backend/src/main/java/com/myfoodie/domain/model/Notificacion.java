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
@Document(collection = "notificaciones")
public class Notificacion {

    @Id
    private String id;

    @Indexed
    private String usuarioId;

    private String tipo;
    private String emisorId;
    private String referenciaId;
    private String referenciaType;
    private String titulo;
    private String cuerpo;

    @Builder.Default
    private Boolean leida = false;

    @Builder.Default
    private Boolean pushEnviada = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
