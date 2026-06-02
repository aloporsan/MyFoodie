package com.myfoodie.application.service;

import com.myfoodie.application.dto.dashboard.AlertaCaducidadDTO;
import com.myfoodie.application.dto.dashboard.DashboardResumenDTO;
import com.myfoodie.application.dto.dashboard.EstadisticasDTO;
import com.myfoodie.application.dto.dashboard.ProductoPrioritarioDTO;
import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final DespensaService despensaService;

    // -------------------------------------------------------------------------
    // COMMIT 1 — Resumen general y alertas
    // -------------------------------------------------------------------------

    public DashboardResumenDTO.ResumenDespensa obtenerResumenDespensa(String usuarioId) {
        List<ProductoResponseDTO> productos = despensaService.listarProductos(usuarioId);

        int total          = productos.size();
        int proximosCaducar = contarPorEstado(productos, "proximoCaducar");
        int caducados      = contarPorEstado(productos, "caducado");
        int bajoStock      = contarPorEstado(productos, "bajoStock");

        return new DashboardResumenDTO.ResumenDespensa(total, proximosCaducar, caducados, bajoStock);
    }

    public List<AlertaCaducidadDTO> obtenerAlertasCaducidad(String usuarioId) {
        List<ProductoResponseDTO> productos = despensaService.listarProductos(usuarioId);

        return productos.stream()
                .filter(p -> "caducado".equals(p.estado()) || "proximoCaducar".equals(p.estado()))
                .sorted(Comparator
                        .comparingInt((ProductoResponseDTO p) -> "caducado".equals(p.estado()) ? 0 : 1)
                        .thenComparing(p -> p.fechaCaducidad() != null
                                ? p.fechaCaducidad() : LocalDate.MAX))
                .map(p -> {
                    long dias = p.fechaCaducidad() != null
                            ? ChronoUnit.DAYS.between(LocalDate.now(), p.fechaCaducidad())
                            : Long.MIN_VALUE;
                    return new AlertaCaducidadDTO(
                            p.id(), p.nombre(), p.cantidad(), p.unidad(),
                            p.fechaCaducidad(), p.estado(), dias);
                })
                .toList();
    }

    // -------------------------------------------------------------------------
    // COMMIT 2 — Productos prioritarios y estadísticas
    // -------------------------------------------------------------------------

    public List<ProductoPrioritarioDTO> obtenerProductosPrioritarios(String usuarioId) {
        List<ProductoResponseDTO> productos = despensaService.listarProductos(usuarioId);
        LocalDate hace7Dias = LocalDate.now().minusDays(7);

        List<ProductoPrioritarioDTO> resultado = new ArrayList<>();
        Set<String> incluidos = new HashSet<>();

        agregarPrioritarios(productos, "caducado",       "caducado",         incluidos, resultado);
        agregarPrioritarios(productos, "proximoCaducar", "proximoCaducar",   incluidos, resultado);
        agregarPrioritarios(productos, "bajoStock",      "bajoStock",        incluidos, resultado);

        // Añadidos en los últimos 7 días (cualquier estado no cubierto aún)
        if (resultado.size() < 5) {
            productos.stream()
                    .filter(p -> !incluidos.contains(p.id())
                            && p.createdAt() != null
                            && p.createdAt().toLocalDate().isAfter(hace7Dias))
                    .limit(5L - resultado.size())
                    .forEach(p -> {
                        incluidos.add(p.id());
                        resultado.add(toPrioritario(p, "recienteAnadido"));
                    });
        }

        return resultado;
    }

    public EstadisticasDTO obtenerEstadisticas(String usuarioId) {
        List<ProductoResponseDTO> productos = despensaService.listarProductos(usuarioId);

        int total     = productos.size();
        int caducados = contarPorEstado(productos, "caducado");

        String categoriaLider = productos.stream()
                .filter(p -> p.categoria() != null && !p.categoria().isBlank())
                .collect(Collectors.groupingBy(ProductoResponseDTO::categoria, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("-");

        double aprovechamiento = total == 0 ? 100.0
                : Math.round((double) contarPorEstado(productos, "normal") / total * 1000.0) / 10.0;

        return new EstadisticasDTO(
                total,
                0,          // consumidos: pendiente de tracking en Fase 2
                caducados,  // caducadosHistorico: proxy con actuales (histórico en Fase 2)
                categoriaLider,
                aprovechamiento);
    }

    // -------------------------------------------------------------------------
    // Helpers compartidos
    // -------------------------------------------------------------------------

    private int contarPorEstado(List<ProductoResponseDTO> productos, String estado) {
        return (int) productos.stream().filter(p -> estado.equals(p.estado())).count();
    }

    private void agregarPrioritarios(List<ProductoResponseDTO> productos, String estado,
                                     String motivo, Set<String> incluidos,
                                     List<ProductoPrioritarioDTO> resultado) {
        if (resultado.size() >= 5) return;
        productos.stream()
                .filter(p -> estado.equals(p.estado()) && !incluidos.contains(p.id()))
                .limit(5L - resultado.size())
                .forEach(p -> {
                    incluidos.add(p.id());
                    resultado.add(toPrioritario(p, motivo));
                });
    }

    private ProductoPrioritarioDTO toPrioritario(ProductoResponseDTO p, String motivo) {
        return new ProductoPrioritarioDTO(p.id(), p.nombre(), p.cantidad(), p.unidad(),
                p.estado(), motivo);
    }
}
