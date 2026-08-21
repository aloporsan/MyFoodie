package com.myfoodie.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "recetas_descartadas")
@CompoundIndex(name = "usuario_receta_descartada_idx", def = "{'usuarioId': 1, 'recetaId': 1}", unique = true)
public class RecetaDescartada {

    @Id
    private String id;

    private String usuarioId;
    private String recetaId;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
