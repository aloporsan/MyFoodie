package com.myfoodie.application.service;

import com.myfoodie.application.dto.dashboard.AlertaCaducidadDTO;
import com.myfoodie.application.dto.dashboard.DashboardResumenDTO;
import com.myfoodie.application.dto.dashboard.EstadisticasDTO;
import com.myfoodie.application.dto.dashboard.ProductoPrioritarioDTO;
import com.myfoodie.application.dto.despensa.ProductoResponseDTO;
import com.myfoodie.exception.ApiException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("DashboardService — resumen, alertas, prioritarios y estadísticas")
class DashboardServiceTest {

    @Mock  private DespensaService despensaService;
    @InjectMocks private DashboardService dashboardService;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private ProductoResponseDTO dto(String id, String estado, String categoria,
                                    LocalDate fechaCaducidad, double cantidad) {
        return dto(id, estado, categoria, fechaCaducidad, cantidad, LocalDateTime.now());
    }

    private ProductoResponseDTO dto(String id, String estado, String categoria,
                                    LocalDate fechaCaducidad, double cantidad,
                                    LocalDateTime createdAt) {
        return new ProductoResponseDTO(id, "desp-1", "Producto " + id, cantidad, "unidades",
                categoria, fechaCaducidad, null, null, null,
                null, false,
                estado, null, createdAt, createdAt);
    }

    // -------------------------------------------------------------------------
    // obtenerResumenDespensa
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Resumen devuelve contadores correctos con datos reales")
    void obtenerResumenDespensa_devuelve_contadores_correctos() {
        when(despensaService.listarProductos("u1")).thenReturn(List.of(
                dto("1", "normal",         null, null,                            3),
                dto("2", "caducado",       null, LocalDate.now().minusDays(1),    1),
                dto("3", "proximoCaducar", null, LocalDate.now().plusDays(1),     2),
                dto("4", "bajoStock",      null, null,                            1),
                dto("5", "normal",         null, null,                            5)
        ));

        DashboardResumenDTO.ResumenDespensa r = dashboardService.obtenerResumenDespensa("u1");

        assertThat(r.totalProductos()).isEqualTo(5);
        assertThat(r.proximosCaducar()).isEqualTo(1);
        assertThat(r.caducados()).isEqualTo(1);
        assertThat(r.bajoStock()).isEqualTo(1);
    }

    @Test
    @DisplayName("Resumen devuelve todos los contadores a 0 si la despensa está vacía")
    void obtenerResumenDespensa_devuelve_ceros_si_despensa_vacia() {
        when(despensaService.listarProductos("u1")).thenReturn(List.of());

        DashboardResumenDTO.ResumenDespensa r = dashboardService.obtenerResumenDespensa("u1");

        assertThat(r.totalProductos()).isZero();
        assertThat(r.proximosCaducar()).isZero();
        assertThat(r.caducados()).isZero();
        assertThat(r.bajoStock()).isZero();
    }

