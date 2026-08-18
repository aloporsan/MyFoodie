package com.myfoodie.application.service;

import com.myfoodie.application.dto.unidad.UnidadConvertidaDTO;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Map;

@Service
public class UnidadNormalizadorService {

    private record Conversion(double factor, String unidadDestino) {}

    private static final Map<String, Conversion> CONVERSIONES = Map.ofEntries(
            // Volumen -> ml
            Map.entry("cucharada", new Conversion(15, "ml")),
            Map.entry("cucharadas", new Conversion(15, "ml")),
            Map.entry("cucharadita", new Conversion(5, "ml")),
            Map.entry("cucharaditas", new Conversion(5, "ml")),
            Map.entry("taza", new Conversion(250, "ml")),
            Map.entry("tazas", new Conversion(250, "ml")),
            Map.entry("vaso", new Conversion(200, "ml")),
            Map.entry("vasos", new Conversion(200, "ml")),
            Map.entry("litro", new Conversion(1000, "ml")),
            Map.entry("litros", new Conversion(1000, "ml")),
            Map.entry("dl", new Conversion(100, "ml")),
            Map.entry("cl", new Conversion(10, "ml")),
            // Peso -> g
            Map.entry("pizca", new Conversion(0.5, "g")),
            Map.entry("pizcas", new Conversion(0.5, "g")),
            Map.entry("pellizco", new Conversion(1, "g")),
            Map.entry("kilo", new Conversion(1000, "g")),
            Map.entry("kilogramo", new Conversion(1000, "g")),
            Map.entry("kilogramos", new Conversion(1000, "g"))
    );

    public boolean esUnidadSubjetiva(String unidad) {
        return CONVERSIONES.containsKey(normalizar(unidad));
    }

    public UnidadConvertidaDTO convertirAMetrica(double cantidad, String unidad) {
        Conversion conversion = CONVERSIONES.get(normalizar(unidad));
        if (conversion == null) {
            return new UnidadConvertidaDTO(cantidad, unidad, false);
        }
        return new UnidadConvertidaDTO(cantidad * conversion.factor(), conversion.unidadDestino(), true);
    }

    public UnidadConvertidaDTO normalizarUnidades(double cantidad, String unidad) {
        if (esUnidadSubjetiva(unidad)) {
            return convertirAMetrica(cantidad, unidad);
        }
        return new UnidadConvertidaDTO(cantidad, unidad, false);
    }

    private String normalizar(String unidad) {
        return unidad == null ? "" : unidad.trim().toLowerCase(Locale.ROOT);
    }
}
