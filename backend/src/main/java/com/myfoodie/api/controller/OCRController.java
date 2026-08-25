package com.myfoodie.api.controller;

import com.myfoodie.application.dto.despensa.ProductoRequestDTO;
import com.myfoodie.application.dto.despensa.ProductoUpdateCantidadDTO;
import com.myfoodie.application.dto.ocr.ProductoConfirmadoOCRDTO;
import com.myfoodie.application.dto.ocr.ProductoTicketDTO;
import com.myfoodie.application.dto.ocr.ResultadoOCRDTO;
import com.myfoodie.application.dto.ocr.ResumenConfirmacionOCRDTO;
import com.myfoodie.application.service.DespensaService;
import com.myfoodie.application.service.OCRService;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@RestController
@RequestMapping("/api/despensa/ocr")
@RequiredArgsConstructor
public class OCRController {

    private static final long TAMANO_MAXIMO_BYTES = 10L * 1024 * 1024;
    private static final Set<String> FORMATOS_ACEPTADOS = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp");

    private final OCRService ocrService;
    private final DespensaService despensaService;
    private final UsuarioRepository usuarioRepository;

    @PostMapping("/procesar")
    public ResponseEntity<List<ResultadoOCRDTO>> procesarTicket(
            @RequestParam(value = "imagen", required = false) MultipartFile imagen,
            Principal principal) {
        validarImagen(imagen);
        String usuarioId = getUsuarioId(principal);

        byte[] bytes;
        try {
            bytes = imagen.getBytes();
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No se pudo leer el archivo de imagen");
        }

        String textoCompleto = ocrService.extraerTextoDeImagen(bytes);
        List<ProductoTicketDTO> productosDetectados = ocrService.procesarTextoTicket(textoCompleto);
        List<ResultadoOCRDTO> resultados = ocrService.procesarProductosTicket(usuarioId, productosDetectados);
        return ResponseEntity.ok(resultados);
    }

    @PostMapping("/confirmar")
    public ResponseEntity<ResumenConfirmacionOCRDTO> confirmarProductos(
            @RequestBody(required = false) List<ProductoConfirmadoOCRDTO> productos,
            Principal principal) {
        if (productos == null || productos.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Debes enviar al menos un producto");
        }
        String usuarioId = getUsuarioId(principal);

        int añadidos = 0;
        int actualizados = 0;
        int ignorados = 0;

        for (ProductoConfirmadoOCRDTO producto : productos) {
            switch (producto.accion()) {
                case "actualizado" -> {
                    despensaService.actualizarCantidad(usuarioId, producto.productoExistenteId(),
                            new ProductoUpdateCantidadDTO(
                                    producto.cantidad() != null ? producto.cantidad().doubleValue() : 0,
                                    null, null, "Añadido desde ticket OCR"));
                    actualizados++;
                }
                case "nuevo" -> {
                    despensaService.añadirProducto(usuarioId, new ProductoRequestDTO(
                            producto.nombre(),
                            producto.cantidad() != null ? producto.cantidad() : 0,
                            producto.unidad(),
                            producto.categoria(),
                            producto.fechaCaducidad(),
                            LocalDate.now(),
                            producto.marca(), producto.notas(), producto.stockMinimo()));
                    añadidos++;
                }
                case "ignorado" -> ignorados++;
                default -> throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Acción no reconocida: " + producto.accion());
            }
        }

        return ResponseEntity.ok(new ResumenConfirmacionOCRDTO(añadidos, actualizados, ignorados));
    }

    private void validarImagen(MultipartFile imagen) {
        if (imagen == null || imagen.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Debes adjuntar una imagen del ticket");
        }
        if (imagen.getSize() > TAMANO_MAXIMO_BYTES) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La imagen no puede superar los 10MB");
        }
        String contentType = imagen.getContentType();
        if (contentType == null || !FORMATOS_ACEPTADOS.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Formato de imagen no soportado. Usa jpg, jpeg, png o webp");
        }
    }

    private String getUsuarioId(Principal principal) {
        return usuarioRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"))
                .getId();
    }
}
