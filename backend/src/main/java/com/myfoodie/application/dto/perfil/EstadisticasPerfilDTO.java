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
        MotivosEliminacion motivosEliminacion
) {
    public record MotivosEliminacion(
            int consumido,
            int caducado,
            int usado_en_receta,
            int donado,
            int perdido,
            int otro
    ) {}
}
