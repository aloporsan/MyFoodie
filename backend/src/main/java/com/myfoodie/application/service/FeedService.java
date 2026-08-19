package com.myfoodie.application.service;

import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import com.myfoodie.application.dto.feed.FeedResponseDTO;
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
import java.util.HashMap;
import java.util.HashSet;
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

    public FeedResponseDTO obtenerFeed(String usuarioId, int pagina, int tamaño) {
        LocalDateTime limiteReaparicion = LocalDateTime.now().minusDays(DIAS_REAPARICION_DESCARTE);
        List<RecetaDescartada> descartes = recetaDescartadaRepository.findByUsuarioId(usuarioId);

        List<String> idsDescartadosRecientes = descartes.stream()
                .filter(d -> d.getCreatedAt().isAfter(limiteReaparicion))
                .map(RecetaDescartada::getRecetaId)
                .toList();

        Map<String, LocalDateTime> fechaDescarteAntiguoPorReceta = descartes.stream()
                .filter(d -> !d.getCreatedAt().isAfter(limiteReaparicion))
                .collect(Collectors.toMap(RecetaDescartada::getRecetaId, RecetaDescartada::getCreatedAt));

        int tamañoPool = Math.min(TAMAÑO_MAXIMO_POOL, Math.max(TAMAÑO_MINIMO_POOL, tamaño * 5));
        PageRequest poolRequest = PageRequest.of(0, tamañoPool, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Receta> candidatas = recetaRepository.findByEstadoAndAutorIdNotAndIdNotIn(
                ESTADO_PUBLICADA, usuarioId, idsDescartadosRecientes, poolRequest).getContent();

        Set<String> seguidosIds = socialService.obtenerSeguidos(usuarioId).stream()
                .map(SeguimientoResponseDTO::usuarioId)
                .collect(Collectors.toSet());

        PerfilGustos perfilGustos = obtenerOPredeterminarPerfil(usuarioId);
        Set<String> ingredientesDespensa = obtenerIngredientesDespensa(usuarioId);
        Set<String> ingredientesProximosACaducar = obtenerIngredientesProximosACaducar(usuarioId);

        List<String> idsCandidatas = candidatas.stream().map(Receta::getId).toList();
        Map<String, List<String>> likesDeSeguidosPorReceta = obtenerLikesDeSeguidosPorReceta(idsCandidatas, seguidosIds);
        Set<String> recetasCompartidasPorSeguido = obtenerRecetasCompartidasPorSeguido(usuarioId, idsCandidatas, seguidosIds);

        List<CandidatoRecetaDTO> candidatos = candidatas.stream()
                .map(receta -> construirCandidato(
                        receta,
                        ingredientesDespensa,
                        ingredientesProximosACaducar,
                        likesDeSeguidosPorReceta.getOrDefault(receta.getId(), List.of()),
                        recetasCompartidasPorSeguido.contains(receta.getId()),
                        fechaDescarteAntiguoPorReceta.get(receta.getId())))
                .toList();

        List<RecetaPuntuadaDTO> recetasOrdenadas = recomendacionService.ordenarFeed(
                candidatos, usuarioId, seguidosIds, perfilGustos);

        int total = recetasOrdenadas.size();
        int desde = Math.min(pagina * tamaño, total);
        int hasta = Math.min(desde + tamaño, total);
        int totalPaginas = tamaño == 0 ? 0 : (int) Math.ceil(total / (double) tamaño);

        List<RecetaFeedDTO> recetasPagina = recetasOrdenadas.subList(desde, hasta).stream()
                .map(rp -> toFeedDTO(rp, usuarioId, ingredientesDespensa, seguidosIds, likesDeSeguidosPorReceta))
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

    private Set<String> obtenerIngredientesDespensa(String usuarioId) {
        return despensaService.listarProductos(usuarioId).stream()
                .map(ProductoResponseDTO::nombre)
                .filter(nombre -> nombre != null && !nombre.isBlank())
                .map(nombre -> nombre.trim().toLowerCase())
                .collect(Collectors.toSet());
    }

    private Set<String> obtenerIngredientesProximosACaducar(String usuarioId) {
        return despensaService.listarProductos(usuarioId).stream()
                .filter(p -> ESTADO_CADUCA_HOY.equals(p.estado()) || ESTADO_CADUCA_PRONTO.equals(p.estado()))
                .map(ProductoResponseDTO::nombre)
                .filter(nombre -> nombre != null && !nombre.isBlank())
                .map(nombre -> nombre.trim().toLowerCase())
                .collect(Collectors.toSet());
    }

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

    private CandidatoRecetaDTO construirCandidato(Receta receta, Set<String> ingredientesDespensa,
                                                    Set<String> ingredientesProximosACaducar,
                                                    List<String> seguidosQueDieronLike, boolean compartidaPorSeguido,
                                                    LocalDateTime fechaDescarte) {
        List<IngredienteReceta> ingredientes = ingredienteRepository.findByRecetaId(receta.getId());

        int total = ingredientes.size();
        int disponibles = (int) ingredientes.stream()
                .filter(i -> i.getNombre() != null
                        && ingredientesDespensa.contains(i.getNombre().trim().toLowerCase()))
                .count();
        double coincidencia = total == 0 ? 0 : Math.round(disponibles * 1000.0 / total) / 10.0;

        boolean tieneProximosACaducar = ingredientes.stream()
                .anyMatch(i -> i.getNombre() != null
                        && ingredientesProximosACaducar.contains(i.getNombre().trim().toLowerCase()));

        ContextoPuntuacionDTO contexto = new ContextoPuntuacionDTO(
                coincidencia, tieneProximosACaducar, seguidosQueDieronLike, compartidaPorSeguido, fechaDescarte);

        return new CandidatoRecetaDTO(receta, contexto);
    }

    private RecetaFeedDTO toFeedDTO(RecetaPuntuadaDTO recetaPuntuada, String usuarioId,
                                     Set<String> ingredientesDespensa, Set<String> seguidosIds,
                                     Map<String, List<String>> likesDeSeguidosPorReceta) {
        Receta receta = recetaPuntuada.receta();
        List<IngredienteReceta> ingredientes = ingredienteRepository.findByRecetaId(receta.getId());

        int total = ingredientes.size();
        int disponibles = (int) ingredientes.stream()
                .filter(i -> i.getNombre() != null
                        && ingredientesDespensa.contains(i.getNombre().trim().toLowerCase()))
                .count();
        int faltantes = total - disponibles;
        double coincidencia = total == 0 ? 0 : Math.round(disponibles * 1000.0 / total) / 10.0;

        Usuario autor = usuarioRepository.findById(receta.getAutorId()).orElse(null);
        long likes = likeRepository.countByRecetaId(receta.getId());
        boolean yaLike = likeRepository.existsByUsuarioIdAndRecetaId(usuarioId, receta.getId());
        boolean yaGuardada = recetaGuardadaRepository.existsByUsuarioIdAndRecetaId(usuarioId, receta.getId());
        boolean publicadaPorSeguido = seguidosIds.contains(receta.getAutorId());
        int likesDeSeguidosCount = likesDeSeguidosPorReceta.getOrDefault(receta.getId(), List.of()).size();

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
                coincidencia,
                disponibles,
                faltantes,
                receta.getCreatedAt(),
                recetaPuntuada.motivoRecomendacion(),
                publicadaPorSeguido,
                likesDeSeguidosCount);
    }
}
