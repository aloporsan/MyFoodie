package com.myfoodie.application.service;

import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import com.myfoodie.application.dto.feed.ContextoSocialDTO;
import com.myfoodie.application.dto.feed.FeedResponseDTO;
import com.myfoodie.application.dto.feed.FiltrosFeedDTO;
import com.myfoodie.application.dto.feed.InicializarPerfilRequestDTO;
import com.myfoodie.application.dto.feed.PerfilGustosResponseDTO;
import com.myfoodie.application.dto.feed.RecetaFeedDTO;
import com.myfoodie.application.dto.recomendacion.CandidatoRecetaDTO;
import com.myfoodie.application.dto.recomendacion.ContextoPuntuacionDTO;
import com.myfoodie.application.dto.recomendacion.RecetaPuntuadaDTO;
import com.myfoodie.application.dto.social.SeguimientoResponseDTO;
import com.myfoodie.domain.model.IngredienteReceta;
import com.myfoodie.domain.model.Like;
import com.myfoodie.domain.model.PerfilGustos;
import com.myfoodie.domain.model.Preferencias;
import com.myfoodie.domain.model.Receta;
import com.myfoodie.domain.model.RecetaCompartida;
import com.myfoodie.domain.model.RecetaDescartada;
import com.myfoodie.domain.model.TipoMatch;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.model.VisibilidadReceta;
import com.myfoodie.domain.repository.IngredienteRecetaRepository;
import com.myfoodie.domain.repository.LikeRepository;
import com.myfoodie.domain.repository.PerfilGustosRepository;
import com.myfoodie.domain.repository.PreferenciasRepository;
import com.myfoodie.domain.repository.RecetaCompartidaRepository;
import com.myfoodie.domain.repository.RecetaDescartadaRepository;
import com.myfoodie.domain.repository.RecetaGuardadaRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedService {

    private static final String ESTADO_PUBLICADA = "publicada";
    private static final String ESTADO_CADUCA_HOY = "caduca_hoy";
    private static final String ESTADO_CADUCA_PRONTO = "caduca_pronto";
    private static final int DIAS_REAPARICION_DESCARTE = 30;
    private static final int TAMAÑO_MINIMO_POOL = 50;
    private static final int TAMAÑO_MAXIMO_POOL = 200;
    // Con filtros activos ampliamos el pool para no dejar fuera recetas más antiguas que sí cumplen.
    private static final int TAMAÑO_POOL_FILTRADO = 1000;
    private static final int MAXIMO_NOMBRES_LIKES = 3;

    private final RecetaRepository recetaRepository;
    private final RecetaDescartadaRepository recetaDescartadaRepository;
    private final RecetaGuardadaRepository recetaGuardadaRepository;
    private final LikeRepository likeRepository;
    private final RecetaCompartidaRepository recetaCompartidaRepository;
    private final IngredienteRecetaRepository ingredienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final PerfilGustosRepository perfilGustosRepository;
    private final PreferenciasRepository preferenciasRepository;
    private final DespensaService despensaService;
    private final SocialService socialService;
    private final RecomendacionService recomendacionService;
    private final MatchingService matchingService;

    public FeedResponseDTO obtenerFeed(String usuarioId, int pagina, int tamaño) {
        return obtenerFeed(usuarioId, pagina, tamaño, null);
    }

    public FeedResponseDTO obtenerFeed(String usuarioId, int pagina, int tamaño, FiltrosFeedDTO filtros) {
        Set<String> seguidosIds = obtenerSeguidosIds(usuarioId);
        DescartesInfo descartes = obtenerDescartes(usuarioId);
        Preferencias preferencias = preferenciasRepository.findByUsuarioId(usuarioId).orElse(null);

        PageRequest poolRequest = poolRequest(tamaño, filtros);
        List<Receta> candidatas = recetaRepository.findByEstadoAndAutorIdNotAndIdNotIn(
                ESTADO_PUBLICADA, usuarioId, descartes.idsRecientes(), poolRequest).getContent();
        candidatas = filtrarAccesibles(candidatas, usuarioId, seguidosIds);
        candidatas = aplicarFiltros(candidatas, filtros);
        candidatas = filtrarPorPreferenciasAlimentarias(candidatas, preferencias);

        return construirRespuesta(candidatas, usuarioId, pagina, tamaño, seguidosIds, descartes, true, filtros, preferencias);
    }

    public FeedResponseDTO obtenerRecetasSeguidos(String usuarioId, int pagina, int tamaño) {
        return obtenerRecetasSeguidos(usuarioId, pagina, tamaño, null);
    }

    public FeedResponseDTO obtenerRecetasSeguidos(String usuarioId, int pagina, int tamaño, FiltrosFeedDTO filtros) {
        Set<String> seguidosIds = obtenerSeguidosIds(usuarioId);
        if (seguidosIds.isEmpty()) {
            return new FeedResponseDTO(List.of(), pagina, 0, false);
        }

        DescartesInfo descartes = obtenerDescartes(usuarioId);
        Preferencias preferencias = preferenciasRepository.findByUsuarioId(usuarioId).orElse(null);
        PageRequest poolRequest = poolRequest(tamaño, filtros);
        List<Receta> candidatas = recetaRepository.findByEstadoAndAutorIdInAndIdNotIn(
                ESTADO_PUBLICADA, seguidosIds, descartes.idsRecientes(), poolRequest).getContent();
        candidatas = filtrarAccesibles(candidatas, usuarioId, seguidosIds);
        candidatas = aplicarFiltros(candidatas, filtros);
        candidatas = filtrarPorPreferenciasAlimentarias(candidatas, preferencias);

        return construirRespuesta(candidatas, usuarioId, pagina, tamaño, seguidosIds, descartes, false, filtros, preferencias);
    }

    private PageRequest poolRequest(int tamaño, FiltrosFeedDTO filtros) {
        int tamañoPool = (filtros != null && !filtros.estaVacio())
                ? TAMAÑO_POOL_FILTRADO
                : calcularTamañoPool(tamaño);
        return PageRequest.of(0, tamañoPool, Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    private List<Receta> aplicarFiltros(List<Receta> recetas, FiltrosFeedDTO filtros) {
        if (filtros == null || filtros.estaVacio()) {
            return recetas;
        }
        return recetas.stream().filter(r -> FiltrosRecetaMatcher.cumple(r, filtros)).toList();
    }

    /**
     * Busca recetas publicadas y accesibles cuyo texto libre coincide con el título, algún
     * ingrediente o alguna etiqueta, aplicando además los filtros multidimensionales. Devuelve
     * la misma tarjeta que el feed (con coincidencia de despensa) ordenada por relevancia
     * (título &gt; ingrediente &gt; etiqueta) y, a igualdad, por fecha de publicación descendente.
     */
    public List<RecetaFeedDTO> buscarRecetas(String usuarioId, String texto, FiltrosFeedDTO filtros) {
        if (texto == null || texto.isBlank()) {
            return List.of();
        }
        String termino = texto.trim().toLowerCase(Locale.ROOT);
        Set<String> seguidosIds = obtenerSeguidosIds(usuarioId);

        Set<String> recetaIdsPorIngrediente = ingredienteRepository.findByNombreContainingIgnoreCase(termino).stream()
                .map(IngredienteReceta::getRecetaId)
                .collect(Collectors.toSet());

        Map<String, Integer> relevanciaPorReceta = new HashMap<>();
        List<Receta> coincidencias = recetaRepository.findByEstado(ESTADO_PUBLICADA).stream()
                .filter(r -> FiltrosRecetaMatcher.cumple(r, filtros))
                .filter(r -> {
                    int relevancia = relevanciaBusqueda(r, termino, recetaIdsPorIngrediente);
                    if (relevancia > 0) {
                        relevanciaPorReceta.put(r.getId(), relevancia);
                    }
                    return relevancia > 0;
                })
                .toList();
        coincidencias = filtrarAccesibles(coincidencias, usuarioId, seguidosIds);

        Comparator<Receta> orden = Comparator
                .comparingInt((Receta r) -> relevanciaPorReceta.getOrDefault(r.getId(), 0)).reversed()
                .thenComparing(Receta::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()));

        return construirTarjetas(coincidencias, usuarioId, seguidosIds, orden);
    }

    private int relevanciaBusqueda(Receta receta, String termino, Set<String> recetaIdsPorIngrediente) {
        if (receta.getTitulo() != null && receta.getTitulo().toLowerCase(Locale.ROOT).contains(termino)) {
            return 3;
        }
        if (recetaIdsPorIngrediente.contains(receta.getId())) {
            return 2;
        }
        boolean coincideEtiqueta = receta.getEtiquetas() != null && receta.getEtiquetas().stream()
                .anyMatch(e -> e != null && e.toLowerCase(Locale.ROOT).contains(termino));
        return coincideEtiqueta ? 1 : 0;
    }

    private List<RecetaFeedDTO> construirTarjetas(List<Receta> recetas, String usuarioId, Set<String> seguidosIds,
                                                  Comparator<Receta> orden) {
        List<String> nombresProductosDespensa = despensaService.listarProductos(usuarioId).stream()
                .map(ProductoResponseDTO::nombre)
                .filter(nombre -> nombre != null && !nombre.isBlank())
                .toList();

        List<Receta> ordenadas = recetas.stream().sorted(orden).toList();
        List<String> ids = ordenadas.stream().map(Receta::getId).toList();
        Map<String, List<String>> likesDeSeguidosPorReceta = obtenerLikesDeSeguidosPorReceta(ids, seguidosIds);
        Set<String> recetasCompartidasPorSeguido = obtenerRecetasCompartidasPorSeguido(usuarioId, ids, seguidosIds);
        Map<String, String> nombresPorUsuarioId = resolverNombresLikers(ids, likesDeSeguidosPorReceta);

        return ordenadas.stream()
                .map(r -> toFeedDTO(new RecetaPuntuadaDTO(r, 0, null, false), usuarioId, nombresProductosDespensa,
                        seguidosIds, likesDeSeguidosPorReceta, recetasCompartidasPorSeguido, nombresPorUsuarioId))
                .toList();
    }

    public void resetearPerfilGustos(String usuarioId) {
        perfilGustosRepository.deleteByUsuarioId(usuarioId);
    }

    public void inicializarPerfilDesdeOnboarding(String usuarioId, InicializarPerfilRequestDTO dto) {
        if (perfilGustosRepository.findByUsuarioId(usuarioId).isPresent()) {
            return;
        }
        PerfilGustos perfil = recomendacionService.inicializarPerfilDesdeOnboarding(
                usuarioId, dto.tiposCocinaPreferidos(), dto.tiempoDisponible());
        perfilGustosRepository.save(perfil);
    }

    public PerfilGustosResponseDTO obtenerPerfilGustos(String usuarioId) {
        PerfilGustos perfil = obtenerOPredeterminarPerfil(usuarioId);
        return new PerfilGustosResponseDTO(
                perfil.getUsuarioId(),
                perfil.getCategoriasPreferidas(),
                perfil.getEtiquetasPreferidas(),
                perfil.getDificultadesPreferidas(),
                perfil.getTiempoMaximoHabitual(),
                perfil.getIngredientesHabituales(),
                perfil.getUpdatedAt());
    }

    private int calcularTamañoPool(int tamaño) {
        return Math.min(TAMAÑO_MAXIMO_POOL, Math.max(TAMAÑO_MINIMO_POOL, tamaño * 5));
    }

    /**
     * Excluye del pool las recetas que el usuario no debería ver: de usuarios con bloqueo activo
     * (en cualquier dirección) y las que no cumplen la visibilidad configurada por su autor.
     */
    private List<Receta> filtrarAccesibles(List<Receta> recetas, String usuarioId, Set<String> seguidosIds) {
        Set<String> ocultos = socialService.obtenerIdsOcultosPara(usuarioId);
        return recetas.stream()
                .filter(r -> !ocultos.contains(r.getAutorId()))
                .filter(r -> esVisiblePara(r, usuarioId, seguidosIds))
                .toList();
    }

    private boolean esVisiblePara(Receta receta, String usuarioId, Set<String> seguidosIds) {
        if (receta.getAutorId().equals(usuarioId)) {
            return true;
        }
        VisibilidadReceta visibilidad = receta.getVisibilidad() != null
                ? receta.getVisibilidad() : VisibilidadReceta.PUBLICA;
        return switch (visibilidad) {
            case PUBLICA -> true;
            case SOLO_SEGUIDORES -> seguidosIds.contains(receta.getAutorId());
            case PRIVADA -> false;
        };
    }

    private Set<String> obtenerSeguidosIds(String usuarioId) {
        return socialService.obtenerSeguidos(usuarioId).stream()
                .map(SeguimientoResponseDTO::usuarioId)
                .collect(Collectors.toSet());
    }

    private DescartesInfo obtenerDescartes(String usuarioId) {
        LocalDateTime limiteReaparicion = LocalDateTime.now().minusDays(DIAS_REAPARICION_DESCARTE);
        List<RecetaDescartada> descartes = recetaDescartadaRepository.findByUsuarioId(usuarioId);

        List<String> idsRecientes = descartes.stream()
                .filter(d -> d.getCreatedAt().isAfter(limiteReaparicion))
                .map(RecetaDescartada::getRecetaId)
                .toList();

        Map<String, LocalDateTime> fechaAntiguaPorReceta = descartes.stream()
                .filter(d -> !d.getCreatedAt().isAfter(limiteReaparicion))
                .collect(Collectors.toMap(RecetaDescartada::getRecetaId, RecetaDescartada::getCreatedAt));

        return new DescartesInfo(idsRecientes, fechaAntiguaPorReceta);
    }

    private FeedResponseDTO construirRespuesta(List<Receta> candidatas, String usuarioId, int pagina, int tamaño,
                                                Set<String> seguidosIds, DescartesInfo descartes,
                                                boolean priorizarSeguidos, FiltrosFeedDTO filtros,
                                                Preferencias preferencias) {
        PerfilGustos perfilGustos = neutralizarEjesFiltrados(obtenerOPredeterminarPerfil(usuarioId), filtros);
        List<ProductoResponseDTO> productosDespensa = despensaService.listarProductos(usuarioId);
        List<String> nombresProductosDespensa = productosDespensa.stream()
                .map(ProductoResponseDTO::nombre)
                .filter(nombre -> nombre != null && !nombre.isBlank())
                .toList();
        Set<String> ingredientesProximosACaducar = productosDespensa.stream()
                .filter(p -> ESTADO_CADUCA_HOY.equals(p.estado()) || ESTADO_CADUCA_PRONTO.equals(p.estado()))
                .map(ProductoResponseDTO::nombre)
                .filter(nombre -> nombre != null && !nombre.isBlank())
                .map(nombre -> nombre.trim().toLowerCase())
                .collect(Collectors.toSet());

        List<String> idsCandidatas = candidatas.stream().map(Receta::getId).toList();
        Map<String, List<String>> likesDeSeguidosPorReceta = obtenerLikesDeSeguidosPorReceta(idsCandidatas, seguidosIds);
        Set<String> recetasCompartidasPorSeguido = obtenerRecetasCompartidasPorSeguido(usuarioId, idsCandidatas, seguidosIds);

        List<CandidatoRecetaDTO> candidatos = candidatas.stream()
                .map(receta -> construirCandidato(
                        receta,
                        nombresProductosDespensa,
                        ingredientesProximosACaducar,
                        likesDeSeguidosPorReceta.getOrDefault(receta.getId(), List.of()),
                        recetasCompartidasPorSeguido.contains(receta.getId()),
                        descartes.fechaAntiguaPorReceta().get(receta.getId())))
                .toList();

        List<RecetaPuntuadaDTO> recetasOrdenadas = recomendacionService.ordenarFeed(
                candidatos, usuarioId, seguidosIds, perfilGustos, preferencias);

        if (priorizarSeguidos) {
            recetasOrdenadas = recetasOrdenadas.stream()
                    .sorted(Comparator.comparing(
                            (RecetaPuntuadaDTO rp) -> seguidosIds.contains(rp.receta().getAutorId())).reversed())
                    .toList();
        }

        int total = recetasOrdenadas.size();
        int desde = Math.min(pagina * tamaño, total);
        int hasta = Math.min(desde + tamaño, total);
        int totalPaginas = tamaño == 0 ? 0 : (int) Math.ceil(total / (double) tamaño);

        List<RecetaPuntuadaDTO> paginaOrdenada = recetasOrdenadas.subList(desde, hasta);
        Map<String, String> nombresPorUsuarioId = resolverNombresLikers(
                paginaOrdenada.stream().map(rp -> rp.receta().getId()).toList(), likesDeSeguidosPorReceta);

        List<RecetaFeedDTO> recetasPagina = paginaOrdenada.stream()
                .map(rp -> toFeedDTO(rp, usuarioId, nombresProductosDespensa, seguidosIds, likesDeSeguidosPorReceta,
                        recetasCompartidasPorSeguido, nombresPorUsuarioId))
                .toList();

        return new FeedResponseDTO(recetasPagina, pagina, totalPaginas, hasta < total);
    }

    // Pequeño mapa de alérgenos frecuentes -> palabras que suelen aparecer en los ingredientes.
    // No pretende ser exhaustivo: cubre los casos habituales para que un alérgeno declarado
    // (que casi nunca aparece literal en el nombre del ingrediente) llegue a filtrar algo.
    private static final Map<String, List<String>> SINONIMOS_ALERGENOS = Map.of(
            "gluten", List.of("trigo", "harina", "pan", "pasta", "cebada", "centeno", "cuscus", "couscous", "bulgur", "semola"),
            "lactosa", List.of("leche", "queso", "yogur", "mantequilla", "nata", "crema", "requeson"),
            "leche", List.of("leche", "queso", "yogur", "mantequilla", "nata", "crema", "requeson"),
            "huevo", List.of("huevo", "clara", "yema", "mayonesa"),
            "frutos secos", List.of("nuez", "nueces", "almendra", "avellana", "anacardo", "pistacho", "cacahuete", "cacahuetes", "piñon", "pinon"),
            "marisco", List.of("gamba", "langostino", "mejillon", "almeja", "cangrejo", "sepia", "calamar", "pulpo"),
            "pescado", List.of("salmon", "atun", "merluza", "bacalao", "corvina", "trucha", "anchoa", "boqueron", "sardina"),
            "soja", List.of("soja", "tofu", "miso", "edamame", "tamari"),
            "sesamo", List.of("sesamo", "tahini", "tahin"),
            "sulfitos", List.of("vino", "vinagre"));

    /**
     * Filtro duro por preferencias alimentarias del usuario: excluye del pool las recetas que
     * no cumplen la dieta declarada (vegano / vegetariano / sin gluten / tipoDieta) y las que
     * contienen algún alérgeno o ingrediente no deseado. La seguridad manda sobre la variedad:
     * si el resultado queda corto, se queda corto.
     */
    private List<Receta> filtrarPorPreferenciasAlimentarias(List<Receta> recetas, Preferencias preferencias) {
        if (preferencias == null || recetas.isEmpty()) {
            return recetas;
        }

        List<String> etiquetasRequeridas = etiquetasDietaRequeridas(preferencias);
        Set<String> terminosVetados = terminosIngredientesVetados(preferencias);

        List<Receta> trasDieta = etiquetasRequeridas.isEmpty()
                ? recetas
                : recetas.stream().filter(r -> cumpleAlgunaEtiqueta(r, etiquetasRequeridas)).toList();

        if (terminosVetados.isEmpty()) {
            return trasDieta;
        }

        Map<String, List<IngredienteReceta>> ingredientesPorReceta = ingredienteRepository
                .findByRecetaIdIn(trasDieta.stream().map(Receta::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(IngredienteReceta::getRecetaId));

        return trasDieta.stream()
                .filter(r -> ingredientesPorReceta.getOrDefault(r.getId(), List.of()).stream()
                        .noneMatch(i -> ingredienteContieneTerminoVetado(i.getNombre(), terminosVetados)))
                .toList();
    }

    private List<String> etiquetasDietaRequeridas(Preferencias p) {
        Set<String> req = new HashSet<>();
        if (p.isVegano()) req.add("vegano");
        if (p.isVegetariano()) req.add("vegetariano");
        if (p.isSinGluten()) req.add("sin gluten");
        if (p.getTipoDieta() != null && !p.getTipoDieta().isBlank()) {
            req.add(p.getTipoDieta().trim().toLowerCase(Locale.ROOT));
        }
        return new ArrayList<>(req);
    }

    // "vegetariano" en preferencias también acepta recetas marcadas solo como "vegano".
    private boolean cumpleAlgunaEtiqueta(Receta receta, List<String> etiquetasRequeridas) {
        List<String> etiquetasReceta = receta.getEtiquetas() == null ? List.of()
                : receta.getEtiquetas().stream().map(e -> e.trim().toLowerCase(Locale.ROOT)).toList();
        return etiquetasRequeridas.stream().allMatch(req ->
                etiquetasReceta.contains(req)
                        || ("vegetariano".equals(req) && etiquetasReceta.contains("vegano")));
    }

    private Set<String> terminosIngredientesVetados(Preferencias p) {
        Set<String> terminos = new HashSet<>();
        agregarTerminosVetados(terminos, p.getAlergenos());
        agregarTerminosVetados(terminos, p.getIngredientesNoDeseados());
        return terminos;
    }

    private void agregarTerminosVetados(Set<String> acumulador, List<String> valores) {
        if (valores == null) {
            return;
        }
        for (String valor : valores) {
            String normalizado = normalizarTexto(valor);
            if (normalizado.isBlank()) {
                continue;
            }
            acumulador.add(normalizado);
            List<String> sinonimos = SINONIMOS_ALERGENOS.get(normalizado);
            if (sinonimos != null) {
                acumulador.addAll(sinonimos);
            }
        }
    }

    private boolean ingredienteContieneTerminoVetado(String nombreIngrediente, Set<String> terminosVetados) {
        String nombre = normalizarTexto(nombreIngrediente);
        if (nombre.isBlank()) {
            return false;
        }
        return terminosVetados.stream().anyMatch(t -> nombre.contains(t) || t.contains(nombre));
    }

    private String normalizarTexto(String texto) {
        if (texto == null) {
            return "";
        }
        String sinAcentos = Normalizer.normalize(texto.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return sinAcentos;
    }

    /**
     * Cuando el usuario filtra manualmente por un eje (dificultad, categoría, etiqueta o tiempo),
     * esa dimensión deja de condicionar el orden: se vacía la preferencia guardada del perfil
     * para ese eje concreto y se mantiene el resto del sesgo.
     */
    private PerfilGustos neutralizarEjesFiltrados(PerfilGustos perfil, FiltrosFeedDTO filtros) {
        if (filtros == null || filtros.estaVacio()) {
            return perfil;
        }
        return PerfilGustos.builder()
                .id(perfil.getId())
                .usuarioId(perfil.getUsuarioId())
                .categoriasPreferidas(filtros.categorias().isEmpty()
                        ? perfil.getCategoriasPreferidas() : new HashMap<>())
                .etiquetasPreferidas(filtros.etiquetas().isEmpty()
                        ? perfil.getEtiquetasPreferidas() : new HashMap<>())
                .dificultadesPreferidas(filtros.dificultades().isEmpty()
                        ? perfil.getDificultadesPreferidas() : new HashMap<>())
                .tiempoMaximoHabitual(filtros.tiempos().isEmpty() ? perfil.getTiempoMaximoHabitual() : null)
                .ingredientesHabituales(perfil.getIngredientesHabituales())
                .totalInteracciones(perfil.getTotalInteracciones())
                .updatedAt(perfil.getUpdatedAt())
                .build();
    }

    private PerfilGustos obtenerOPredeterminarPerfil(String usuarioId) {
        return perfilGustosRepository.findByUsuarioId(usuarioId)
                .orElseGet(() -> PerfilGustos.builder()
                        .usuarioId(usuarioId)
                        .categoriasPreferidas(new HashMap<>())
                        .etiquetasPreferidas(new HashMap<>())
                        .dificultadesPreferidas(new HashMap<>())
                        .build());
    }

    private CoincidenciaDespensa calcularCoincidenciaDespensa(List<IngredienteReceta> ingredientes,
                                                                List<String> nombresProductosDespensa) {
        int disponibles = 0;
        boolean huboParcial = false;
        for (IngredienteReceta ingrediente : ingredientes) {
            TipoMatch tipo = mejorTipoMatch(ingrediente.getNombre(), nombresProductosDespensa);
            if (tipo != TipoMatch.NUEVO) {
                disponibles++;
                if (tipo == TipoMatch.PROPONER) {
                    huboParcial = true;
                }
            }
        }
        int total = ingredientes.size();
        int faltantes = total - disponibles;
        double coincidencia = total == 0 ? 0 : Math.round(disponibles * 1000.0 / total) / 10.0;
        return new CoincidenciaDespensa(disponibles, faltantes, coincidencia, huboParcial);
    }

    private TipoMatch mejorTipoMatch(String nombreIngrediente, List<String> nombresProductosDespensa) {
        if (nombreIngrediente == null || nombresProductosDespensa.isEmpty()) {
            return TipoMatch.NUEVO;
        }
        double mejorPuntuacion = nombresProductosDespensa.stream()
                .mapToDouble(nombreProducto -> matchingService.calcularSimilitud(nombreIngrediente, nombreProducto).puntuacion())
                .max()
                .orElse(0.0);
        return matchingService.clasificarMatch(mejorPuntuacion);
    }

    private record CoincidenciaDespensa(int disponibles, int faltantes, double coincidencia, boolean coincidenciaParcial) {}

    private Map<String, List<String>> obtenerLikesDeSeguidosPorReceta(List<String> recetaIds, Set<String> seguidosIds) {
        if (recetaIds.isEmpty() || seguidosIds.isEmpty()) {
            return Map.of();
        }
        return likeRepository.findByRecetaIdInAndUsuarioIdIn(recetaIds, seguidosIds).stream()
                .collect(Collectors.groupingBy(Like::getRecetaId,
                        Collectors.mapping(Like::getUsuarioId, Collectors.toList())));
    }

    private Set<String> obtenerRecetasCompartidasPorSeguido(String usuarioId, List<String> recetaIds, Set<String> seguidosIds) {
        if (recetaIds.isEmpty() || seguidosIds.isEmpty()) {
            return Set.of();
        }
        return recetaCompartidaRepository.findByReceptorIdAndRecetaIdIn(usuarioId, recetaIds).stream()
                .filter(rc -> seguidosIds.contains(rc.getEmisorId()))
                .map(RecetaCompartida::getRecetaId)
                .collect(Collectors.toSet());
    }

    private Map<String, String> resolverNombresLikers(List<String> recetaIds,
                                                        Map<String, List<String>> likesDeSeguidosPorReceta) {
        Set<String> idsNecesarios = recetaIds.stream()
                .flatMap(id -> likesDeSeguidosPorReceta.getOrDefault(id, List.of()).stream()
                        .limit(MAXIMO_NOMBRES_LIKES))
                .collect(Collectors.toSet());

        if (idsNecesarios.isEmpty()) {
            return Map.of();
        }

        return usuarioRepository.findAllById(idsNecesarios).stream()
                .collect(Collectors.toMap(Usuario::getId, Usuario::getNombre));
    }

    private CandidatoRecetaDTO construirCandidato(Receta receta, List<String> nombresProductosDespensa,
                                                    Set<String> ingredientesProximosACaducar,
                                                    List<String> seguidosQueDieronLike, boolean compartidaPorSeguido,
                                                    LocalDateTime fechaDescarte) {
        List<IngredienteReceta> ingredientes = ingredienteRepository.findByRecetaId(receta.getId());
        CoincidenciaDespensa coincidenciaInfo = calcularCoincidenciaDespensa(ingredientes, nombresProductosDespensa);

        boolean tieneProximosACaducar = ingredientes.stream()
                .anyMatch(i -> i.getNombre() != null
                        && ingredientesProximosACaducar.contains(i.getNombre().trim().toLowerCase()));

        ContextoPuntuacionDTO contexto = new ContextoPuntuacionDTO(
                coincidenciaInfo.coincidencia(), tieneProximosACaducar, seguidosQueDieronLike, compartidaPorSeguido,
                fechaDescarte);

        return new CandidatoRecetaDTO(receta, contexto);
    }

    private RecetaFeedDTO toFeedDTO(RecetaPuntuadaDTO recetaPuntuada, String usuarioId,
                                     List<String> nombresProductosDespensa, Set<String> seguidosIds,
                                     Map<String, List<String>> likesDeSeguidosPorReceta,
                                     Set<String> recetasCompartidasPorSeguido,
                                     Map<String, String> nombresPorUsuarioId) {
        Receta receta = recetaPuntuada.receta();
        List<IngredienteReceta> ingredientes = ingredienteRepository.findByRecetaId(receta.getId());
        CoincidenciaDespensa coincidenciaInfo = calcularCoincidenciaDespensa(ingredientes, nombresProductosDespensa);

        Usuario autor = usuarioRepository.findById(receta.getAutorId()).orElse(null);
        long likes = likeRepository.countByRecetaId(receta.getId());
        boolean yaLike = likeRepository.existsByUsuarioIdAndRecetaId(usuarioId, receta.getId());
        boolean yaGuardada = recetaGuardadaRepository.existsByUsuarioIdAndRecetaId(usuarioId, receta.getId());

        boolean publicadaPorSeguido = seguidosIds.contains(receta.getAutorId());
        List<String> idsLikers = likesDeSeguidosPorReceta.getOrDefault(receta.getId(), List.of());
        int likesDeSeguidosCount = idsLikers.size();
        List<String> nombresLikers = idsLikers.stream()
                .limit(MAXIMO_NOMBRES_LIKES)
                .map(id -> nombresPorUsuarioId.getOrDefault(id, "alguien"))
                .toList();
        boolean compartidaContigo = recetasCompartidasPorSeguido.contains(receta.getId());

        ContextoSocialDTO contextoSocial = new ContextoSocialDTO(
                publicadaPorSeguido,
                publicadaPorSeguido,
                nombresLikers,
                compartidaContigo,
                construirTextoContexto(nombresLikers, likesDeSeguidosCount, publicadaPorSeguido, compartidaContigo));

        return new RecetaFeedDTO(
                receta.getId(),
                receta.getTitulo(),
                receta.getAutorId(),
                autor != null ? autor.getNombre() : null,
                autor != null ? autor.getNombreUsuario() : null,
                autor != null ? autor.getFotoPerfil() : null,
                receta.getTiempoEstimado(),
                receta.getDificultad(),
                receta.getCategoria(),
                receta.getNumPersonas(),
                receta.getEtiquetas(),
                receta.getImagenUrl(),
                likes,
                yaLike,
                yaGuardada,
                coincidenciaInfo.coincidencia(),
                coincidenciaInfo.disponibles(),
                coincidenciaInfo.faltantes(),
                receta.getCreatedAt(),
                recetaPuntuada.motivoRecomendacion(),
                publicadaPorSeguido,
                likesDeSeguidosCount,
                contextoSocial,
                recetaPuntuada.modoFallback(),
                coincidenciaInfo.coincidenciaParcial());
    }

    private String construirTextoContexto(List<String> nombresLikers, int totalLikesDeSeguidos,
                                           boolean publicadaPorSeguido, boolean compartidaContigo) {
        if (!nombresLikers.isEmpty()) {
            if (totalLikesDeSeguidos == 1) {
                return "A " + nombresLikers.get(0) + " le gusta esto";
            }
            int otros = totalLikesDeSeguidos - 1;
            return "A " + nombresLikers.get(0) + " y " + otros + " más les gusta esto";
        }

        if (publicadaPorSeguido) {
            return "Publicado por alguien que sigues";
        }

        if (compartidaContigo) {
            return "Compartida contigo";
        }

        return null;
    }

    private record DescartesInfo(List<String> idsRecientes, Map<String, LocalDateTime> fechaAntiguaPorReceta) {}
}
