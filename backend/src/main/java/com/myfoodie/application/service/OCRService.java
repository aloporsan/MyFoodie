package com.myfoodie.application.service;

import com.google.cloud.vision.v1.AnnotateImageRequest;
import com.google.cloud.vision.v1.AnnotateImageResponse;
import com.google.cloud.vision.v1.BatchAnnotateImagesResponse;
import com.google.cloud.vision.v1.Feature;
import com.google.cloud.vision.v1.Image;
import com.google.cloud.vision.v1.ImageAnnotatorClient;
import com.google.protobuf.ByteString;
import com.myfoodie.application.dto.matching.MatchProductoDTO;
import com.myfoodie.application.dto.ocr.ProductoTicketDTO;
import com.myfoodie.application.dto.ocr.ResultadoOCRDTO;
import com.myfoodie.exception.ApiException;
import com.myfoodie.domain.model.Producto;
import com.myfoodie.domain.model.TipoMatch;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class OCRService {

    private final MatchingService matchingService;

    public OCRService(MatchingService matchingService) {
        this.matchingService = matchingService;
    }

    private static final Set<String> PALABRAS_CLAVE_TICKET = Set.of(
            "TOTAL", "IVA", "TICKET", "FECHA", "CAJERO", "GRACIAS", "IMPORTE", "BOLSA");

    private static final Pattern SOLO_NUMEROS = Pattern.compile("^[0-9.,\\s€$-]+$");
    private static final Pattern CODIGO_PRODUCTO = Pattern.compile("^\\d{4,8}\\s+");
    private static final Pattern CANTIDAD_MULTIPLICADOR = Pattern.compile(
            "^(\\d+(?:[.,]\\d+)?)\\s*[xX]\\s+");
    private static final Pattern CANTIDAD_UNIDADES = Pattern.compile(
            "^(\\d+(?:[.,]\\d+)?)\\s*(UN|UD|unidades?)\\.?\\s+", Pattern.CASE_INSENSITIVE);
    // Algunos tickets ponen la cantidad suelta al principio, sin "x" ni "UD" detrás
    // (p. ej. "2 TOMATE FRITO"). Se limita a 1-3 dígitos para no confundirla con un
    // código de producto de 4-8 dígitos, que ya se elimina aparte con CODIGO_PRODUCTO.
    private static final Pattern CANTIDAD_INICIAL = Pattern.compile("^(\\d{1,3}(?:[.,]\\d+)?)\\s+(?=\\D)");
    private static final Pattern PRECIO_FINAL = Pattern.compile(
            "\\s+\\d+[.,]\\d{2}\\s*(?:€|\\$)?\\s*$");
    private static final Pattern UNIDAD_MEDIDA = Pattern.compile(
            "\\b\\d+(?:[.,]\\d+)?\\s*(ml|kg|gr|g|l|oz|lb)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern ESPACIOS = Pattern.compile("\\s+");

    public String extraerTextoDeImagen(byte[] imagenBytes) {
        try (ImageAnnotatorClient client = ImageAnnotatorClient.create()) {
            ByteString contenido = ByteString.copyFrom(imagenBytes);
            Image imagen = Image.newBuilder().setContent(contenido).build();
            // DOCUMENT_TEXT_DETECTION (no TEXT_DETECTION) está pensado para texto denso y
            // estructurado como documentos y tickets: da un orden de lectura mucho más fiable
            // que el modo genérico, que está optimizado para texto suelto en fotos.
            Feature feature = Feature.newBuilder().setType(Feature.Type.DOCUMENT_TEXT_DETECTION).build();
            AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                    .addFeatures(feature)
                    .setImage(imagen)
                    .build();

            BatchAnnotateImagesResponse response = client.batchAnnotateImages(List.of(request));
            AnnotateImageResponse resultado = response.getResponses(0);

            if (resultado.hasError()) {
                throw new ApiException(HttpStatus.BAD_GATEWAY,
                        "No se pudo procesar la imagen con Google Vision: " + resultado.getError().getMessage());
            }

            return resultado.getFullTextAnnotation().getText();
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "No se pudo conectar con Google Vision API: " + e.getMessage());
        }
    }

    public List<ProductoTicketDTO> procesarTextoTicket(String textoCompleto) {
        List<ProductoTicketDTO> productos = new ArrayList<>();
        if (textoCompleto == null || textoCompleto.isBlank()) {
            return productos;
        }

        for (String lineaOriginal : textoCompleto.split("\\R")) {
            String linea = lineaOriginal.trim();
            if (linea.length() < 3 || esLineaDescartable(linea)) {
                continue;
            }

            ProductoTicketDTO producto = procesarLinea(linea, lineaOriginal);
            if (producto != null) {
                productos.add(producto);
            }
        }

        return productos;
    }

    private boolean esLineaDescartable(String linea) {
        if (SOLO_NUMEROS.matcher(linea).matches()) {
            return true;
        }
        String lineaUpper = linea.toUpperCase(Locale.ROOT);
        return PALABRAS_CLAVE_TICKET.stream().anyMatch(lineaUpper::contains);
    }

    private ProductoTicketDTO procesarLinea(String linea, String lineaOriginal) {
        String resto = CODIGO_PRODUCTO.matcher(linea).replaceFirst("");

        Float cantidadDetectada = null;
        Matcher matcherCantidad = CANTIDAD_MULTIPLICADOR.matcher(resto);
        if (matcherCantidad.find()) {
            cantidadDetectada = parseFloat(matcherCantidad.group(1));
            resto = matcherCantidad.replaceFirst("");
        } else {
            matcherCantidad = CANTIDAD_UNIDADES.matcher(resto);
            if (matcherCantidad.find()) {
                cantidadDetectada = parseFloat(matcherCantidad.group(1));
                resto = matcherCantidad.replaceFirst("");
            } else {
                matcherCantidad = CANTIDAD_INICIAL.matcher(resto);
                if (matcherCantidad.find()) {
                    cantidadDetectada = parseFloat(matcherCantidad.group(1));
                    resto = matcherCantidad.replaceFirst("");
                }
            }
        }

        resto = PRECIO_FINAL.matcher(resto).replaceFirst("");

        String unidadDetectada = null;
        Matcher matcherUnidad = UNIDAD_MEDIDA.matcher(resto);
        if (matcherUnidad.find()) {
            unidadDetectada = matcherUnidad.group(1).toLowerCase(Locale.ROOT);
            resto = resto.substring(0, matcherUnidad.start()) + resto.substring(matcherUnidad.end());
        }

        String nombreDetectado = ESPACIOS.matcher(resto).replaceAll(" ").trim();
        if (nombreDetectado.length() < 3) {
            return null;
        }

        return new ProductoTicketDTO(nombreDetectado, cantidadDetectada, unidadDetectada, lineaOriginal);
    }

    private Float parseFloat(String valor) {
        return Float.valueOf(valor.replace(",", "."));
    }

    // Un mismo producto puede pasar dos veces por caja (p. ej. se coge una segunda unidad
    // a mitad de la compra) y aparecer como dos líneas distintas del ticket. Las unificamos
    // antes de comparar contra la despensa, sumando cantidades, para no proponerlas como
    // dos productos nuevos separados.
    private List<ProductoTicketDTO> fusionarLineasDuplicadas(List<ProductoTicketDTO> productos) {
        Map<String, ProductoTicketDTO> fusionados = new LinkedHashMap<>();
        for (ProductoTicketDTO producto : productos) {
            String clave = matchingService.aplicarSinonimos(matchingService.normalizar(producto.nombreDetectado()));
            ProductoTicketDTO existente = fusionados.get(clave);
            if (existente == null) {
                fusionados.put(clave, producto);
                continue;
            }
            Float cantidadExistenteRaw = existente.cantidadDetectada();
            Float cantidadNuevaRaw = producto.cantidadDetectada();
            float cantidadExistente = cantidadExistenteRaw != null ? cantidadExistenteRaw : 1f;
            float cantidadNueva = cantidadNuevaRaw != null ? cantidadNuevaRaw : 1f;
            fusionados.put(clave, new ProductoTicketDTO(
                    existente.nombreDetectado(),
                    cantidadExistente + cantidadNueva,
                    existente.unidadDetectada() != null ? existente.unidadDetectada() : producto.unidadDetectada(),
                    existente.lineaOriginal() + " + " + producto.lineaOriginal()));
        }
        return new ArrayList<>(fusionados.values());
    }

    // Decisión de diseño: el matching de líneas de ticket contra la despensa es mayoritariamente
    // manual a propósito. El OCR de un ticket introduce mucho ruido (abreviaturas, cortes, códigos)
    // y confundir dos productos distintos al actualizar stock es peor que pedir una confirmación de
    // más. Por eso el umbral AUTOMATICO de MatchingService está en 0,99: solo se actualiza sin
    // preguntar cuando el nombre es casi idéntico; el resto cae en "sugerencia" y decide el usuario.
    // Es un sesgo conservador buscado, no una limitación del algoritmo.
    public List<ResultadoOCRDTO> procesarProductosTicket(String usuarioId, List<ProductoTicketDTO> productosDetectados) {
        List<ProductoTicketDTO> productos = fusionarLineasDuplicadas(productosDetectados);
        List<ResultadoOCRDTO> resultados = new ArrayList<>();

        // Despensa y umbral se cargan una única vez fuera del bucle (evita repetir las
        // mismas consultas a Mongo por cada línea detectada del ticket).
        List<Producto> productosDespensa = matchingService.productosDeDespensa(usuarioId);
        int globalUmbral = matchingService.umbralGlobal(usuarioId);

        for (ProductoTicketDTO producto : productos) {
            List<MatchProductoDTO> matches = matchingService.buscarProductoSimilarEnDespensa(
                    productosDespensa, globalUmbral, producto.nombreDetectado());

            if (matches.isEmpty()) {
                resultados.add(new ResultadoOCRDTO(producto, "nuevo", null, null, null));
                continue;
            }

            MatchProductoDTO mejorMatch = matches.get(0);
            String accion = mejorMatch.tipoMatch() == TipoMatch.AUTOMATICO ? "actualizado" : "sugerencia";
            String mensajeSugerencia = accion.equals("sugerencia") ? mejorMatch.textoSugerido() : null;

            resultados.add(new ResultadoOCRDTO(
                    producto, accion, mejorMatch.producto(), mejorMatch.similitud(), mensajeSugerencia));
        }

        return resultados;
    }
}
