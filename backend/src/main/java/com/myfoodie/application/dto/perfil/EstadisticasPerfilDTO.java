package com.myfoodie.application.dto.perfil;

import java.time.LocalDateTime;

public record EstadisticasPerfilDTO(
        int totalProductosRegistrados,
        int totalProductosConsumidos,
        int totalProductosCaducados,
        int totalRecetasPublicadas,
        int totalRecetasGuardadas,
        double aprovechamientoDespensa,
        LocalDateTime fechaRegistro,
        int diasEnMyFoodie,
        MotivosEliminacion motivosEliminacion
) {
    public record MotivosEliminacion(
            int consumido,
            int caducado,
            int usado_en_receta,
            int donado,
            int perdido,
            int otro,
            // Eliminaciones por error al registrar el producto: no cuentan como desperdicio.
            int errorTipografia
    ) {}
}
