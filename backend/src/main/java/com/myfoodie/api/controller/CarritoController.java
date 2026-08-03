package com.myfoodie.api.controller;

import com.myfoodie.application.dto.carrito.CarritoDTO;
import com.myfoodie.application.dto.carrito.ItemCarritoCantidadDTO;
import com.myfoodie.application.dto.carrito.ItemCarritoRequestDTO;
import com.myfoodie.application.dto.carrito.ItemCarritoResponseDTO;
import com.myfoodie.application.dto.carrito.ListaCompraRequestDTO;
import com.myfoodie.application.dto.carrito.ListaCompraResponseDTO;
import com.myfoodie.application.service.CarritoInteligenteService;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/carrito")
@RequiredArgsConstructor
public class CarritoController {

    private final CarritoInteligenteService carritoInteligenteService;
    private final UsuarioRepository usuarioRepository;

    @GetMapping
    public ResponseEntity<CarritoDTO> obtenerCarrito(Principal principal) {
        return ResponseEntity.ok(carritoInteligenteService.obtenerCarrito(getUsuarioId(principal)));
    }

    @PostMapping("/generar")
    public ResponseEntity<CarritoDTO> generar(Principal principal) {
        String usuarioId = getUsuarioId(principal);
        carritoInteligenteService.generarRecomendaciones(usuarioId);
        return ResponseEntity.ok(carritoInteligenteService.obtenerCarrito(usuarioId));
    }

    @PutMapping("/items/{id}/aceptar")
    public ResponseEntity<ItemCarritoResponseDTO> aceptar(@PathVariable String id, Principal principal) {
        return ResponseEntity.ok(carritoInteligenteService.aceptarItem(getUsuarioId(principal), id));
    }

    @PutMapping("/items/{id}/rechazar")
    public ResponseEntity<ItemCarritoResponseDTO> rechazar(@PathVariable String id, Principal principal) {
        return ResponseEntity.ok(carritoInteligenteService.rechazarItem(getUsuarioId(principal), id));
    }

    @PutMapping("/items/{id}/no-volver")
    public ResponseEntity<ItemCarritoResponseDTO> noVolver(@PathVariable String id, Principal principal) {
        return ResponseEntity.ok(carritoInteligenteService.marcarNoVolver(getUsuarioId(principal), id));
    }

    @PutMapping("/items/{id}/cantidad")
    public ResponseEntity<ItemCarritoResponseDTO> modificarCantidad(
            @PathVariable String id,
            @Valid @RequestBody ItemCarritoCantidadDTO dto,
            Principal principal) {
        return ResponseEntity.ok(
                carritoInteligenteService.modificarCantidad(getUsuarioId(principal), id, dto.cantidad()));
    }

    @PostMapping("/items")
    public ResponseEntity<ItemCarritoResponseDTO> añadirItemManual(
            @Valid @RequestBody ItemCarritoRequestDTO dto,
            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(carritoInteligenteService.añadirItemManual(getUsuarioId(principal), dto));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<Void> eliminarItem(@PathVariable String id, Principal principal) {
        carritoInteligenteService.eliminarItem(getUsuarioId(principal), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/lista")
    public ResponseEntity<ListaCompraResponseDTO> generarListaCompra(
            @RequestBody(required = false) ListaCompraRequestDTO dto,
            Principal principal) {
        String nombre = dto != null ? dto.nombre() : null;
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(carritoInteligenteService.generarListaCompra(getUsuarioId(principal), nombre));
    }

    @GetMapping("/listas")
    public ResponseEntity<List<ListaCompraResponseDTO>> obtenerListas(Principal principal) {
        return ResponseEntity.ok(carritoInteligenteService.obtenerListasCompra(getUsuarioId(principal)));
    }

    @GetMapping("/listas/{id}")
    public ResponseEntity<ListaCompraResponseDTO> obtenerLista(@PathVariable String id, Principal principal) {
        return ResponseEntity.ok(carritoInteligenteService.obtenerListaCompra(getUsuarioId(principal), id));
    }

    @PutMapping("/listas/{id}/items/{itemId}/comprado")
    public ResponseEntity<ItemCarritoResponseDTO> marcarComprado(
            @PathVariable String id,
            @PathVariable String itemId,
            Principal principal) {
        return ResponseEntity.ok(carritoInteligenteService.marcarItemComoComprado(getUsuarioId(principal), itemId));
    }

    @PostMapping("/listas/{id}/añadir-despensa")
    public ResponseEntity<ListaCompraResponseDTO> añadirCompradosADespensa(
            @PathVariable String id,
            Principal principal) {
        String usuarioId = getUsuarioId(principal);
        carritoInteligenteService.añadirProductosCompradosADespensa(usuarioId, id);
        return ResponseEntity.ok(carritoInteligenteService.obtenerListaCompra(usuarioId, id));
    }

    private String getUsuarioId(Principal principal) {
        return usuarioRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"))
                .getId();
    }
}