    @Test
    @DisplayName("Resumen falla con 404 si el usuario no tiene despensa")
    void obtenerResumenDespensa_falla_si_usuario_no_tiene_despensa() {
        when(despensaService.listarProductos("sin-despensa"))
                .thenThrow(new ApiException(HttpStatus.NOT_FOUND, "Despensa no encontrada"));

        assertThatThrownBy(() -> dashboardService.obtenerResumenDespensa("sin-despensa"))
                .isInstanceOf(ApiException.class)
                .hasMessage("Despensa no encontrada")
                .satisfies(ex -> assertThat(((ApiException) ex).getStatus())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }

    // -------------------------------------------------------------------------
    // obtenerAlertasCaducidad
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Alertas devuelve lista ordenada: caducados primero, luego próximos")
    void obtenerAlertasCaducidad_devuelve_lista_ordenada_por_urgencia() {
        when(despensaService.listarProductos("u1")).thenReturn(List.of(
                dto("1", "proximoCaducar", null, LocalDate.now().plusDays(2), 2),
                dto("2", "caducado",       null, LocalDate.now().minusDays(1), 1),
                dto("3", "normal",         null, null, 4)
        ));

        List<AlertaCaducidadDTO> alertas = dashboardService.obtenerAlertasCaducidad("u1");

        assertThat(alertas).hasSize(2);
        assertThat(alertas.get(0).estado()).isEqualTo("caducado");
        assertThat(alertas.get(1).estado()).isEqualTo("proximoCaducar");
    }

    @Test
    @DisplayName("Alertas devuelve lista vacía si no hay productos en estado crítico")
    void obtenerAlertasCaducidad_devuelve_lista_vacia_si_no_hay_criticos() {
        when(despensaService.listarProductos("u1")).thenReturn(List.of(
                dto("1", "normal",   null, null, 3),
                dto("2", "bajoStock", null, null, 1)
        ));

        assertThat(dashboardService.obtenerAlertasCaducidad("u1")).isEmpty();
    }

    // -------------------------------------------------------------------------
    // obtenerProductosPrioritarios
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Prioritarios devuelve máximo 5 productos aunque haya más")
    void obtenerProductosPrioritarios_devuelve_maximo_cinco() {
        List<ProductoResponseDTO> muchos = List.of(
                dto("1", "caducado", null, LocalDate.now().minusDays(1), 1),
                dto("2", "caducado", null, LocalDate.now().minusDays(2), 1),
                dto("3", "caducado", null, LocalDate.now().minusDays(3), 1),
                dto("4", "bajoStock", null, null, 1),
                dto("5", "bajoStock", null, null, 1),
                dto("6", "bajoStock", null, null, 1)
        );
        when(despensaService.listarProductos("u1")).thenReturn(muchos);

        assertThat(dashboardService.obtenerProductosPrioritarios("u1")).hasSize(5);
    }

    @Test
    @DisplayName("Prioritarios pone caducados antes que próximos")
    void obtenerProductosPrioritarios_respeta_orden_caducado_primero() {
        when(despensaService.listarProductos("u1")).thenReturn(List.of(
                dto("1", "proximoCaducar", null, LocalDate.now().plusDays(1), 2),
                dto("2", "caducado",       null, LocalDate.now().minusDays(1), 1)
        ));

        List<ProductoPrioritarioDTO> lista = dashboardService.obtenerProductosPrioritarios("u1");

        assertThat(lista.get(0).estado()).isEqualTo("caducado");
        assertThat(lista.get(1).estado()).isEqualTo("proximoCaducar");
    }

    @Test
    @DisplayName("Prioritarios devuelve lista vacía sin error si no hay productos críticos ni recientes")
    void obtenerProductosPrioritarios_devuelve_vacio_si_no_hay_criticos() {
        // createdAt hace 30 días → no es reciente, y estado normal → no es crítico
        when(despensaService.listarProductos("u1")).thenReturn(List.of(
                dto("1", "normal", null, null, 5, LocalDateTime.now().minusDays(30))
        ));

        assertThat(dashboardService.obtenerProductosPrioritarios("u1")).isEmpty();
    }

    // -------------------------------------------------------------------------
    // obtenerEstadisticas
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Estadísticas calcula aprovechamiento correctamente: 2 caducados de 10 → 80%")
    void obtenerEstadisticas_calcula_aprovechamiento_correctamente() {
        List<ProductoResponseDTO> productos = List.of(
                dto("1", "normal",   "Lácteos", null, 3),
                dto("2", "normal",   "Lácteos", null, 2),
                dto("3", "normal",   "Carnes",  null, 4),
                dto("4", "normal",   "Carnes",  null, 3),
                dto("5", "normal",   "Cereales", null, 2),
                dto("6", "normal",   "Cereales", null, 1),
                dto("7", "bajoStock","Bebidas",  null, 1),
                dto("8", "proximoCaducar","Bebidas", LocalDate.now().plusDays(1), 2),
                dto("9", "caducado", "Conservas", LocalDate.now().minusDays(1), 1),
                dto("10","caducado", "Conservas", LocalDate.now().minusDays(2), 1)
        );
        when(despensaService.listarProductos("u1")).thenReturn(productos);

        EstadisticasDTO stats = dashboardService.obtenerEstadisticas("u1");

        assertThat(stats.aprovechamiento()).isEqualTo(80.0);
    }

    @Test
    @DisplayName("Estadísticas devuelve la categoría con más productos")
    void obtenerEstadisticas_devuelve_categoria_con_mas_productos() {
        when(despensaService.listarProductos("u1")).thenReturn(List.of(
                dto("1", "normal", "Lácteos",  null, 2),
                dto("2", "normal", "Lácteos",  null, 3),
                dto("3", "normal", "Lácteos",  null, 1),
                dto("4", "normal", "Carnes",   null, 2),
                dto("5", "normal", "Cereales", null, 1)
        ));

        assertThat(dashboardService.obtenerEstadisticas("u1").categoriaLider())
                .isEqualTo("Lácteos");
    }

    @Test
    @DisplayName("Estadísticas devuelve aprovechamiento 100 para despensa vacía (sin dividir por cero)")
    void obtenerEstadisticas_aprovechamiento_es_100_si_despensa_vacia() {
        when(despensaService.listarProductos("u1")).thenReturn(List.of());

        assertThat(dashboardService.obtenerEstadisticas("u1").aprovechamiento())
                .isEqualTo(100.0);
    }

    // -------------------------------------------------------------------------
    // Placeholders
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Carrito placeholder devuelve disponible=false")
    void obtenerResumenCarrito_devuelve_placeholder_con_disponible_false() {
        assertThat(dashboardService.obtenerResumenCarrito("u1").disponible()).isFalse();
    }

    @Test
    @DisplayName("Recetas placeholder devuelve disponible=false")
    void obtenerRecetasRecomendadas_devuelve_placeholder_con_disponible_false() {
        assertThat(dashboardService.obtenerRecetasRecomendadas("u1").disponible()).isFalse();
    }
}
