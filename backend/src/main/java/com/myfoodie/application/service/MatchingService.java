package com.myfoodie.application.service;

import com.myfoodie.application.dto.carrito.ItemCarritoResponseDTO;
import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import com.myfoodie.application.dto.matching.MatchItemCarritoDTO;
import com.myfoodie.application.dto.matching.MatchProductoDTO;
import com.myfoodie.application.dto.matching.ParDuplicadoDTO;
import com.myfoodie.application.dto.matching.SimilitudResultDTO;
import com.myfoodie.domain.model.Despensa;
import com.myfoodie.domain.model.ItemCarrito;
import com.myfoodie.domain.model.Preferencias;
import com.myfoodie.domain.model.Producto;
import com.myfoodie.domain.model.TipoMatch;
import com.myfoodie.domain.repository.DespensaRepository;
import com.myfoodie.domain.repository.FusionIgnoradaRepository;
import com.myfoodie.domain.repository.ItemCarritoRepository;
import com.myfoodie.domain.repository.PreferenciasRepository;
import com.myfoodie.domain.repository.ProductoRepository;
import com.myfoodie.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchingService {

    private static final double UMBRAL_AUTOMATICO = 0.99;
    private static final double UMBRAL_PROPONER = 0.60;
    private static final double UMBRAL_DUPLICADO = 0.75;

    // Un sinónimo homologa "familias" de producto (tomate ~ tomate frito, aceite de oliva ~
    // aceite de girasol) para que recetas/duplicados no exijan texto idéntico, pero nunca debe
    // bastar por sí solo para fusionar o actualizar algo en automático: por muy exacta que
    // quede la coincidencia tras sustituir el sinónimo, se limita a este techo, por debajo de
    // UMBRAL_AUTOMATICO, así que siempre pasa por confirmación del usuario (PROPONER).
    private static final double TECHO_SINONIMO = 0.90;

    private final DespensaRepository despensaRepository;
    private final ProductoRepository productoRepository;
    private final PreferenciasRepository preferenciasRepository;
    private final FusionIgnoradaRepository fusionIgnoradaRepository;
    private final ItemCarritoRepository itemCarritoRepository;

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

        double puntuacion = calcularSimilitudJaroWinkler(textoA, textoB) * factorSolapePalabras(textoA, textoB);
        boolean fueronSinonimos = !textoA.equals(normalizadoA) || !textoB.equals(normalizadoB);
        if (fueronSinonimos) {
            puntuacion = Math.min(puntuacion, TECHO_SINONIMO);
        }

        return new SimilitudResultDTO(puntuacion, textoA, textoB, fueronSinonimos);
    }

    // Jaro-Winkler puntúa alto textos largos que comparten muchas letras sueltas aunque
    // sean palabras completamente distintas (p. ej. "barraca pimiento" y "carne boloñesa").
    // Si ninguna palabra completa (>=3 letras) de un nombre aparece en el otro, penalizamos
    // fuerte la puntuación para que ese ruido no llegue a proponerse como el mismo producto.
    // Si comparten al menos una palabra completa, no se toca nada: así no se rompen
    // coincidencias legítimas como "Leche Pascual Entera" -> "Leche".
    private double factorSolapePalabras(String textoA, String textoB) {
        Set<String> palabrasA = palabrasSignificativas(textoA);
        Set<String> palabrasB = palabrasSignificativas(textoB);
        if (palabrasA.isEmpty() || palabrasB.isEmpty()) {
            return 1.0;
        }
        boolean comparten = palabrasA.stream().anyMatch(palabrasB::contains);
        return comparten ? 1.0 : 0.3;
    }

    private Set<String> palabrasSignificativas(String texto) {
        return Arrays.stream(texto.split(" "))
                .filter(p -> p.length() >= 3)
                .collect(Collectors.toSet());
    }

    /**
     * Dos nombres se consideran "posible duplicado" a partir de {@code UMBRAL_DUPLICADO} (0,75):
     * el mismo criterio que usa {@link #buscarDuplicadosEnDespensa} para la pantalla de duplicados.
     * Se expone aparte para que el aviso al crear un producto comparta ese umbral.
     */
    public boolean esPosibleDuplicado(String nombreA, String nombreB) {
        return calcularSimilitud(nombreA, nombreB).puntuacion() >= UMBRAL_DUPLICADO;
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

    public List<MatchProductoDTO> buscarProductoSimilarEnDespensa(String usuarioId, String nombreBuscado) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        int globalUmbral = obtenerGlobalUmbral(usuarioId);
        List<Producto> productos = productoRepository.findByDespensaId(despensa.getId());
        return buscarProductoSimilarEnDespensa(productos, globalUmbral, nombreBuscado);
    }

    // Para llamantes que van a evaluar varios nombres contra la misma despensa de golpe
    // (p. ej. OCRService por cada línea de ticket): cargar esto una vez fuera del bucle y
    // pasarlo a la variante de arriba con lista evita repetir las mismas consultas a Mongo.
    public List<Producto> productosDeDespensa(String usuarioId) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        return productoRepository.findByDespensaId(despensa.getId());
    }

    public int umbralGlobal(String usuarioId) {
        return obtenerGlobalUmbral(usuarioId);
    }

    // Variante sin consultas a Mongo: para cuando el llamante ya tiene los productos de la
    // despensa cargados (p. ej. al resolver varios items de golpe) y evaluar uno a uno con
    // la versión de arriba dispararía una consulta repetida por cada item (N+1).
    public List<MatchProductoDTO> buscarProductoSimilarEnDespensa(
            List<Producto> productos, int globalUmbral, String nombreBuscado) {
        return productos.stream()
                .map(p -> Map.entry(p, calcularSimilitud(nombreBuscado, p.getNombre())))
                .filter(entry -> entry.getValue().puntuacion() >= UMBRAL_PROPONER)
                .sorted(Comparator.comparingDouble(
                        (Map.Entry<Producto, SimilitudResultDTO> entry) -> entry.getValue().puntuacion())
                        .reversed())
                .map(entry -> {
                    Producto p = entry.getKey();
                    double puntuacion = entry.getValue().puntuacion();
                    ProductoResponseDTO productoDTO = toProductoResponseDTO(p, resolverUmbral(p, globalUmbral));
                    String textoSugerido = "¿Es lo mismo que '" + p.getNombre() + "' en tu despensa?";
                    return new MatchProductoDTO(productoDTO, puntuacion, clasificarMatch(puntuacion), textoSugerido);
                })
                .toList();
    }

    public List<MatchItemCarritoDTO> buscarItemSimilarEnCarrito(String usuarioId, String nombreItem) {
        List<ItemCarrito> itemsActivos = itemCarritoRepository.findByUsuarioId(usuarioId).stream()
                .filter(i -> "pendiente".equals(i.getEstado()) || "aceptado".equals(i.getEstado()))
                .toList();

        return itemsActivos.stream()
                .map(item -> Map.entry(item, calcularSimilitud(nombreItem, item.getNombre())))
                .filter(entry -> entry.getValue().puntuacion() >= UMBRAL_PROPONER)
                .sorted(Comparator.comparingDouble(
                        (Map.Entry<ItemCarrito, SimilitudResultDTO> entry) -> entry.getValue().puntuacion())
                        .reversed())
                .map(entry -> {
                    ItemCarrito item = entry.getKey();
                    double puntuacion = entry.getValue().puntuacion();
                    return new MatchItemCarritoDTO(
                            toItemCarritoResponseDTO(item),
                            puntuacion,
                            clasificarMatch(puntuacion),
                            "Ya tienes '" + item.getNombre() + "' en tu lista");
                })
                .toList();
    }

    private ItemCarritoResponseDTO toItemCarritoResponseDTO(ItemCarrito item) {
        return new ItemCarritoResponseDTO(
                item.getId(),
                item.getUsuarioId(),
                item.getNombre(),
                item.getCantidad(),
                item.getUnidad(),
                item.getCategoria(),
                item.getPrioridad(),
                item.getMotivo(),
                item.getEstado(),
                item.getNoVolver(),
                item.getRecetaId(),
                null,
                null,
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }

    public List<ParDuplicadoDTO> buscarDuplicadosEnDespensa(String usuarioId) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        int globalUmbral = obtenerGlobalUmbral(usuarioId);
        List<Producto> productos = productoRepository.findByDespensaId(despensa.getId());
        Set<String> paresIgnorados = fusionIgnoradaRepository.findByUsuarioId(usuarioId).stream()
                .map(f -> clavePar(f.getProductoANombre(), f.getProductoBNombre()))
                .collect(Collectors.toSet());

        List<ParDuplicadoDTO> duplicados = new ArrayList<>();
        for (int i = 0; i < productos.size(); i++) {
            for (int j = i + 1; j < productos.size(); j++) {
                Producto a = productos.get(i);
                Producto b = productos.get(j);
                double puntuacion = calcularSimilitud(a.getNombre(), b.getNombre()).puntuacion();
                if (puntuacion < UMBRAL_DUPLICADO) {
                    continue;
                }
                String clave = clavePar(normalizar(a.getNombre()), normalizar(b.getNombre()));
                if (paresIgnorados.contains(clave)) {
                    continue;
                }
                ProductoResponseDTO dtoA = toProductoResponseDTO(a, resolverUmbral(a, globalUmbral));
                ProductoResponseDTO dtoB = toProductoResponseDTO(b, resolverUmbral(b, globalUmbral));
                duplicados.add(new ParDuplicadoDTO(dtoA, dtoB, puntuacion,
                        "Estos productos podrían ser el mismo. ¿Quieres fusionarlos?"));
            }
        }
        return duplicados;
    }

    private String clavePar(String nombreA, String nombreB) {
        return nombreA.compareTo(nombreB) <= 0 ? nombreA + "|" + nombreB : nombreB + "|" + nombreA;
    }

    private Despensa getDespensaDeUsuario(String usuarioId) {
        return despensaRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Despensa no encontrada"));
    }

    private int obtenerGlobalUmbral(String usuarioId) {
        return preferenciasRepository.findByUsuarioId(usuarioId)
                .map(Preferencias::getStockMinimoGlobal)
                .filter(v -> v != null)
                .orElse(1);
    }

    private int resolverUmbral(Producto p, int globalUmbral) {
        return p.getStockMinimo() != null ? p.getStockMinimo() : globalUmbral;
    }

    private String calcularEstado(Producto p, int umbral) {
        if (p.getCantidad() <= 0) {
            return "sin_stock";
        }

        Long dias = p.getFechaCaducidad() != null
                ? ChronoUnit.DAYS.between(LocalDate.now(), p.getFechaCaducidad())
                : null;

        if (dias != null && dias < 0)  return "caducado";
        if (dias != null && dias == 0) return "caduca_hoy";
        if (dias != null && dias <= 3) return "caduca_pronto";
        if (p.getCantidad() <= umbral) return "bajoStock";
        if (dias != null && dias <= 7)  return "caduca_semana";
        if (dias != null && dias <= 30) return "caduca_mes";
        return "normal";
    }

    private Integer calcularDiasHastaCaducidad(Producto p) {
        if (p.getFechaCaducidad() == null) return null;
        return (int) ChronoUnit.DAYS.between(LocalDate.now(), p.getFechaCaducidad());
    }

    private ProductoResponseDTO toProductoResponseDTO(Producto p, int umbralEfectivo) {
        boolean alertaCompra = p.getCantidad() <= umbralEfectivo;
        String estado = calcularEstado(p, umbralEfectivo);
        return new ProductoResponseDTO(
                p.getId(),
                p.getDespensaId(),
                p.getNombre(),
                p.getCantidad(),
                p.getUnidad(),
                p.getUnidadOriginal(),
                p.getCategoria(),
                p.getFechaCaducidad(),
                p.getFechaCompra(),
                p.getMarca(),
                p.getNotas(),
                p.getStockMinimo(),
                alertaCompra,
                estado,
                calcularDiasHastaCaducidad(p),
                null,
                p.getCreatedAt(),
                p.getUpdatedAt(),
                p.getTieneLotes(),
                !"sin_stock".equals(estado),
                null
        );
    }
}
