package com.myfoodie.application.dto.historial;

import java.time.LocalDate;
import java.util.List;

/**
 * Entrada del historial de compras. Unifica dos orígenes:
 * <ul>
 *   <li>{@code lista}: una lista de compra completada o archivada.</li>
 *   <li>{@code ticket}: los productos añadidos a la despensa desde un ticket OCR en una misma fecha.</li>
 * </ul>
 */
public record HistorialCompraDTO(
        String id,
        String origen,
        String titulo,
        LocalDate fecha,
        int numeroItems,
        List<String> items
) {}
