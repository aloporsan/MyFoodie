package com.myfoodie.application.service;

import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import com.myfoodie.application.dto.feed.FeedResponseDTO;
import com.myfoodie.application.dto.feed.RecetaFeedDTO;
import com.myfoodie.domain.model.IngredienteReceta;
import com.myfoodie.domain.model.Receta;
import com.myfoodie.domain.model.RecetaDescartada;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.repository.IngredienteRecetaRepository;
import com.myfoodie.domain.repository.LikeRepository;
import com.myfoodie.domain.repository.RecetaDescartadaRepository;
import com.myfoodie.domain.repository.RecetaGuardadaRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedService {

    private static final String ESTADO_PUBLICADA = "publicada";

    private final RecetaRepository recetaRepository;
    private final RecetaDescartadaRepository recetaDescartadaRepository;
    private final RecetaGuardadaRepository recetaGuardadaRepository;
    private final LikeRepository likeRepository;
    private final IngredienteRecetaRepository ingredienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final DespensaService despensaService;

    public FeedResponseDTO obtenerFeed(String usuarioId, int pagina, int tamaño) {
        List<String> idsDescartados = recetaDescartadaRepository.findByUsuarioId(usuarioId)
                .stream()
                .map(RecetaDescartada::getRecetaId)
                .toList();

        PageRequest pageRequest = PageRequest.of(pagina, tamaño, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Receta> paginaRecetas = recetaRepository.findByEstadoAndAutorIdNotAndIdNotIn(
                ESTADO_PUBLICADA, usuarioId, idsDescartados, pageRequest);

        Set<String> ingredientesDespensa = obtenerIngredientesDespensa(usuarioId);

        List<RecetaFeedDTO> recetas = paginaRecetas.getContent().stream()
                .map(r -> toFeedDTO(r, usuarioId, ingredientesDespensa))
                .toList();

        return new FeedResponseDTO(
                recetas,
                paginaRecetas.getNumber(),
                paginaRecetas.getTotalPages(),
                paginaRecetas.hasNext());
    }

    private Set<String> obtenerIngredientesDespensa(String usuarioId) {
        return despensaService.listarProductos(usuarioId).stream()
                .map(ProductoResponseDTO::nombre)
                .filter(nombre -> nombre != null && !nombre.isBlank())
                .map(nombre -> nombre.trim().toLowerCase())
                .collect(Collectors.toSet());
    }

    private RecetaFeedDTO toFeedDTO(Receta receta, String usuarioId, Set<String> ingredientesDespensa) {
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
                receta.getCreatedAt());
    }
}
