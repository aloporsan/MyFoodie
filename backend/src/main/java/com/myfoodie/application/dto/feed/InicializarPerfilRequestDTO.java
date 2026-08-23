package com.myfoodie.application.dto.feed;

import java.util.List;

public record InicializarPerfilRequestDTO(
        List<String> tiposCocinaPreferidos,
        String tiempoDisponible
) {}
