package com.myfoodie.api.controller;

import com.myfoodie.application.dto.despensa.EliminarProductoRequestDTO;
import com.myfoodie.application.dto.despensa.MovimientoProductoResponseDTO;
import com.myfoodie.application.dto.despensa.ProductoFiltroDTO;
import com.myfoodie.application.dto.despensa.ProductoRequestDTO;
import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import com.myfoodie.application.dto.despensa.ProductoUpdateCantidadDTO;
import com.myfoodie.application.dto.matching.FusionarProductosRequestDTO;
import com.myfoodie.application.dto.matching.IgnorarFusionRequestDTO;
import com.myfoodie.application.dto.matching.MatchProductoDTO;
import com.myfoodie.application.dto.matching.ParDuplicadoDTO;
import com.myfoodie.application.service.DespensaService;
import com.myfoodie.application.service.FusionService;
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
@RequestMapping("/api/despensa/productos")
@RequiredArgsConstructor
public class DespensaController {

    private final DespensaService despensaService;
    private final MatchingService matchingService;
    private final FusionService fusionService;
    private final UsuarioRepository usuarioRepository;

    @GetMapping
    public ResponseEntity<List<ProductoResponseDTO>> listar(
            @RequestParam(required = false) String orderBy,
            Principal principal) {
        return ResponseEntity.ok(despensaService.listarProductos(getUsuarioId(principal), orderBy));
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<ProductoResponseDTO>> buscar(
            @RequestParam String q,
            Principal principal) {
        return ResponseEntity.ok(despensaService.buscarProductos(getUsuarioId(principal), q));
    }

    @GetMapping("/filtrar")
    public ResponseEntity<List<ProductoResponseDTO>> filtrar(
            @ModelAttribute ProductoFiltroDTO filtro,
            Principal principal) {
        return ResponseEntity.ok(despensaService.filtrarProductos(getUsuarioId(principal), filtro));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductoResponseDTO> obtener(
            @PathVariable String id,
            Principal principal) {
        return ResponseEntity.ok(despensaService.obtenerProducto(getUsuarioId(principal), id));
    }

    @PostMapping
    public ResponseEntity<ProductoResponseDTO> añadir(
            @Valid @RequestBody ProductoRequestDTO dto,
            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(despensaService.añadirProducto(getUsuarioId(principal), dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductoResponseDTO> editar(
            @PathVariable String id,
            @Valid @RequestBody ProductoRequestDTO dto,
            Principal principal) {
        return ResponseEntity.ok(despensaService.editarProducto(getUsuarioId(principal), id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable String id,
            @RequestBody(required = false) EliminarProductoRequestDTO dto,
            Principal principal) {
        despensaService.eliminarProducto(getUsuarioId(principal), id, dto);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/historial")
    public ResponseEntity<List<MovimientoProductoResponseDTO>> historial(
            @PathVariable String id,
            Principal principal) {
        return ResponseEntity.ok(despensaService.obtenerHistorial(getUsuarioId(principal), id));
    }

    @PatchMapping("/{id}/cantidad")
    public ResponseEntity<ProductoResponseDTO> actualizarCantidad(
            @PathVariable String id,
            @Valid @RequestBody ProductoUpdateCantidadDTO dto,
            Principal principal) {
        return ResponseEntity.ok(despensaService.actualizarCantidad(getUsuarioId(principal), id, dto));
    }

    @GetMapping("/similares")
    public ResponseEntity<List<MatchProductoDTO>> similares(
            @RequestParam String nombre,
            Principal principal) {
        return ResponseEntity.ok(matchingService.buscarProductoSimilarEnDespensa(getUsuarioId(principal), nombre));
    }

    @GetMapping("/duplicados")
    public ResponseEntity<List<ParDuplicadoDTO>> duplicados(Principal principal) {
        return ResponseEntity.ok(matchingService.buscarDuplicadosEnDespensa(getUsuarioId(principal)));
    }

    @PostMapping("/fusionar")
    public ResponseEntity<ProductoResponseDTO> fusionar(
            @Valid @RequestBody FusionarProductosRequestDTO dto,
            Principal principal) {
        return ResponseEntity.ok(fusionService.fusionarProductos(
                getUsuarioId(principal), dto.productoMantenerId(), dto.productoEliminarId(),
                dto.unidadElegida(), dto.fechaCaducidadElegida()));
    }

    @PostMapping("/ignorar-fusion")
    public ResponseEntity<Void> ignorarFusion(
            @Valid @RequestBody IgnorarFusionRequestDTO dto,
            Principal principal) {
        fusionService.ignorarSugerenciaFusion(getUsuarioId(principal), dto.productoAId(), dto.productoBId());
        return ResponseEntity.ok().build();
    }

    private String getUsuarioId(Principal principal) {
        return usuarioRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"))
                .getId();
    }
}
