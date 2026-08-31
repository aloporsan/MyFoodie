package com.myfoodie.application.dto.receta;

import com.myfoodie.domain.model.TipoMatch;

public record IngredienteConsumoDTO(
        String nombre,
        double cantidadCalculada,
        String unidad,
        boolean productoEnDespensa,
        double cantidadDisponible,
        boolean suficiente,
        boolean noComparable,
        TipoMatch tipoMatch
) {}
