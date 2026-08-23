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
import com.myfoodie.domain.model.TipoMatch;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class OCRService {

    private final MatchingService matchingService;

    private static final Set<String> PALABRAS_CLAVE_TICKET = Set.of(
            "TOTAL", "IVA", "TICKET", "FECHA", "CAJERO", "GRACIAS", "IMPORTE");

    private static final Pattern SOLO_NUMEROS = Pattern.compile("^[0-9.,\\s€$-]+$");
    private static final Pattern CODIGO_PRODUCTO = Pattern.compile("^\\d{4,8}\\s+");
    private static final Pattern CANTIDAD_MULTIPLICADOR = Pattern.compile(
            "^(\\d+(?:[.,]\\d+)?)\\s*[xX]\\s+");
    private static final Pattern CANTIDAD_UNIDADES = Pattern.compile(
            "^(\\d+(?:[.,]\\d+)?)\\s*(UN|UD|unidades?)\\.?\\s+", Pattern.CASE_INSENSITIVE);
    private static final Pattern PRECIO_FINAL = Pattern.compile(
            "\\s+\\d+[.,]\\d{2}\\s*(?:€|\\$)?\\s*$");
    private static final Pattern UNIDAD_MEDIDA = Pattern.compile(
            "\\b\\d+(?:[.,]\\d+)?\\s*(ml|kg|gr|g|l|oz|lb)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern ESPACIOS = Pattern.compile("\\s+");

    public String extraerTextoDeImagen(byte[] imagenBytes) {
        try (ImageAnnotatorClient client = ImageAnnotatorClient.create()) {
            ByteString contenido = ByteString.copyFrom(imagenBytes);
            Image imagen = Image.newBuilder().setContent(contenido).build();
            Feature feature = Feature.newBuilder().setType(Feature.Type.TEXT_DETECTION).build();
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
            throw new ApiException(HttpStatus.BAD_GATEWAY, "No se pudo conectar con Google Vision API");
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
        return Float.parseFloat(valor.replace(",", "."));
    }

    public List<ResultadoOCRDTO> procesarProductosTicket(String usuarioId, List<ProductoTicketDTO> productos) {
        List<ResultadoOCRDTO> resultados = new ArrayList<>();

        for (ProductoTicketDTO producto : productos) {
            List<MatchProductoDTO> matches = matchingService.buscarProductoSimilarEnDespensa(
                    usuarioId, producto.nombreDetectado());

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
