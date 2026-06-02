package com.myfoodie.api.controller;

import com.myfoodie.application.dto.dashboard.AlertaCaducidadDTO;
import com.myfoodie.application.dto.dashboard.CarritoResumenDTO;
import com.myfoodie.application.dto.dashboard.DashboardResumenDTO;
import com.myfoodie.application.dto.dashboard.EstadisticasDTO;
import com.myfoodie.application.dto.dashboard.ProductoPrioritarioDTO;
import com.myfoodie.application.dto.dashboard.RecetaRecomendadaDTO;
import com.myfoodie.application.service.DashboardService;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final UsuarioRepository usuarioRepository;

    @GetMapping("/resumen")
    public ResponseEntity<DashboardResumenDTO.ResumenDespensa> resumen(Principal principal) {
        return ResponseEntity.ok(dashboardService.obtenerResumenDespensa(getUsuarioId(principal)));
    }

    @GetMapping("/alertas")
    public ResponseEntity<List<AlertaCaducidadDTO>> alertas(Principal principal) {
        return ResponseEntity.ok(dashboardService.obtenerAlertasCaducidad(getUsuarioId(principal)));
    }

    @GetMapping("/prioritarios")
    public ResponseEntity<List<ProductoPrioritarioDTO>> prioritarios(Principal principal) {
        return ResponseEntity.ok(dashboardService.obtenerProductosPrioritarios(getUsuarioId(principal)));
    }

    @GetMapping("/estadisticas")
    public ResponseEntity<EstadisticasDTO> estadisticas(Principal principal) {
        return ResponseEntity.ok(dashboardService.obtenerEstadisticas(getUsuarioId(principal)));
    }

    @GetMapping("/carrito")
    public ResponseEntity<CarritoResumenDTO> carrito(Principal principal) {
        return ResponseEntity.ok(dashboardService.obtenerResumenCarrito(getUsuarioId(principal)));
    }

    @GetMapping("/recetas")
    public ResponseEntity<RecetaRecomendadaDTO> recetas(Principal principal) {
        return ResponseEntity.ok(dashboardService.obtenerRecetasRecomendadas(getUsuarioId(principal)));
    }

    @GetMapping
    public ResponseEntity<DashboardResumenDTO> dashboard(Principal principal) {
        String usuarioId = getUsuarioId(principal);

        CompletableFuture<DashboardResumenDTO.ResumenDespensa> resumenFuture =
                CompletableFuture.supplyAsync(() -> dashboardService.obtenerResumenDespensa(usuarioId));
        CompletableFuture<List<AlertaCaducidadDTO>> alertasFuture =
                CompletableFuture.supplyAsync(() -> dashboardService.obtenerAlertasCaducidad(usuarioId));
        CompletableFuture<List<ProductoPrioritarioDTO>> prioritariosFuture =
                CompletableFuture.supplyAsync(() -> dashboardService.obtenerProductosPrioritarios(usuarioId));
        CompletableFuture<EstadisticasDTO> estadisticasFuture =
                CompletableFuture.supplyAsync(() -> dashboardService.obtenerEstadisticas(usuarioId));
        CompletableFuture<CarritoResumenDTO> carritoFuture =
                CompletableFuture.supplyAsync(() -> dashboardService.obtenerResumenCarrito(usuarioId));
        CompletableFuture<RecetaRecomendadaDTO> recetasFuture =
                CompletableFuture.supplyAsync(() -> dashboardService.obtenerRecetasRecomendadas(usuarioId));

        CompletableFuture.allOf(
                resumenFuture, alertasFuture, prioritariosFuture,
                estadisticasFuture, carritoFuture, recetasFuture
        ).join();

        return ResponseEntity.ok(new DashboardResumenDTO(
                resumenFuture.join(),
                alertasFuture.join(),
                prioritariosFuture.join(),
                estadisticasFuture.join(),
                carritoFuture.join(),
                recetasFuture.join()
        ));
    }

    private String getUsuarioId(Principal principal) {
        return usuarioRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"))
                .getId();
    }
}
