package com.myfoodie.application.service;

import com.myfoodie.application.dto.matching.SimilitudResultDTO;
import com.myfoodie.domain.model.TipoMatch;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class MatchingService {

    private static final double UMBRAL_AUTOMATICO = 0.85;
    private static final double UMBRAL_PROPONER = 0.60;

    private static final Set<String> ARTICULOS = Set.of(
            "el", "la", "los", "las", "un", "una", "unos", "unas");

    private static final Set<String> UNIDADES = Set.of(
            "ml", "g", "kg", "l", "oz", "lb", "gr");

    private static final Map<String, String> SINONIMOS = Map.ofEntries(
            Map.entry("leche entera", "leche"),
            Map.entry("leche semidesnatada", "leche"),
            Map.entry("leche desnatada", "leche"),
            Map.entry("tomate frito", "tomate"),
            Map.entry("tomate triturado", "tomate"),
            Map.entry("aceite de oliva", "aceite"),
            Map.entry("aceite de girasol", "aceite"),
            Map.entry("pechuga de pollo", "pollo"),
            Map.entry("muslo de pollo", "pollo"),
            Map.entry("carne picada", "carne"),
            Map.entry("zumo de naranja", "naranja"),
            Map.entry("zumo de limón", "limon"),
            Map.entry("harina de trigo", "harina"),
            Map.entry("pan de molde", "pan"),
            Map.entry("queso manchego", "queso"),
            Map.entry("queso fresco", "queso"));

    private static final Pattern DIGITOS = Pattern.compile("[0-9]+");
    private static final Pattern NO_LETRAS = Pattern.compile("[^a-z\\s]");
    private static final Pattern ESPACIOS = Pattern.compile("\\s+");

    public String normalizar(String texto) {
        if (texto == null) {
            return "";
        }
        String sinAcentos = Normalizer.normalize(texto.toLowerCase(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        String sinDigitos = DIGITOS.matcher(sinAcentos).replaceAll(" ");
        String soloLetras = NO_LETRAS.matcher(sinDigitos).replaceAll(" ");

        String sinPalabrasVacias = Arrays.stream(soloLetras.split("\\s+"))
                .filter(palabra -> !palabra.isBlank())
                .filter(palabra -> !ARTICULOS.contains(palabra))
                .filter(palabra -> !UNIDADES.contains(palabra))
                .collect(Collectors.joining(" "));

        return ESPACIOS.matcher(sinPalabrasVacias).replaceAll(" ").trim();
    }

    public String aplicarSinonimos(String textoNormalizado) {
        return SINONIMOS.getOrDefault(textoNormalizado, textoNormalizado);
    }

    public double calcularSimilitudJaroWinkler(String a, String b) {
        if (a == null) a = "";
        if (b == null) b = "";
        if (a.equals(b)) {
            return a.isEmpty() ? 0.0 : 1.0;
        }

        double jaro = calcularJaro(a, b);

        int prefijo = 0;
        int maxPrefijo = Math.min(4, Math.min(a.length(), b.length()));
        while (prefijo < maxPrefijo && a.charAt(prefijo) == b.charAt(prefijo)) {
            prefijo++;
        }

        return jaro + prefijo * 0.1 * (1 - jaro);
    }

    private double calcularJaro(String a, String b) {
        int lenA = a.length();
        int lenB = b.length();
        if (lenA == 0 || lenB == 0) {
            return 0.0;
        }

        int distanciaMatch = Math.max(0, Math.max(lenA, lenB) / 2 - 1);

        boolean[] matchesA = new boolean[lenA];
        boolean[] matchesB = new boolean[lenB];

        int coincidencias = 0;
        for (int i = 0; i < lenA; i++) {
            int inicio = Math.max(0, i - distanciaMatch);
            int fin = Math.min(i + distanciaMatch + 1, lenB);
            for (int j = inicio; j < fin; j++) {
                if (matchesB[j] || a.charAt(i) != b.charAt(j)) {
                    continue;
                }
                matchesA[i] = true;
                matchesB[j] = true;
                coincidencias++;
                break;
            }
        }

        if (coincidencias == 0) {
            return 0.0;
        }

        double transposiciones = 0;
        int k = 0;
        for (int i = 0; i < lenA; i++) {
            if (!matchesA[i]) {
                continue;
            }
            while (!matchesB[k]) {
                k++;
            }
            if (a.charAt(i) != b.charAt(k)) {
                transposiciones++;
            }
            k++;
        }
        transposiciones /= 2;

        double m = coincidencias;
        return (m / lenA + m / lenB + (m - transposiciones) / m) / 3.0;
    }

    public SimilitudResultDTO calcularSimilitud(String nombreA, String nombreB) {
        String normalizadoA = normalizar(nombreA);
        String normalizadoB = normalizar(nombreB);

        String textoA = aplicarSinonimos(normalizadoA);
        String textoB = aplicarSinonimos(normalizadoB);

        double puntuacion = calcularSimilitudJaroWinkler(textoA, textoB);
        boolean fueronSinonimos = !textoA.equals(normalizadoA) || !textoB.equals(normalizadoB);

        return new SimilitudResultDTO(puntuacion, textoA, textoB, fueronSinonimos);
    }

    public TipoMatch clasificarMatch(double puntuacion) {
        if (puntuacion >= UMBRAL_AUTOMATICO) {
            return TipoMatch.AUTOMATICO;
        }
        if (puntuacion >= UMBRAL_PROPONER) {
            return TipoMatch.PROPONER;
        }
        return TipoMatch.NUEVO;
    }
}
