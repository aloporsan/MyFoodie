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
@Document(collection = "reportes")
@CompoundIndex(name = "reportante_contenido_idx",
        def = "{'usuarioReportanteId': 1, 'tipoContenido': 1, 'contenidoId': 1}", unique = true)
public class Reporte {

    @Id
    private String id;

    private String usuarioReportanteId;

    private TipoContenidoReporte tipoContenido;

    private String contenidoId;

    private MotivoReporte motivo;

    private String descripcionAdicional;

    @Builder.Default
    private EstadoReporte estado = EstadoReporte.PENDIENTE;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
