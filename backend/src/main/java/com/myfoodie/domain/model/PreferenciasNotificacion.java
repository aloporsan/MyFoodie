package com.myfoodie.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreferenciasNotificacion {

    @Builder.Default
    private boolean notificarNuevoSeguidor = true;

    @Builder.Default
    private boolean notificarSolicitudSeguimiento = true;

    @Builder.Default
    private boolean notificarLikes = true;

    @Builder.Default
    private boolean notificarComentarios = true;

    @Builder.Default
    private boolean notificarRecetasCompartidas = true;

    @Builder.Default
    private boolean notificarCaducidades = true;

    @Builder.Default
    private boolean notificarCarrito = true;
}
