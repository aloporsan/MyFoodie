package com.myfoodie.application.dto.notificacion;

public record PreferenciasNotificacionDTO(
        Boolean notificarNuevoSeguidor,
        Boolean notificarSolicitudSeguimiento,
        Boolean notificarLikes,
        Boolean notificarComentarios,
        Boolean notificarRecetasCompartidas,
        Boolean notificarCaducidades,
        Boolean notificarCarrito
) {}
