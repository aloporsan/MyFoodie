package com.myfoodie.application.dto.carrito;

import com.myfoodie.application.dto.matching.ResultadoAñadirDespensaDTO;

import java.util.List;

public record AñadirCompradosResponseDTO(
        List<ResultadoAñadirDespensaDTO> resultados,
        ListaCompraResponseDTO lista
) {}
