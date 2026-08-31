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
@Document(collection = "movimientos_producto")
public class MovimientoProducto {

    @Id
    private String id;

    @Indexed
    private String productoId;

    @Indexed
    private String despensaId;

    private String usuarioId;

    /** Nombre del producto en el momento del movimiento (se conserva aunque el producto se elimine) */
    private String nombre;

    /** añadido | editado | cantidad_actualizada | eliminado | lote_añadido */
    private String tipo;

    private String descripcion;

    private Double cantidadAnterior;
    private Double cantidadNueva;

    /** consumido | caducado | usado_en_receta | donado | perdido | otro — solo para tipo=eliminado */
    private String motivo;

    /** Texto libre cuando motivo=otro */
    private String motivoDetalle;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
