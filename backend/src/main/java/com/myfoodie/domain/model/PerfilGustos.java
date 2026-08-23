package com.myfoodie.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "perfiles_gustos")
public class PerfilGustos {

    @Id
    private String id;

    @Indexed(unique = true)
    private String usuarioId;

    @Builder.Default
    private Map<String, Integer> categoriasPreferidas = new java.util.HashMap<>();

    @Builder.Default
    private Map<String, Integer> etiquetasPreferidas = new java.util.HashMap<>();

    @Builder.Default
    private Map<String, Integer> dificultadesPreferidas = new java.util.HashMap<>();

    private Integer tiempoMaximoHabitual;

    @Builder.Default
    private List<String> ingredientesHabituales = new java.util.ArrayList<>();

    @Builder.Default
    private Integer totalInteracciones = 0;

    @Builder.Default
    private Date updatedAt = new Date();
}
