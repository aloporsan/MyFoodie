package com.myfoodie.application.service;

import com.myfoodie.application.dto.despensa.ProductoUpdateCantidadDTO;
import com.myfoodie.application.dto.receta.*;
import com.myfoodie.domain.model.Despensa;
import com.myfoodie.domain.model.IngredienteReceta;
import com.myfoodie.domain.model.Paso;
import com.myfoodie.domain.model.Producto;
import com.myfoodie.domain.model.Receta;
import com.myfoodie.domain.model.RecetaGuardada;
import com.myfoodie.domain.model.Usuario;
import com.myfoodie.domain.repository.DespensaRepository;
import com.myfoodie.domain.repository.IngredienteRecetaRepository;
import com.myfoodie.domain.repository.LikeRepository;
import com.myfoodie.domain.repository.PasoRepository;
import com.myfoodie.domain.repository.ProductoRepository;
import com.myfoodie.domain.repository.RecetaGuardadaRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import com.myfoodie.domain.repository.UsuarioRepository;
import com.myfoodie.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecetaService {

    private final RecetaRepository recetaRepository;
    private final IngredienteRecetaRepository ingredienteRepository;
    private final PasoRepository pasoRepository;
    private final RecetaGuardadaRepository recetaGuardadaRepository;
    private final LikeRepository likeRepository;
    private final UsuarioRepository usuarioRepository;
    private final DespensaRepository despensaRepository;
    private final ProductoRepository productoRepository;
    private final DespensaService despensaService;

    // -------------------------------------------------------------------------
    // CRUD básico
    // -------------------------------------------------------------------------

    public RecetaResponseDTO crearReceta(String usuarioId, RecetaRequestDTO dto) {
        if (dto.titulo() == null || dto.titulo().isBlank())
            throw new ApiException(HttpStatus.BAD_REQUEST, "El título es obligatorio");

        Receta receta = Receta.builder()
                .autorId(usuarioId)
                .titulo(dto.titulo())
                .descripcion(dto.descripcion())
                .tiempoEstimado(dto.tiempoEstimado())
                .dificultad(dto.dificultad())
                .categoria(dto.categoria())
                .etiquetas(dto.etiquetas() != null ? dto.etiquetas() : new ArrayList<>())
                .imagenUrl(dto.imagenUrl())
                .numPersonas(dto.numPersonas() != null ? dto.numPersonas() : 2)
                .estado("borrador")
                .build();

        Receta saved = recetaRepository.save(receta);
        return toDTO(saved);
    }

    public RecetaResponseDTO obtenerReceta(String recetaId, String usuarioId) {
        return toDTO(getReceta(recetaId));
    }

    public RecetaResponseDTO editarReceta(String usuarioId, String recetaId, RecetaRequestDTO dto) {
        Receta receta = getRecetaDelAutor(recetaId, usuarioId);

        receta.setTitulo(dto.titulo());
        receta.setDescripcion(dto.descripcion());
        receta.setTiempoEstimado(dto.tiempoEstimado());
        receta.setDificultad(dto.dificultad());
        receta.setCategoria(dto.categoria());
        receta.setEtiquetas(dto.etiquetas() != null ? dto.etiquetas() : new ArrayList<>());
        receta.setImagenUrl(dto.imagenUrl());
        receta.setNumPersonas(dto.numPersonas() != null ? dto.numPersonas() : 2);
        receta.setUpdatedAt(LocalDateTime.now());

        return toDTO(recetaRepository.save(receta));
    }

    public void eliminarReceta(String usuarioId, String recetaId) {
        Receta receta = getRecetaDelAutor(recetaId, usuarioId);
        ingredienteRepository.deleteByRecetaId(recetaId);
        pasoRepository.deleteByRecetaId(recetaId);
        recetaRepository.delete(receta);
    }

    public RecetaResponseDTO guardarComoBorrador(String usuarioId, String recetaId) {
        Receta receta = getRecetaDelAutor(recetaId, usuarioId);
        receta.setEstado("borrador");
        receta.setUpdatedAt(LocalDateTime.now());
        return toDTO(recetaRepository.save(receta));
    }

    public RecetaResponseDTO publicarReceta(String usuarioId, String recetaId) {
        Receta receta = getRecetaDelAutor(recetaId, usuarioId);
        validarParaPublicar(receta, recetaId);
        receta.setEstado("publicada");
        receta.setUpdatedAt(LocalDateTime.now());
        return toDTO(recetaRepository.save(receta));
    }

    public List<RecetaFeedDTO> misRecetas(String usuarioId) {
        return recetaRepository.findByAutorId(usuarioId)
                .stream()
                .map(r -> toFeedDTO(r, usuarioId))
                .toList();
    }

    public List<RecetaResumenDTO> misBorradores(String usuarioId) {
        return recetaRepository.findByAutorIdAndEstado(usuarioId, "borrador")
                .stream()
                .map(this::toResumenDTO)
                .toList();
    }

    public void guardarReceta(String usuarioId, String recetaId) {
        getReceta(recetaId);
        if (!recetaGuardadaRepository.existsByUsuarioIdAndRecetaId(usuarioId, recetaId)) {
            recetaGuardadaRepository.save(RecetaGuardada.builder()
                    .usuarioId(usuarioId)
                    .recetaId(recetaId)
                    .build());
        }
    }

    public void quitarGuardado(String usuarioId, String recetaId) {
        recetaGuardadaRepository.findByUsuarioIdAndRecetaId(usuarioId, recetaId)
                .ifPresent(recetaGuardadaRepository::delete);
    }

    public List<RecetaFeedDTO> recetasGuardadas(String usuarioId) {
        List<RecetaGuardada> guardadas = recetaGuardadaRepository.findByUsuarioIdOrderBySavedAtDesc(usuarioId);

        Map<String, Receta> recetasPorId = recetaRepository
                .findAllById(guardadas.stream().map(RecetaGuardada::getRecetaId).toList())
                .stream()
                .collect(Collectors.toMap(Receta::getId, Function.identity()));

        return guardadas.stream()
                .map(g -> recetasPorId.get(g.getRecetaId()))
                .filter(r -> r != null)
                .map(r -> toFeedDTO(r, usuarioId))
                .toList();
    }

    // -------------------------------------------------------------------------
    // Ingredientes
    // -------------------------------------------------------------------------

    public RecetaResponseDTO añadirIngrediente(String usuarioId, String recetaId, IngredienteRequestDTO dto) {
        getRecetaDelAutor(recetaId, usuarioId);

        IngredienteReceta ingrediente = IngredienteReceta.builder()
                .recetaId(recetaId)
                .nombre(dto.nombre())
                .cantidad(dto.cantidad())
                .unidad(dto.unidad())
                .observacion(dto.observacion())
                .build();

        ingredienteRepository.save(ingrediente);
        actualizarTimestamp(recetaId);
        return toDTO(getReceta(recetaId));
    }

    public void eliminarIngrediente(String usuarioId, String recetaId, String ingredienteId) {
        getRecetaDelAutor(recetaId, usuarioId);
        IngredienteReceta ingrediente = ingredienteRepository.findByRecetaIdAndId(recetaId, ingredienteId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ingrediente no encontrado"));
        ingredienteRepository.delete(ingrediente);
        actualizarTimestamp(recetaId);
    }

    // -------------------------------------------------------------------------
    // Pasos
    // -------------------------------------------------------------------------

    public RecetaResponseDTO añadirPaso(String usuarioId, String recetaId, PasoRequestDTO dto) {
        if (dto.descripcion() == null || dto.descripcion().isBlank())
            throw new ApiException(HttpStatus.BAD_REQUEST, "La descripción del paso es obligatoria");

        getRecetaDelAutor(recetaId, usuarioId);

        List<Paso> pasos = pasoRepository.findByRecetaIdOrderByOrdenAsc(recetaId);
        int siguienteOrden = pasos.size() + 1;

        Paso paso = Paso.builder()
                .recetaId(recetaId)
                .orden(siguienteOrden)
                .descripcion(dto.descripcion())
                .imagenUrl(dto.imagenUrl())
                .build();

        pasoRepository.save(paso);
        actualizarTimestamp(recetaId);
        return toDTO(getReceta(recetaId));
    }

    public RecetaResponseDTO reordenarPasos(String usuarioId, String recetaId, List<String> ordenIds) {
        getRecetaDelAutor(recetaId, usuarioId);

        List<Paso> pasos = pasoRepository.findByRecetaIdOrderByOrdenAsc(recetaId);
        for (Paso p : pasos) {
            int nuevoOrden = ordenIds.indexOf(p.getId());
            if (nuevoOrden >= 0) {
                p.setOrden(nuevoOrden + 1);
            }
        }
        pasoRepository.saveAll(pasos);
        actualizarTimestamp(recetaId);
        return toDTO(getReceta(recetaId));
    }

    public void eliminarPaso(String usuarioId, String recetaId, String pasoId) {
        getRecetaDelAutor(recetaId, usuarioId);
        Paso paso = pasoRepository.findByRecetaIdAndId(recetaId, pasoId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Paso no encontrado"));
        int ordenEliminado = paso.getOrden();
        pasoRepository.delete(paso);

        List<Paso> restantes = pasoRepository.findByRecetaIdOrderByOrdenAsc(recetaId);
        for (Paso p : restantes) {
            if (p.getOrden() > ordenEliminado) {
                p.setOrden(p.getOrden() - 1);
            }
        }
        pasoRepository.saveAll(restantes);
        actualizarTimestamp(recetaId);
    }

    // -------------------------------------------------------------------------
    // Marcar como realizada / descontar stock
    // -------------------------------------------------------------------------

    public List<IngredienteConsumoDTO> marcarRecetaComoRealizada(String usuarioId, String recetaId,
                                                                   int racionesElaboradas) {
        Receta receta = getReceta(recetaId);
        validarRecetaGuardada(usuarioId, recetaId);
        double factor = factorRaciones(receta, racionesElaboradas);
        List<Producto> productos = productosDespensa(usuarioId);

        return ingredienteRepository.findByRecetaId(recetaId).stream()
                .map(i -> calcularConsumo(i, factor, productos))
                .toList();
    }

    public DescuentoRecetaResponseDTO descontarIngredientesReceta(String usuarioId, String recetaId,
                                                                    int racionesElaboradas) {
        Receta receta = getReceta(recetaId);
        validarRecetaGuardada(usuarioId, recetaId);
        double factor = factorRaciones(receta, racionesElaboradas);
        List<Producto> productos = productosDespensa(usuarioId);

        List<IngredienteConsumoDTO> descontados = new ArrayList<>();
        List<IngredienteConsumoDTO> noDisponibles = new ArrayList<>();

        for (IngredienteReceta ingrediente : ingredienteRepository.findByRecetaId(recetaId)) {
            IngredienteConsumoDTO consumo = calcularConsumo(ingrediente, factor, productos);
            if (!consumo.productoEnDespensa()) {
                noDisponibles.add(consumo);
                continue;
            }

            double aDescontar = Math.min(consumo.cantidadCalculada(), consumo.cantidadDisponible());
            if (aDescontar > 0) {
                Producto producto = buscarProductoPorNombre(productos, ingrediente.getNombre());
                despensaService.actualizarCantidad(usuarioId, producto.getId(),
                        new ProductoUpdateCantidadDTO(-aDescontar, "usado_en_receta", null,
                                "Usado en receta: " + receta.getTitulo()));
            }
            descontados.add(consumo);
        }

        return new DescuentoRecetaResponseDTO(descontados, noDisponibles);
    }

    private void validarRecetaGuardada(String usuarioId, String recetaId) {
        if (!recetaGuardadaRepository.existsByUsuarioIdAndRecetaId(usuarioId, recetaId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "La receta no está guardada");
        }
    }

    private double factorRaciones(Receta receta, int racionesElaboradas) {
        if (racionesElaboradas <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Las raciones elaboradas deben ser mayores que 0");
        }
        return (double) racionesElaboradas / receta.getNumPersonas();
    }

    private List<Producto> productosDespensa(String usuarioId) {
        return despensaRepository.findByUsuarioId(usuarioId)
                .map(Despensa::getId)
                .map(productoRepository::findByDespensaId)
                .orElse(List.of());
    }

    private IngredienteConsumoDTO calcularConsumo(IngredienteReceta ingrediente, double factor,
                                                    List<Producto> productos) {
        double cantidadCalculada = ingrediente.getCantidad() * factor;
        Producto producto = buscarProductoPorNombre(productos, ingrediente.getNombre());
        boolean enDespensa = producto != null;
        double disponible = enDespensa ? producto.getCantidad() : 0;
        boolean suficiente = enDespensa && disponible >= cantidadCalculada;
        return new IngredienteConsumoDTO(
                ingrediente.getNombre(), cantidadCalculada, ingrediente.getUnidad(),
                enDespensa, disponible, suficiente);
    }

    private Producto buscarProductoPorNombre(List<Producto> productos, String nombre) {
        return productos.stream()
                .filter(p -> normalizar(p.getNombre()).equals(normalizar(nombre)))
                .findFirst()
                .orElse(null);
    }

    private String normalizar(String texto) {
        return texto == null ? "" : texto.trim().toLowerCase(Locale.ROOT);
    }

    // -------------------------------------------------------------------------
    // Etiquetas e imagen
    // -------------------------------------------------------------------------

    public RecetaResponseDTO actualizarEtiquetas(String usuarioId, String recetaId, List<String> etiquetas) {
        Receta receta = getRecetaDelAutor(recetaId, usuarioId);
        receta.setEtiquetas(etiquetas);
        receta.setUpdatedAt(LocalDateTime.now());
        return toDTO(recetaRepository.save(receta));
    }

    public RecetaResponseDTO subirImagenReceta(String usuarioId, String recetaId, String imageUrl) {
        Receta receta = getRecetaDelAutor(recetaId, usuarioId);
        receta.setImagenUrl(imageUrl);
        receta.setUpdatedAt(LocalDateTime.now());
        return toDTO(recetaRepository.save(receta));
    }

    // -------------------------------------------------------------------------
    // Helpers privados
    // -------------------------------------------------------------------------

    private Receta getReceta(String recetaId) {
        return recetaRepository.findById(recetaId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Receta no encontrada"));
    }

    private Receta getRecetaDelAutor(String recetaId, String usuarioId) {
        Receta receta = getReceta(recetaId);
        if (!receta.getAutorId().equals(usuarioId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "No tienes permiso para modificar esta receta");
        }
        return receta;
    }

    private void validarParaPublicar(Receta receta, String recetaId) {
        List<String> errores = new ArrayList<>();

        if (receta.getTitulo() == null || receta.getTitulo().isBlank())
            errores.add("El título es obligatorio");
        if (receta.getDescripcion() == null || receta.getDescripcion().isBlank())
            errores.add("La descripción es obligatoria");
        if (receta.getTiempoEstimado() <= 0)
            errores.add("El tiempo estimado debe ser mayor que 0");
        if (receta.getDificultad() == null || receta.getDificultad().isBlank())
            errores.add("La dificultad es obligatoria");
        if (receta.getCategoria() == null || receta.getCategoria().isBlank())
            errores.add("La categoría es obligatoria");
        if (ingredienteRepository.findByRecetaId(recetaId).isEmpty())
            errores.add("La receta debe tener al menos un ingrediente");
        if (pasoRepository.findByRecetaIdOrderByOrdenAsc(recetaId).isEmpty())
            errores.add("La receta debe tener al menos un paso");

        if (!errores.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, String.join(", ", errores));
        }
    }

    private void actualizarTimestamp(String recetaId) {
        recetaRepository.findById(recetaId).ifPresent(r -> {
            r.setUpdatedAt(LocalDateTime.now());
            recetaRepository.save(r);
        });
    }

    RecetaResponseDTO toDTO(Receta receta) {
        List<RecetaResponseDTO.IngredienteResponseDTO> ingredientes =
                ingredienteRepository.findByRecetaId(receta.getId())
                        .stream()
                        .map(i -> new RecetaResponseDTO.IngredienteResponseDTO(
                                i.getId(), i.getNombre(), i.getCantidad(), i.getUnidad(), i.getObservacion()))
                        .toList();

        List<RecetaResponseDTO.PasoResponseDTO> pasos =
                pasoRepository.findByRecetaIdOrderByOrdenAsc(receta.getId())
                        .stream()
                        .map(p -> new RecetaResponseDTO.PasoResponseDTO(
                                p.getId(), p.getOrden(), p.getDescripcion(), p.getImagenUrl()))
                        .toList();

        Usuario autor = usuarioRepository.findById(receta.getAutorId()).orElse(null);

        return new RecetaResponseDTO(
                receta.getId(),
                receta.getAutorId(),
                autor != null ? autor.getNombre() : null,
                autor != null ? autor.getNombreUsuario() : null,
                receta.getTitulo(),
                receta.getDescripcion(),
                receta.getTiempoEstimado(),
                receta.getDificultad(),
                receta.getCategoria(),
                receta.getEtiquetas(),
                receta.getImagenUrl(),
                receta.getEstado(),
                receta.getNumPersonas(),
                ingredientes,
                pasos,
                receta.getCreatedAt(),
                receta.getUpdatedAt()
        );
    }

    RecetaFeedDTO toFeedDTO(Receta receta, String usuarioId) {
        List<RecetaResponseDTO.IngredienteResponseDTO> ingredientes =
                ingredienteRepository.findByRecetaId(receta.getId())
                        .stream()
                        .map(i -> new RecetaResponseDTO.IngredienteResponseDTO(
                                i.getId(), i.getNombre(), i.getCantidad(), i.getUnidad(), i.getObservacion()))
                        .toList();

        List<RecetaResponseDTO.PasoResponseDTO> pasos =
                pasoRepository.findByRecetaIdOrderByOrdenAsc(receta.getId())
                        .stream()
                        .map(p -> new RecetaResponseDTO.PasoResponseDTO(
                                p.getId(), p.getOrden(), p.getDescripcion(), p.getImagenUrl()))
                        .toList();

        Usuario autor = usuarioRepository.findById(receta.getAutorId()).orElse(null);
        long totalLikes = likeRepository.countByRecetaId(receta.getId());
        boolean likeUsuario = likeRepository.existsByUsuarioIdAndRecetaId(usuarioId, receta.getId());

        return new RecetaFeedDTO(
                receta.getId(),
                receta.getAutorId(),
                autor != null ? autor.getNombre() : null,
                autor != null ? autor.getNombreUsuario() : null,
                receta.getTitulo(),
                receta.getDescripcion(),
                receta.getTiempoEstimado(),
                receta.getDificultad(),
                receta.getCategoria(),
                receta.getEtiquetas(),
                receta.getImagenUrl(),
                receta.getEstado(),
                totalLikes,
                likeUsuario,
                ingredientes,
                pasos,
                receta.getCreatedAt(),
                receta.getUpdatedAt()
        );
    }

    RecetaResumenDTO toResumenDTO(Receta receta) {
        return new RecetaResumenDTO(
                receta.getId(),
                receta.getAutorId(),
                receta.getTitulo(),
                receta.getDescripcion(),
                receta.getTiempoEstimado(),
                receta.getDificultad(),
                receta.getCategoria(),
                receta.getEtiquetas(),
                receta.getImagenUrl(),
                receta.getEstado(),
                receta.getCreatedAt(),
                receta.getUpdatedAt()
        );
    }
}
