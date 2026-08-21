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
@Document(collection = "items_carrito")
public class ItemCarrito {

    @Id
    private String id;

    @Indexed
    private String usuarioId;

    private String nombre;
    private Float cantidad;
    private String unidad;
    private String categoria;

    /** alta | media | baja */
    private String prioridad;

    private String motivo;

    /** pendiente | aceptado | rechazado | comprado */
    @Builder.Default
    private String estado = "pendiente";

    @Builder.Default
    private Boolean noVolver = false;

    private String recetaId;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
