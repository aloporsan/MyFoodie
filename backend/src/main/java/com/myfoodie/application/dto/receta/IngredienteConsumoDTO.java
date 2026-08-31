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
        TipoMatch tipoMatch,
        // Solo presentes cuando hay un producto candidato en despensa (tipoMatch != NUEVO):
        // permiten al frontend, ante una coincidencia parcial (PROPONER), confirmar el
        // descuento contra este producto concreto llamando al endpoint genérico de cantidad.
        String productoId,
        String productoNombre
) {}
