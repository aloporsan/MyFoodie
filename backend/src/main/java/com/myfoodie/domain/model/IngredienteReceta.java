package com.myfoodie.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "ingredientes_receta")
public class IngredienteReceta {

    @Id
    private String id;

    @Indexed
    private String recetaId;

    private String nombre;
    private double cantidad;
    private String unidad;
    private String observacion;
}
