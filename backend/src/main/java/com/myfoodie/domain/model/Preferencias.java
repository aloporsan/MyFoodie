package com.myfoodie.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "preferencias")
public class Preferencias {

    @Id
    private String id;

    @Indexed(unique = true)
    private String usuarioId;

    @Builder.Default
    private boolean vegetariano = false;

    @Builder.Default
    private boolean vegano = false;

    @Builder.Default
    private boolean sinGluten = false;

    @Builder.Default
    private List<String> alergenos = new ArrayList<>();

    @Builder.Default
    private List<String> cocinasFavoritas = new ArrayList<>();

    private String tipoDieta;

    private List<String> ingredientesNoDeseados;

    private String nivelDificultad;

    private Integer tiempoCoccionMax;

    @Builder.Default
    private Integer stockMinimoGlobal = 1;

}
