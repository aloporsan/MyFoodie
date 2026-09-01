package com.myfoodie.application.service;

import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import com.myfoodie.application.dto.feed.ContextoSocialDTO;
import com.myfoodie.application.dto.feed.FeedResponseDTO;
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
import com.myfoodie.domain.model.Receta;
import com.myfoodie.domain.model.RecetaCompartida;
import com.myfoodie.domain.model.RecetaDescartada;
import com.myfoodie.domain.model.TipoMatch;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.repository.IngredienteRecetaRepository;
import com.myfoodie.domain.repository.LikeRepository;
import com.myfoodie.domain.repository.PerfilGustosRepository;
import com.myfoodie.domain.repository.RecetaCompartidaRepository;
import com.myfoodie.domain.repository.RecetaDescartadaRepository;
import com.myfoodie.domain.repository.RecetaGuardadaRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
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
    private static final int MAXIMO_NOMBRES_LIKES = 3;

    private final RecetaRepository recetaRepository;
    private final RecetaDescartadaRepository recetaDescartadaRepository;
    private final RecetaGuardadaRepository recetaGuardadaRepository;
    private final LikeRepository likeRepository;
    private final RecetaCompartidaRepository recetaCompartidaRepository;
    private final IngredienteRecetaRepository ingredienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final PerfilGustosRepository perfilGustosRepository;
    private final DespensaService despensaService;
    private final SocialService socialService;
    private final RecomendacionService recomendacionService;
    private final MatchingService matchingService;

    public FeedResponseDTO obtenerFeed(String usuarioId, int pagina, int tamaño) {
        Set<String> seguidosIds = obtenerSeguidosIds(usuarioId);
        DescartesInfo descartes = obtenerDescartes(usuarioId);

        int tamañoPool = calcularTamañoPool(tamaño);
        PageRequest poolRequest = PageRequest.of(0, tamañoPool, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Receta> candidatas = recetaRepository.findByEstadoAndAutorIdNotAndIdNotIn(
                ESTADO_PUBLICADA, usuarioId, descartes.idsRecientes(), poolRequest).getContent();

        return construirRespuesta(candidatas, usuarioId, pagina, tamaño, seguidosIds, descartes, true);
    }

    public FeedResponseDTO obtenerRecetasSeguidos(String usuarioId, int pagina, int tamaño) {
        Set<String> seguidosIds = obtenerSeguidosIds(usuarioId);
        if (seguidosIds.isEmpty()) {
            return new FeedResponseDTO(List.of(), pagina, 0, false);
        }

        DescartesInfo descartes = obtenerDescartes(usuarioId);
        int tamañoPool = calcularTamañoPool(tamaño);
        PageRequest poolRequest = PageRequest.of(0, tamañoPool, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Receta> candidatas = recetaRepository.findByEstadoAndAutorIdInAndIdNotIn(
                ESTADO_PUBLICADA, seguidosIds, descartes.idsRecientes(), poolRequest).getContent();

        return construirRespuesta(candidatas, usuarioId, pagina, tamaño, seguidosIds, descartes, false);
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
                                                boolean priorizarSeguidos) {
        PerfilGustos perfilGustos = obtenerOPredeterminarPerfil(usuarioId);
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
                candidatos, usuarioId, seguidosIds, perfilGustos);

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
        Map<String, String> nombresPorUsuarioId = resolverNombresLikers(paginaOrdenada, likesDeSeguidosPorReceta);

        List<RecetaFeedDTO> recetasPagina = paginaOrdenada.stream()
                .map(rp -> toFeedDTO(rp, usuarioId, nombresProductosDespensa, seguidosIds, likesDeSeguidosPorReceta,
                        recetasCompartidasPorSeguido, nombresPorUsuarioId))
                .toList();

        return new FeedResponseDTO(recetasPagina, pagina, totalPaginas, hasta < total);
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

    private Map<String, String> resolverNombresLikers(List<RecetaPuntuadaDTO> pagina,
                                                        Map<String, List<String>> likesDeSeguidosPorReceta) {
        Set<String> idsNecesarios = pagina.stream()
                .flatMap(rp -> likesDeSeguidosPorReceta.getOrDefault(rp.receta().getId(), List.of()).stream()
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
