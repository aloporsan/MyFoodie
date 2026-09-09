package com.myfoodie.api.controller;

import com.myfoodie.application.dto.carrito.AñadirCompradosResponseDTO;
import com.myfoodie.application.dto.carrito.AñadirItemCarritoResponseDTO;
import com.myfoodie.application.dto.carrito.CarritoDTO;
import com.myfoodie.application.dto.carrito.ItemCarritoCantidadDTO;
import com.myfoodie.application.dto.carrito.ItemCarritoRequestDTO;
import com.myfoodie.application.dto.carrito.ItemCarritoResponseDTO;
import com.myfoodie.application.dto.carrito.ItemCompradoAjusteDTO;
import com.myfoodie.application.dto.carrito.ListaCompraRequestDTO;
import com.myfoodie.application.dto.carrito.ListaCompraResponseDTO;
import com.myfoodie.application.dto.matching.MatchItemCarritoDTO;
import com.myfoodie.application.dto.matching.ResultadoAñadirDespensaDTO;
import com.myfoodie.application.service.CarritoInteligenteService;
import com.myfoodie.application.service.MatchingService;
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
    private final MatchingService matchingService;
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

    @PutMapping("/items/{id}/recuperar")
    public ResponseEntity<ItemCarritoResponseDTO> recuperar(@PathVariable String id, Principal principal) {
        return ResponseEntity.ok(carritoInteligenteService.recuperarItem(getUsuarioId(principal), id));
    }

    @PutMapping("/items/{id}/cantidad")
    public ResponseEntity<ItemCarritoResponseDTO> modificarCantidad(
            @PathVariable String id,
            @Valid @RequestBody ItemCarritoCantidadDTO dto,
            Principal principal) {
        return ResponseEntity.ok(
                carritoInteligenteService.modificarCantidad(getUsuarioId(principal), id, dto.cantidad(), dto.unidad()));
    }

    @PostMapping("/items")
    public ResponseEntity<AñadirItemCarritoResponseDTO> añadirItemManual(
            @Valid @RequestBody ItemCarritoRequestDTO dto,
            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(carritoInteligenteService.añadirItemManual(getUsuarioId(principal), dto));
    }

    @GetMapping("/items/similares")
    public ResponseEntity<List<MatchItemCarritoDTO>> similares(
            @RequestParam String nombre,
            Principal principal) {
        return ResponseEntity.ok(matchingService.buscarItemSimilarEnCarrito(getUsuarioId(principal), nombre));
    }

    @DeleteMapping("/items/rechazados")
    public ResponseEntity<Void> eliminarItemsRechazados(Principal principal) {
        carritoInteligenteService.eliminarItemsRechazados(getUsuarioId(principal));
        return ResponseEntity.noContent().build();
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

    @GetMapping("/listas/activa")
    public ResponseEntity<ListaCompraResponseDTO> obtenerListaActiva(Principal principal) {
        ListaCompraResponseDTO lista = carritoInteligenteService.obtenerListaActiva(getUsuarioId(principal));
        return lista != null ? ResponseEntity.ok(lista) : ResponseEntity.noContent().build();
    }

    @GetMapping("/listas/{id}")
    public ResponseEntity<ListaCompraResponseDTO> obtenerLista(@PathVariable String id, Principal principal) {
        return ResponseEntity.ok(carritoInteligenteService.obtenerListaCompra(getUsuarioId(principal), id));
    }

    @PutMapping("/listas/{id}/cancelar")
    public ResponseEntity<Void> cancelarLista(@PathVariable String id, Principal principal) {
        carritoInteligenteService.cancelarListaCompra(getUsuarioId(principal), id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/listas/{id}/items/{itemId}/comprado")
    public ResponseEntity<ItemCarritoResponseDTO> marcarComprado(
            @PathVariable String id,
            @PathVariable String itemId,
            Principal principal) {
        return ResponseEntity.ok(carritoInteligenteService.marcarItemComoComprado(getUsuarioId(principal), itemId));
    }

    @PostMapping("/listas/{id}/añadir-despensa")
    public ResponseEntity<AñadirCompradosResponseDTO> añadirCompradosADespensa(
            @PathVariable String id,
            @RequestBody(required = false) List<ItemCompradoAjusteDTO> ajustes,
            Principal principal) {
        String usuarioId = getUsuarioId(principal);
        List<ResultadoAñadirDespensaDTO> resultados =
                carritoInteligenteService.añadirProductosCompradosADespensa(usuarioId, id, ajustes);
        ListaCompraResponseDTO lista = carritoInteligenteService.obtenerListaCompra(usuarioId, id);
        return ResponseEntity.ok(new AñadirCompradosResponseDTO(resultados, lista));
    }

    private String getUsuarioId(Principal principal) {
        return usuarioRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"))
                .getId();
    }
}
