package com.myfoodie.api.controller;

import com.myfoodie.application.dto.reporte.ReporteRequestDTO;
import com.myfoodie.application.dto.reporte.ReporteResponseDTO;
import com.myfoodie.application.service.ReporteService;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final ReporteService reporteService;
    private final UsuarioRepository usuarioRepository;

    @PostMapping
    public ResponseEntity<ReporteResponseDTO> crear(
            @Valid @RequestBody ReporteRequestDTO dto,
            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                reporteService.crearReporte(getUsuarioId(principal), dto.tipoContenido(), dto.contenidoId(),
                        dto.motivo(), dto.descripcionAdicional()));
    }

    private String getUsuarioId(Principal principal) {
        return usuarioRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"))
                .getId();
    }
}
