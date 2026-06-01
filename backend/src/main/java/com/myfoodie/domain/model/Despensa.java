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
@Document(collection = "despensas")
public class Despensa {

    @Id
    private String id;

    @Indexed(unique = true)
    private String usuarioId;

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
