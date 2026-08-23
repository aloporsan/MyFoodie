package com.myfoodie.application.service;

import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import com.myfoodie.domain.model.Despensa;
import com.myfoodie.domain.model.FusionIgnorada;
import com.myfoodie.domain.model.MovimientoProducto;
import com.myfoodie.domain.model.Preferencias;
import com.myfoodie.domain.model.Producto;
import com.myfoodie.domain.repository.DespensaRepository;
import com.myfoodie.domain.repository.FusionIgnoradaRepository;
import com.myfoodie.domain.repository.MovimientoProductoRepository;
import com.myfoodie.domain.repository.PreferenciasRepository;
import com.myfoodie.domain.repository.ProductoRepository;
import com.myfoodie.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class FusionService {

    private final DespensaRepository despensaRepository;
    private final ProductoRepository productoRepository;
    private final PreferenciasRepository preferenciasRepository;
    private final MovimientoProductoRepository movimientoRepository;
    private final FusionIgnoradaRepository fusionIgnoradaRepository;
    private final MatchingService matchingService;

    public ProductoResponseDTO fusionarProductos(String usuarioId, String productoMantenerId,
                                                  String productoEliminarId) {
        if (productoMantenerId.equals(productoEliminarId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No se puede fusionar un producto consigo mismo");
        }

        Despensa despensa = getDespensaDeUsuario(usuarioId);
        Producto mantener = getProductoValidado(despensa, productoMantenerId);
        Producto eliminar = getProductoValidado(despensa, productoEliminarId);

        double cantidadAnterior = mantener.getCantidad();
        mantener.setCantidad(mantener.getCantidad() + eliminar.getCantidad());
        mantener.setFechaCaducidad(fechaMasProxima(mantener.getFechaCaducidad(), eliminar.getFechaCaducidad()));
        mantener.setStockMinimo(stockMinimoMasAlto(mantener.getStockMinimo(), eliminar.getStockMinimo()));
        mantener.setUpdatedAt(LocalDateTime.now());

        Producto guardado = productoRepository.save(mantener);

        movimientoRepository.save(MovimientoProducto.builder()
                .productoId(guardado.getId())
                .despensaId(guardado.getDespensaId())
                .usuarioId(usuarioId)
                .nombre(guardado.getNombre())
                .tipo("fusionado")
                .descripcion("Fusionado con: " + eliminar.getNombre())
                .cantidadAnterior(cantidadAnterior)
                .cantidadNueva(guardado.getCantidad())
                .build());

        productoRepository.delete(eliminar);

        int globalUmbral = obtenerGlobalUmbral(usuarioId);
        return toProductoResponseDTO(guardado, resolverUmbral(guardado, globalUmbral));
    }

    public void ignorarSugerenciaFusion(String usuarioId, String productoAId, String productoBId) {
        Despensa despensa = getDespensaDeUsuario(usuarioId);
        Producto a = getProductoValidado(despensa, productoAId);
        Producto b = getProductoValidado(despensa, productoBId);

        fusionIgnoradaRepository.save(FusionIgnorada.builder()
                .usuarioId(usuarioId)
                .productoANombre(matchingService.normalizar(a.getNombre()))
                .productoBNombre(matchingService.normalizar(b.getNombre()))
                .build());
    }

    private LocalDate fechaMasProxima(LocalDate a, LocalDate b) {
        if (a == null) return b;
        if (b == null) return a;
        return a.isBefore(b) ? a : b;
    }

    private Integer stockMinimoMasAlto(Integer a, Integer b) {
        if (a == null) return b;
        if (b == null) return a;
        return Math.max(a, b);
    }

    private Despensa getDespensaDeUsuario(String usuarioId) {
        return despensaRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Despensa no encontrada"));
    }

    private Producto getProductoValidado(Despensa despensaUsuario, String productoId) {
        Producto p = productoRepository.findById(productoId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Producto no encontrado"));
        if (!p.getDespensaId().equals(despensaUsuario.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "El producto no pertenece al usuario");
        }
        return p;
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
                calcularEstado(p, umbralEfectivo),
                calcularDiasHastaCaducidad(p),
                null,
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
