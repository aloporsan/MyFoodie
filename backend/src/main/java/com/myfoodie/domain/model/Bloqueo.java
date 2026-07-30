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
@Document(collection = "bloqueos")
@CompoundIndex(name = "bloqueador_bloqueado_idx", def = "{'bloqueadorId': 1, 'bloqueadoId': 1}", unique = true)
public class Bloqueo {

    @Id
    private String id;

    private String bloqueadorId;
    private String bloqueadoId;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
