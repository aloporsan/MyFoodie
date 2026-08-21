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
@Document(collection = "seguimientos")
@CompoundIndex(name = "seguidor_seguido_idx", def = "{'seguidorId': 1, 'seguidoId': 1}", unique = true)
public class Seguimiento {

    @Id
    private String id;

    private String seguidorId;
    private String seguidoId;

    @Builder.Default
    private String estado = "pendiente";

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
