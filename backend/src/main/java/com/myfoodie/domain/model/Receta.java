package com.myfoodie.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "recetas")
public class Receta {

    @Id
    private String id;

    @Indexed
    private String autorId;

    private String titulo;
    private String descripcion;
    private int tiempoEstimado;
    private String dificultad;
    private String categoria;
    private List<String> etiquetas;
    private String imagenUrl;

    @Builder.Default
    private Integer numPersonas = 2;

    @Builder.Default
    private String estado = "borrador";

    @Builder.Default
    private VisibilidadReceta visibilidad = VisibilidadReceta.PUBLICA;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
