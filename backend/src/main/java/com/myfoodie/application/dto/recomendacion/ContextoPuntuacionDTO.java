package com.myfoodie.application.dto.recomendacion;

import java.time.LocalDateTime;
import java.util.List;

public record ContextoPuntuacionDTO(
        double coincidenciaDespensa,
        boolean tieneIngredientesProximosACaducar,
        List<String> seguidosQueDieronLike,
        boolean compartidaPorSeguido,
        LocalDateTime fechaDescarte
) {}
