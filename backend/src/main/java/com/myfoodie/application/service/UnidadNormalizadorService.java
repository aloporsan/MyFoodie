package com.myfoodie.application.service;

import com.myfoodie.application.dto.unidad.UnidadConvertidaDTO;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class UnidadNormalizadorService {

    private record Conversion(double factor, String unidadDestino) {}

    /** Familia de una unidad, para decidir si dos cantidades son comparables entre sí. */
    public enum FamiliaUnidad { PESO, VOLUMEN, CONTEO, DESCONOCIDA }

    // Familias de unidades objetivas (ya normalizadas, sin unidades subjetivas) convertibles entre sí.
    private static final Map<String, Double> FACTOR_A_GRAMOS = Map.of(
            "g", 1.0,
            "gr", 1.0,
            "kg", 1000.0,
            "oz", 28.3495,
            "lb", 453.592
    );

    private static final Map<String, Double> FACTOR_A_MILILITROS = Map.of(
            "ml", 1.0,
            "l", 1000.0
    );

    // Unidades de conteo: se cuentan piezas, no se convierten a una magnitud métrica. Dentro de
    // esta familia las cantidades se comparan tal cual (2 dientes de ajo ~ 1 unidad de ajo), sin
    // factor de conversión, porque no lo hay sin una tabla curada por ingrediente.
    private static final Set<String> UNIDADES_CONTEO = Set.of(
            "unidad", "unidades", "ud", "uds", "u", "pieza", "piezas", "trozo", "trozos",
            "diente", "dientes", "rebanada", "rebanadas", "loncha", "lonchas",
            "rodaja", "rodajas", "hoja", "hojas", "rama", "ramas", "ramita", "ramitas",
            "cabeza", "cabezas", "manojo", "manojos", "puñado", "puñados",
            "lata", "latas", "bote", "botes", "paquete", "paquetes", "sobre", "sobres");

    // C8 — Decisión de diseño: las unidades de conteo NO se mapean a una unidad de compra métrica.
    // Convertir "2 dientes" -> "1 cabeza de ajo" exigiría una tabla de equivalencias curada por
    // ingrediente (peso medio de un diente, de una rebanada de pan, de una hoja de laurel...), y
    // una conversión métrica genérica sería engañosa. Se dejan literales en la lista de la compra.
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

    // Para listas de la compra: unidades subjetivas van a litros/kilos (lo que se compra), no a ml/g (trazabilidad interna)
    public UnidadConvertidaDTO convertirAUnidadDeCompra(double cantidad, String unidad) {
        UnidadConvertidaDTO normalizado = normalizarUnidades(cantidad, unidad);
        if (!normalizado.fueConvertida()) {
            return normalizado;
        }
        String destino = "ml".equals(normalizado.unidadConvertida()) ? "l" : "kg";
        double cantidadDestino = Math.round(normalizado.cantidadConvertida() / 10) / 100.0;
        return new UnidadConvertidaDTO(cantidadDestino, destino, true);
    }

    // Convierte entre unidades objetivas de la misma familia (peso: g/kg/oz/lb, volumen: ml/l).
    // Devuelve empty si las unidades no pertenecen a una familia convertible (p.ej. "unidad" o familias distintas).
    public Optional<Double> convertirCantidad(double cantidad, String unidadOrigen, String unidadDestino) {
        String origen = normalizar(unidadOrigen);
        String destino = normalizar(unidadDestino);
        if (origen.equals(destino)) {
            return Optional.of(cantidad);
        }
        if (FACTOR_A_GRAMOS.containsKey(origen) && FACTOR_A_GRAMOS.containsKey(destino)) {
            double gramos = cantidad * FACTOR_A_GRAMOS.get(origen);
            return Optional.of(redondear(gramos / FACTOR_A_GRAMOS.get(destino)));
        }
        if (FACTOR_A_MILILITROS.containsKey(origen) && FACTOR_A_MILILITROS.containsKey(destino)) {
            double mililitros = cantidad * FACTOR_A_MILILITROS.get(origen);
            return Optional.of(redondear(mililitros / FACTOR_A_MILILITROS.get(destino)));
        }
        return Optional.empty();
    }

    public FamiliaUnidad familia(String unidad) {
        String u = normalizar(unidad);
        if (FACTOR_A_GRAMOS.containsKey(u)) {
            return FamiliaUnidad.PESO;
        }
        if (FACTOR_A_MILILITROS.containsKey(u)) {
            return FamiliaUnidad.VOLUMEN;
        }
        if (u.isBlank() || UNIDADES_CONTEO.contains(u)) {
            return FamiliaUnidad.CONTEO;
        }
        return FamiliaUnidad.DESCONOCIDA;
    }

    /**
     * Cantidad de un producto expresada en la unidad de un ingrediente para poder compararlas
     * en el cálculo de disponibilidad:
     * <ul>
     *   <li>Peso o volumen: conversión real de valor dentro de la familia (500 g -&gt; 0,5 kg).</li>
     *   <li>Conteo (unidad, diente, rebanada...) o unidad sin identificar en ambos lados: se
     *       devuelven los números tal cual, sin conversión.</li>
     *   <li>Familias distintas (p. ej. "g" contra "unidad"): {@code empty}, no son comparables.</li>
     * </ul>
     */
    public Optional<Double> cantidadComparable(double cantidadProducto, String unidadProducto,
                                               String unidadIngrediente) {
        FamiliaUnidad fp = familia(unidadProducto);
        FamiliaUnidad fi = familia(unidadIngrediente);
        if ((fp == FamiliaUnidad.PESO && fi == FamiliaUnidad.PESO)
                || (fp == FamiliaUnidad.VOLUMEN && fi == FamiliaUnidad.VOLUMEN)) {
            return convertirCantidad(cantidadProducto, unidadProducto, unidadIngrediente);
        }
        boolean productoEsConteo = fp == FamiliaUnidad.CONTEO || fp == FamiliaUnidad.DESCONOCIDA;
        boolean ingredienteEsConteo = fi == FamiliaUnidad.CONTEO || fi == FamiliaUnidad.DESCONOCIDA;
        if (productoEsConteo && ingredienteEsConteo) {
            return Optional.of(cantidadProducto);
        }
        return Optional.empty();
    }

    private double redondear(double valor) {
        return Math.round(valor * 100) / 100.0;
    }

    private String normalizar(String unidad) {
        return unidad == null ? "" : unidad.trim().toLowerCase(Locale.ROOT);
    }
}
