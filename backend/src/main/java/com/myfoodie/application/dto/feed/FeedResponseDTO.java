package com.myfoodie.application.dto.feed;

import java.util.List;

public record FeedResponseDTO(
        List<RecetaFeedDTO> recetas,
        int pagina,
        int totalPaginas,
        boolean hayMas
) {}
