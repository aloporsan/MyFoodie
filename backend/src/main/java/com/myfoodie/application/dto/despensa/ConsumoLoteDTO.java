package com.myfoodie.application.dto.despensa;

import java.time.LocalDate;

// Desglose de un consumo FIFO: de qué lote concreto se descontó, cuánto, y qué le queda.
// Permite al frontend mostrar "se ha consumido de: lote de tal fecha, -N unidades" en vez
// de solo enseñar la cantidad total ya restada.
public record ConsumoLoteDTO(
        String loteId,
        LocalDate fechaCaducidad,
        float cantidadConsumida,
        float cantidadRestante,
        boolean loteEliminado
) {}
