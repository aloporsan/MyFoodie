package com.myfoodie.application.dto.feed;

import java.util.List;

public record ContextoSocialDTO(
        Boolean publicadaPorSeguido,
        Boolean autorEsSeguido,
        List<String> seguidosQueDieronLike,
        Boolean compartidaContigo,
        String textoContexto
) {}
