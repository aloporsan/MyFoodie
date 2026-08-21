package com.myfoodie.application.dto.receta;

public record IngredienteConsumoDTO(
        String nombre,
        double cantidadCalculada,
        String unidad,
        boolean productoEnDespensa,
        double cantidadDisponible,
        boolean suficiente,
        boolean noComparable
) {}
