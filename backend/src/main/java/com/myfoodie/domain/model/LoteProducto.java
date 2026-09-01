package com.myfoodie.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "lotes_producto")
public class LoteProducto {

    @Id
    private String id;

    @Indexed
    private String productoId;

    @Indexed
    private String despensaId;

    @Indexed
    private String usuarioId;

    private Float cantidad;
    private String unidad;
    private LocalDate fechaCaducidad;
    private LocalDate fechaCompra;

    /** manual | ocr | carrito | receta */
    private String origen;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
