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
@Document(collection = "fusiones_ignoradas")
public class FusionIgnorada {

    @Id
    private String id;

    @Indexed
    private String usuarioId;

    private String productoANombre;
    private String productoBNombre;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
