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
@Document(collection = "recetas_compartidas")
public class RecetaCompartida {

    @Id
    private String id;

    @Indexed
    private String emisorId;

    @Indexed
    private String receptorId;

    private String recetaId;

    private String mensaje;

    @Builder.Default
    private Boolean leida = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
