package com.myfoodie.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfiguracionPrivacidad {

    @Builder.Default
    private boolean perfilPublico = true;

    @Builder.Default
    private boolean mostrarRecetas = true;

    @Builder.Default
    private boolean mostrarEstadisticas = true;

    @Builder.Default
    private boolean permitirMensajes = true;
}
