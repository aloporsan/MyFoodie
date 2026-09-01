package com.myfoodie.application.dto.receta;

import java.util.List;

public record DescuentoRecetaResponseDTO(
        List<IngredienteConsumoDTO> descontados,
        List<IngredienteConsumoDTO> noDisponibles,
        List<IngredienteConsumoDTO> coincidenciasParciales
) {}
