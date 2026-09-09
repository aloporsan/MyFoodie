package com.myfoodie.application.service;

import com.myfoodie.application.dto.historial.HistorialCompraDTO;
import com.myfoodie.domain.model.ItemCarrito;
import com.myfoodie.domain.model.ListaCompra;
import com.myfoodie.domain.model.LoteProducto;
import com.myfoodie.domain.repository.ItemCarritoRepository;
import com.myfoodie.domain.repository.ListaCompraRepository;
import com.myfoodie.domain.repository.LoteProductoRepository;
import com.myfoodie.domain.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class HistorialComprasService {

    private static final List<String> ESTADOS_HISTORIAL = List.of("completada", "archivada");
    private static final String ORIGEN_TICKET_OCR = "ocr";

    private final ListaCompraRepository listaCompraRepository;
    private final ItemCarritoRepository itemCarritoRepository;
    private final LoteProductoRepository loteProductoRepository;
    private final ProductoRepository productoRepository;

    /**
     * Devuelve el historial de compras del usuario (listas completadas/archivadas + tickets OCR)
     * dentro del rango de fechas indicado, ordenado por fecha descendente.
     * Ambos límites del rango son opcionales.
     */
    public List<HistorialCompraDTO> obtenerHistorialCompras(String usuarioId, LocalDate fechaDesde, LocalDate fechaHasta) {
        List<HistorialCompraDTO> historial = new ArrayList<>();
        historial.addAll(historialDeListas(usuarioId, fechaDesde, fechaHasta));
        historial.addAll(historialDeTicketsOcr(usuarioId, fechaDesde, fechaHasta));
        historial.sort(Comparator.comparing(HistorialCompraDTO::fecha).reversed());
        return historial;
    }

    private List<HistorialCompraDTO> historialDeListas(String usuarioId, LocalDate fechaDesde, LocalDate fechaHasta) {
        List<HistorialCompraDTO> resultado = new ArrayList<>();
        for (ListaCompra lista : listaCompraRepository.findByUsuarioIdAndEstadoIn(usuarioId, ESTADOS_HISTORIAL)) {
            LocalDate fecha = (lista.getUpdatedAt() != null ? lista.getUpdatedAt() : lista.getCreatedAt()).toLocalDate();
            if (fueraDeRango(fecha, fechaDesde, fechaHasta)) {
                continue;
            }
            List<String> items = itemCarritoRepository.findAllById(lista.getItems()).stream()
                    .map(ItemCarrito::getNombre)
                    .toList();
            resultado.add(new HistorialCompraDTO(
                    lista.getId(),
                    "lista",
                    lista.getNombre(),
                    fecha,
                    items.size(),
                    items));
        }
        return resultado;
    }

    private List<HistorialCompraDTO> historialDeTicketsOcr(String usuarioId, LocalDate fechaDesde, LocalDate fechaHasta) {
        // Un ticket OCR no se persiste como entidad: su rastro son los lotes de producto con origen "ocr".
        // Los agrupamos por fecha de compra para reconstruir cada ticket.
        Map<LocalDate, List<LoteProducto>> lotesPorFecha = new LinkedHashMap<>();
        for (LoteProducto lote : loteProductoRepository.findByUsuarioIdAndOrigen(usuarioId, ORIGEN_TICKET_OCR)) {
            LocalDate fecha = lote.getFechaCompra() != null
                    ? lote.getFechaCompra()
                    : lote.getCreatedAt().toLocalDate();
            if (fueraDeRango(fecha, fechaDesde, fechaHasta)) {
                continue;
            }
            lotesPorFecha.computeIfAbsent(fecha, f -> new ArrayList<>()).add(lote);
        }
        if (lotesPorFecha.isEmpty()) {
            return List.of();
        }

        List<String> productoIds = lotesPorFecha.values().stream()
                .flatMap(List::stream)
                .map(LoteProducto::getProductoId)
                .distinct()
                .toList();
        Map<String, String> nombrePorProductoId = new LinkedHashMap<>();
        productoRepository.findAllById(productoIds)
                .forEach(p -> nombrePorProductoId.put(p.getId(), p.getNombre()));

        List<HistorialCompraDTO> resultado = new ArrayList<>();
        lotesPorFecha.forEach((fecha, lotes) -> {
            List<String> items = lotes.stream()
                    .map(l -> nombrePorProductoId.getOrDefault(l.getProductoId(), "Producto"))
                    .toList();
            resultado.add(new HistorialCompraDTO(
                    "ticket-" + fecha,
                    "ticket",
                    "Ticket " + fecha,
                    fecha,
                    items.size(),
                    items));
        });
        return resultado;
    }

    private boolean fueraDeRango(LocalDate fecha, LocalDate fechaDesde, LocalDate fechaHasta) {
        return (fechaDesde != null && fecha.isBefore(fechaDesde))
                || (fechaHasta != null && fecha.isAfter(fechaHasta));
    }
}
