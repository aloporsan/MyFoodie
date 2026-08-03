package com.myfoodie.application.service;

import com.myfoodie.domain.model.Despensa;
import com.myfoodie.domain.model.IngredienteReceta;
import com.myfoodie.domain.model.ItemCarrito;
import com.myfoodie.domain.model.MovimientoProducto;
import com.myfoodie.domain.model.Preferencias;
import com.myfoodie.domain.model.Producto;
import com.myfoodie.domain.model.Receta;
import com.myfoodie.domain.model.RecetaGuardada;
import com.myfoodie.domain.repository.DespensaRepository;
import com.myfoodie.domain.repository.IngredienteRecetaRepository;
import com.myfoodie.domain.repository.ItemCarritoRepository;
import com.myfoodie.domain.repository.MovimientoProductoRepository;
import com.myfoodie.domain.repository.PreferenciasRepository;
import com.myfoodie.domain.repository.ProductoRepository;
import com.myfoodie.domain.repository.RecetaGuardadaRepository;
import com.myfoodie.domain.repository.RecetaRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CarritoInteligenteService {

    private static final int DIAS_CADUCA_PRONTO = 3;
    private static final int DIAS_CONSUMIDO_RECIENTE = 7;
    private static final int DIAS_CONSUMIDO_HABITUAL = 30;
    private static final double RATIO_INSUFICIENTE = 0.5;
    private static final double COMPLETITUD_RECETA_CASI_LISTA = 0.7;

    private final ItemCarritoRepository itemCarritoRepository;
    private final DespensaRepository despensaRepository;
    private final ProductoRepository productoRepository;
    private final PreferenciasRepository preferenciasRepository;
    private final MovimientoProductoRepository movimientoRepository;
    private final RecetaGuardadaRepository recetaGuardadaRepository;
    private final IngredienteRecetaRepository ingredienteRecetaRepository;
    private final RecetaRepository recetaRepository;

    // -------------------------------------------------------------------------
    // Generación de recomendaciones
    // -------------------------------------------------------------------------

    public List<ItemCarrito> generarRecomendaciones(String usuarioId) {
        Despensa despensa = despensaRepository.findByUsuarioId(usuarioId).orElse(null);
        if (despensa == null) {
            return List.of();
        }

        List<Producto> productos = productoRepository.findByDespensaId(despensa.getId());
        int umbral = obtenerGlobalUmbral(usuarioId);
        List<RecetaGuardada> guardadas = recetaGuardadaRepository.findByUsuarioId(usuarioId);

        Set<String> noVolver = itemCarritoRepository.findByUsuarioIdAndNoVolverTrue(usuarioId)
                .stream().map(i -> normalizar(i.getNombre())).collect(Collectors.toSet());

        Set<String> yaEnCarrito = itemCarritoRepository.findByUsuarioId(usuarioId).stream()
                .filter(i -> "pendiente".equals(i.getEstado()) || "aceptado".equals(i.getEstado()))
                .map(i -> normalizar(i.getNombre())).collect(Collectors.toSet());

        Map<String, ItemCarrito> candidatos = new LinkedHashMap<>();

        candidatosPrioridadAlta(productos, umbral, guardadas).forEach(c -> añadirCandidato(candidatos, c));
        candidatosPrioridadMedia(despensa, productos, umbral, guardadas).forEach(c -> añadirCandidato(candidatos, c));
        candidatosPrioridadBaja(despensa, productos, umbral, guardadas).forEach(c -> añadirCandidato(candidatos, c));

        List<ItemCarrito> nuevos = new ArrayList<>();
        for (ItemCarrito candidato : candidatos.values()) {
            String clave = normalizar(candidato.getNombre());
            if (noVolver.contains(clave) || yaEnCarrito.contains(clave)) {
                continue;
            }
            nuevos.add(itemCarritoRepository.save(candidato));
        }
        return nuevos;
    }

    // -------------------------------------------------------------------------
    // Prioridad ALTA
    // -------------------------------------------------------------------------

    private List<ItemCarrito> candidatosPrioridadAlta(List<Producto> productos, int umbral,
                                                        List<RecetaGuardada> guardadas) {
        List<ItemCarrito> resultado = new ArrayList<>();

        for (Producto p : productos) {
            if (p.getCantidad() <= 0) {
                resultado.add(nuevoItem(p.getNombre(), reposicion(p), p.getUnidad(), p.getCategoria(),
                        "alta", "Tu stock de " + p.getNombre() + " se ha agotado", null));
            } else if (p.getCantidad() <= umbral) {
                resultado.add(nuevoItem(p.getNombre(), reposicion(p), p.getUnidad(), p.getCategoria(),
                        "alta", "Tu stock de " + p.getNombre() + " es bajo", null));
            }
        }

        for (RecetaGuardada guardada : guardadas) {
            Receta receta = recetaRepository.findById(guardada.getRecetaId()).orElse(null);
            if (receta == null) continue;
            List<IngredienteReceta> ingredientes = ingredienteRecetaRepository.findByRecetaId(receta.getId());
            for (IngredienteReceta ingrediente : ingredientes) {
                double ratio = ratioDisponibilidad(ingrediente, productos);
                if (ratio == 0) {
                    resultado.add(nuevoItem(ingrediente.getNombre(), (float) ingrediente.getCantidad(),
                            ingrediente.getUnidad(), null, "alta",
                            "Necesitas " + ingrediente.getNombre() + " para preparar " + receta.getTitulo(),
                            receta.getId()));
                }
            }
        }
        return resultado;
    }

    // -------------------------------------------------------------------------
    // Prioridad MEDIA
    // -------------------------------------------------------------------------

    private List<ItemCarrito> candidatosPrioridadMedia(Despensa despensa, List<Producto> productos, int umbral,
                                                         List<RecetaGuardada> guardadas) {
        List<ItemCarrito> resultado = new ArrayList<>();

        for (Producto p : productos) {
            Integer dias = diasHastaCaducidad(p);
            if (dias != null && dias >= 0 && dias <= DIAS_CADUCA_PRONTO) {
                resultado.add(nuevoItem(p.getNombre(), reposicion(p), p.getUnidad(), p.getCategoria(),
                        "media", "Tu " + p.getNombre() + " caduca pronto, conviene reponerlo antes de que se acabe",
                        null));
            }
        }

        LocalDateTime ahora = LocalDateTime.now();
        List<MovimientoProducto> consumidos = movimientoRepository
                .findByDespensaIdAndTipoAndMotivo(despensa.getId(), "eliminado", "consumido");
        for (MovimientoProducto m : consumidos) {
            long dias = ChronoUnit.DAYS.between(m.getCreatedAt(), ahora);
            if (dias >= 0 && dias <= DIAS_CONSUMIDO_RECIENTE
                    && !enDespensaConStockSuficiente(m.getNombre(), productos, umbral)) {
                resultado.add(nuevoItem(m.getNombre(), 1f, null, null, "media",
                        "Compraste " + m.getNombre() + " hace " + dias
                                + " días, es probable que lo necesites pronto", null));
            }
        }

        for (RecetaGuardada guardada : guardadas) {
            Receta receta = recetaRepository.findById(guardada.getRecetaId()).orElse(null);
            if (receta == null) continue;
            List<IngredienteReceta> ingredientes = ingredienteRecetaRepository.findByRecetaId(receta.getId());
            for (IngredienteReceta ingrediente : ingredientes) {
                double ratio = ratioDisponibilidad(ingrediente, productos);
                if (ratio > 0 && ratio < RATIO_INSUFICIENTE) {
                    resultado.add(nuevoItem(ingrediente.getNombre(), (float) ingrediente.getCantidad(),
                            ingrediente.getUnidad(), null, "media",
                            "Tienes poco " + ingrediente.getNombre() + " para preparar " + receta.getTitulo(),
                            receta.getId()));
                }
            }
        }
        return resultado;
    }

    // -------------------------------------------------------------------------
    // Prioridad BAJA
    // -------------------------------------------------------------------------

    private List<ItemCarrito> candidatosPrioridadBaja(Despensa despensa, List<Producto> productos, int umbral,
                                                        List<RecetaGuardada> guardadas) {
        List<ItemCarrito> resultado = new ArrayList<>();

        LocalDateTime ahora = LocalDateTime.now();
        List<MovimientoProducto> consumidos = movimientoRepository
                .findByDespensaIdAndTipoAndMotivo(despensa.getId(), "eliminado", "consumido");
        for (MovimientoProducto m : consumidos) {
            long dias = ChronoUnit.DAYS.between(m.getCreatedAt(), ahora);
            if (dias > DIAS_CONSUMIDO_RECIENTE && dias <= DIAS_CONSUMIDO_HABITUAL
                    && !enDespensaConStockSuficiente(m.getNombre(), productos, umbral)) {
                resultado.add(nuevoItem(m.getNombre(), 1f, null, null, "baja",
                        "Sueles comprar " + m.getNombre()
                                + " cada cierto tiempo, podrías necesitarlo pronto", null));
            }
        }

        Map<String, List<Producto>> porCategoria = productos.stream()
                .filter(p -> p.getCategoria() != null)
                .collect(Collectors.groupingBy(Producto::getCategoria));
        for (Map.Entry<String, List<Producto>> entry : porCategoria.entrySet()) {
            List<Producto> deLaCategoria = entry.getValue();
            if (deLaCategoria.size() < 2) continue;
            double media = deLaCategoria.stream().mapToDouble(Producto::getCantidad).average().orElse(0);
            if (media <= umbral) {
                Producto masBajo = deLaCategoria.stream()
                        .min((a, b) -> Double.compare(a.getCantidad(), b.getCantidad())).orElseThrow();
                resultado.add(nuevoItem(masBajo.getNombre(), reposicion(masBajo), masBajo.getUnidad(),
                        entry.getKey(), "baja",
                        "Tu categoría " + entry.getKey() + " tiene el stock bajo en general, podrías reponer "
                                + masBajo.getNombre(), null));
            }
        }

        for (RecetaGuardada guardada : guardadas) {
            Receta receta = recetaRepository.findById(guardada.getRecetaId()).orElse(null);
            if (receta == null) continue;
            List<IngredienteReceta> ingredientes = ingredienteRecetaRepository.findByRecetaId(receta.getId());
            if (ingredientes.isEmpty()) continue;

            long cubiertos = ingredientes.stream()
                    .filter(i -> ratioDisponibilidad(i, productos) >= 1).count();
            double completitud = (double) cubiertos / ingredientes.size();
            if (completitud < COMPLETITUD_RECETA_CASI_LISTA) continue;

            for (IngredienteReceta ingrediente : ingredientes) {
                double ratio = ratioDisponibilidad(ingrediente, productos);
                if (ratio >= RATIO_INSUFICIENTE && ratio < 1) {
                    resultado.add(nuevoItem(ingrediente.getNombre(), (float) ingrediente.getCantidad(),
                            ingrediente.getUnidad(), null, "baja",
                            "Te falta poco " + ingrediente.getNombre() + " para completar " + receta.getTitulo()
                                    + ", que ya tienes casi lista", receta.getId()));
                }
            }
        }
        return resultado;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private void añadirCandidato(Map<String, ItemCarrito> candidatos, ItemCarrito candidato) {
        candidatos.putIfAbsent(normalizar(candidato.getNombre()), candidato);
    }

    private ItemCarrito nuevoItem(String nombre, Float cantidad, String unidad, String categoria,
                                   String prioridad, String motivo, String recetaId) {
        return ItemCarrito.builder()
                .nombre(nombre)
                .cantidad(cantidad)
                .unidad(unidad)
                .categoria(categoria)
                .prioridad(prioridad)
                .motivo(motivo)
                .recetaId(recetaId)
                .build();
    }

    private Float reposicion(Producto p) {
        return p.getStockMinimo() != null ? Math.max(1f, p.getStockMinimo()) : 1f;
    }

    private double ratioDisponibilidad(IngredienteReceta ingrediente, List<Producto> productos) {
        double disponible = productos.stream()
                .filter(p -> normalizar(p.getNombre()).equals(normalizar(ingrediente.getNombre())))
                .mapToDouble(Producto::getCantidad)
                .sum();
        if (ingrediente.getCantidad() <= 0) return disponible > 0 ? 1 : 0;
        return disponible / ingrediente.getCantidad();
    }

    private boolean enDespensaConStockSuficiente(String nombre, List<Producto> productos, int umbral) {
        return productos.stream()
                .anyMatch(p -> normalizar(p.getNombre()).equals(normalizar(nombre)) && p.getCantidad() > umbral);
    }

    private Integer diasHastaCaducidad(Producto p) {
        if (p.getFechaCaducidad() == null) return null;
        return (int) ChronoUnit.DAYS.between(LocalDate.now(), p.getFechaCaducidad());
    }

    private int obtenerGlobalUmbral(String usuarioId) {
        return preferenciasRepository.findByUsuarioId(usuarioId)
                .map(Preferencias::getStockMinimoGlobal)
                .filter(v -> v != null)
                .orElse(1);
    }

    private String normalizar(String texto) {
        return texto == null ? "" : texto.trim().toLowerCase(Locale.ROOT);
    }
}
