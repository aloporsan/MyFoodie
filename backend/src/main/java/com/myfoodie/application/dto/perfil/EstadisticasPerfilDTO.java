package com.myfoodie.application.dto.perfil;

import java.time.LocalDateTime;

public record EstadisticasPerfilDTO(
        int totalProductosRegistrados,
        int totalProductosConsumidos,
        int totalProductosCaducados,
        int totalRecetasPublicadas,
        int totalRecetasGuardadas,
        LocalDateTime fechaRegistro
) {}
