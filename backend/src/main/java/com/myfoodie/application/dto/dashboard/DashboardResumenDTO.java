package com.myfoodie.application.dto.dashboard;

import java.util.List;

public record DashboardResumenDTO(
        ResumenDespensa resumen,
        List<AlertaCaducidadDTO> alertas,
        List<ProductoPrioritarioDTO> prioritarios,
        EstadisticasDTO estadisticas,
        CarritoResumenDTO carrito,
        RecetaRecomendadaDTO recetas
) {
    public record ResumenDespensa(
            int totalProductos,
            int sinStock,
            int caducados,
            int caduca_pronto,
            int caduca_semana,
            int caduca_mes,
            int bajoStock
    ) {}
}
