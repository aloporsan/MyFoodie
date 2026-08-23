package com.myfoodie.application.service;

import com.myfoodie.application.dto.matching.MatchProductoDTO;
import com.myfoodie.application.dto.matching.ParDuplicadoDTO;
import com.myfoodie.application.dto.matching.SimilitudResultDTO;
import com.myfoodie.domain.model.Despensa;
import com.myfoodie.domain.model.FusionIgnorada;
import com.myfoodie.domain.model.Producto;
import com.myfoodie.domain.model.TipoMatch;
import com.myfoodie.domain.repository.DespensaRepository;
import com.myfoodie.domain.repository.FusionIgnoradaRepository;
import com.myfoodie.domain.repository.PreferenciasRepository;
import com.myfoodie.domain.repository.ProductoRepository;
import com.myfoodie.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("MatchingService — normalización, sinónimos, Jaro-Winkler y detección de duplicados (RF-DESP-021/022)")
class MatchingServiceTest {

    @Mock private DespensaRepository despensaRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private PreferenciasRepository preferenciasRepository;
    @Mock private FusionIgnoradaRepository fusionIgnoradaRepository;

    @InjectMocks private MatchingService matchingService;

    @BeforeEach
    void configurarPreferenciasPorDefecto() {
        lenient().when(preferenciasRepository.findByUsuarioId("usuario-1")).thenReturn(Optional.empty());
    }

    private Producto producto(String id, String nombre) {
        return Producto.builder().id(id).despensaId("despensa-1").nombre(nombre).cantidad(1).unidad("unidad").build();
    }

    // -------------------------------------------------------------------------
    // normalizar
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("normalizar quita acentos, mayúsculas y dígitos")
    void normalizar_quita_acentos_mayusculas_y_digitos() {
        assertThat(matchingService.normalizar("Aceitunas Gordales 200g")).isEqualTo("aceitunas gordales");
        assertThat(matchingService.normalizar("Limón")).isEqualTo("limon");
    }

    @Test
    @DisplayName("normalizar elimina artículos y unidades sueltas")
    void normalizar_elimina_articulos_y_unidades() {
        assertThat(matchingService.normalizar("el tomate")).isEqualTo("tomate");
        assertThat(matchingService.normalizar("2 kg de arroz")).isEqualTo("de arroz");
    }

    @Test
    @DisplayName("normalizar colapsa espacios múltiples y recorta bordes")
    void normalizar_colapsa_espacios() {
        assertThat(matchingService.normalizar("  leche   entera  ")).isEqualTo("leche entera");
    }

    @Test
    @DisplayName("normalizar de texto null devuelve cadena vacía")
    void normalizar_null_devuelve_vacio() {
        assertThat(matchingService.normalizar(null)).isEqualTo("");
    }

    // -------------------------------------------------------------------------
    // aplicarSinonimos
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("aplicarSinonimos mapea variantes conocidas a su forma canónica")
    void aplicarSinonimos_mapea_variantes_conocidas() {
        assertThat(matchingService.aplicarSinonimos("leche entera")).isEqualTo("leche");
        assertThat(matchingService.aplicarSinonimos("tomate frito")).isEqualTo("tomate");
        assertThat(matchingService.aplicarSinonimos("aceite de oliva")).isEqualTo("aceite");
    }

    @Test
    @DisplayName("aplicarSinonimos deja intacto un texto sin sinónimo conocido")
    void aplicarSinonimos_sin_sinonimo_devuelve_tal_cual() {
        assertThat(matchingService.aplicarSinonimos("aceitunas gordales")).isEqualTo("aceitunas gordales");
    }

    // -------------------------------------------------------------------------
    // calcularSimilitudJaroWinkler
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("calcularSimilitudJaroWinkler de cadenas idénticas es 1.0")
    void similitud_cadenas_identicas_es_uno() {
        assertThat(matchingService.calcularSimilitudJaroWinkler("tomate", "tomate")).isEqualTo(1.0);
    }

    @Test
    @DisplayName("calcularSimilitudJaroWinkler de cadenas vacías es 0.0")
    void similitud_cadenas_vacias_es_cero() {
        assertThat(matchingService.calcularSimilitudJaroWinkler("", "")).isEqualTo(0.0);
    }

    @Test
    @DisplayName("calcularSimilitudJaroWinkler de cadenas totalmente distintas es baja")
    void similitud_cadenas_distintas_es_baja() {
        assertThat(matchingService.calcularSimilitudJaroWinkler("aceite", "zanahoria")).isLessThan(0.5);
    }

    @Test
    @DisplayName("calcularSimilitudJaroWinkler premia el prefijo común (bonus Winkler)")
    void similitud_premia_prefijo_comun() {
        // "aceitunas" vs "aceituna" comparten prefijo largo -> similitud muy alta
        double similitud = matchingService.calcularSimilitudJaroWinkler("aceitunas", "aceituna");
        assertThat(similitud).isGreaterThan(0.9);
    }

    // -------------------------------------------------------------------------
    // calcularSimilitud
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("calcularSimilitud detecta que dos variantes de leche son el mismo producto vía sinónimo")
    void calcularSimilitud_detecta_sinonimo_de_leche() {
        SimilitudResultDTO resultado = matchingService.calcularSimilitud("Leche Entera", "Leche Desnatada");

        assertThat(resultado.fueronSinonimos()).isTrue();
        assertThat(resultado.puntuacion()).isEqualTo(1.0);
    }

    @Test
    @DisplayName("calcularSimilitud entre nombres iguales normalizados no marca sinónimos")
    void calcularSimilitud_nombres_iguales_no_marca_sinonimos() {
        SimilitudResultDTO resultado = matchingService.calcularSimilitud("Tomate", "tomate");

        assertThat(resultado.fueronSinonimos()).isFalse();
        assertThat(resultado.puntuacion()).isEqualTo(1.0);
    }

    // -------------------------------------------------------------------------
    // clasificarMatch
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("clasificarMatch devuelve AUTOMATICO desde 0.85")
    void clasificarMatch_automatico_desde_0_85() {
        assertThat(matchingService.clasificarMatch(0.85)).isEqualTo(TipoMatch.AUTOMATICO);
        assertThat(matchingService.clasificarMatch(0.99)).isEqualTo(TipoMatch.AUTOMATICO);
    }

    @Test
    @DisplayName("clasificarMatch devuelve PROPONER entre 0.60 y 0.85")
    void clasificarMatch_proponer_entre_0_60_y_0_85() {
        assertThat(matchingService.clasificarMatch(0.60)).isEqualTo(TipoMatch.PROPONER);
        assertThat(matchingService.clasificarMatch(0.84)).isEqualTo(TipoMatch.PROPONER);
    }

    @Test
    @DisplayName("clasificarMatch devuelve NUEVO por debajo de 0.60")
    void clasificarMatch_nuevo_por_debajo_de_0_60() {
        assertThat(matchingService.clasificarMatch(0.59)).isEqualTo(TipoMatch.NUEVO);
        assertThat(matchingService.clasificarMatch(0.0)).isEqualTo(TipoMatch.NUEVO);
    }

    // -------------------------------------------------------------------------
    // buscarProductoSimilarEnDespensa (RF-DESP-021)
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("buscarProductoSimilarEnDespensa solo devuelve productos por encima del umbral de proponer")
    void buscarProductoSimilar_filtra_por_umbral_de_proponer() {
        Despensa despensa = Despensa.builder().id("despensa-1").usuarioId("usuario-1").build();
        when(despensaRepository.findByUsuarioId("usuario-1")).thenReturn(Optional.of(despensa));
        when(productoRepository.findByDespensaId("despensa-1")).thenReturn(List.of(
                producto("p1", "Aceitunas Gordales"),
                producto("p2", "Kiwi")
        ));

        List<MatchProductoDTO> resultado = matchingService.buscarProductoSimilarEnDespensa("usuario-1", "aceitunas gordales");

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).producto().nombre()).isEqualTo("Aceitunas Gordales");
        assertThat(resultado.get(0).tipoMatch()).isEqualTo(TipoMatch.AUTOMATICO);
    }

    @Test
    @DisplayName("buscarProductoSimilarEnDespensa ordena los resultados de mayor a menor similitud")
    void buscarProductoSimilar_ordena_por_similitud_descendente() {
        Despensa despensa = Despensa.builder().id("despensa-1").usuarioId("usuario-1").build();
        when(despensaRepository.findByUsuarioId("usuario-1")).thenReturn(Optional.of(despensa));
        when(productoRepository.findByDespensaId("despensa-1")).thenReturn(List.of(
                producto("p1", "Tomate frito"),
                producto("p2", "Tomate triturado"),
                producto("p3", "Tomate")
        ));

        List<MatchProductoDTO> resultado = matchingService.buscarProductoSimilarEnDespensa("usuario-1", "Tomate");

        assertThat(resultado).hasSize(3);
        assertThat(resultado.get(0).similitud()).isGreaterThanOrEqualTo(resultado.get(1).similitud());
        assertThat(resultado.get(1).similitud()).isGreaterThanOrEqualTo(resultado.get(2).similitud());
    }

    @Test
    @DisplayName("buscarProductoSimilarEnDespensa lanza 404 si el usuario no tiene despensa")
    void buscarProductoSimilar_lanza_404_sin_despensa() {
        when(despensaRepository.findByUsuarioId("usuario-1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> matchingService.buscarProductoSimilarEnDespensa("usuario-1", "tomate"))
                .isInstanceOf(ApiException.class);
    }

    // -------------------------------------------------------------------------
    // buscarDuplicadosEnDespensa (RF-DESP-022)
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("buscarDuplicadosEnDespensa detecta pares con similitud por encima del umbral de duplicado")
    void buscarDuplicados_detecta_pares_similares() {
        Despensa despensa = Despensa.builder().id("despensa-1").usuarioId("usuario-1").build();
        when(despensaRepository.findByUsuarioId("usuario-1")).thenReturn(Optional.of(despensa));
        when(productoRepository.findByDespensaId("despensa-1")).thenReturn(List.of(
                producto("p1", "Aceitunas Gordales"),
                producto("p2", "Aceitunas Gordale"),
                producto("p3", "Zanahoria")
        ));
        when(fusionIgnoradaRepository.findByUsuarioId("usuario-1")).thenReturn(List.of());

        List<ParDuplicadoDTO> resultado = matchingService.buscarDuplicadosEnDespensa("usuario-1");

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).productoA().nombre()).isEqualTo("Aceitunas Gordales");
        assertThat(resultado.get(0).productoB().nombre()).isEqualTo("Aceitunas Gordale");
    }

    @Test
    @DisplayName("buscarDuplicadosEnDespensa excluye pares que el usuario ya ignoró")
    void buscarDuplicados_excluye_pares_ignorados() {
        Despensa despensa = Despensa.builder().id("despensa-1").usuarioId("usuario-1").build();
        when(despensaRepository.findByUsuarioId("usuario-1")).thenReturn(Optional.of(despensa));
        when(productoRepository.findByDespensaId("despensa-1")).thenReturn(List.of(
                producto("p1", "Aceitunas Gordales"),
                producto("p2", "Aceitunas Gordale")
        ));
        when(fusionIgnoradaRepository.findByUsuarioId("usuario-1")).thenReturn(List.of(
                FusionIgnorada.builder()
                        .usuarioId("usuario-1")
                        .productoANombre(matchingService.normalizar("Aceitunas Gordales"))
                        .productoBNombre(matchingService.normalizar("Aceitunas Gordale"))
                        .build()
        ));

        List<ParDuplicadoDTO> resultado = matchingService.buscarDuplicadosEnDespensa("usuario-1");

        assertThat(resultado).isEmpty();
    }

    @Test
    @DisplayName("buscarDuplicadosEnDespensa no reporta productos claramente distintos")
    void buscarDuplicados_no_reporta_productos_distintos() {
        Despensa despensa = Despensa.builder().id("despensa-1").usuarioId("usuario-1").build();
        when(despensaRepository.findByUsuarioId("usuario-1")).thenReturn(Optional.of(despensa));
        when(productoRepository.findByDespensaId("despensa-1")).thenReturn(List.of(
                producto("p1", "Leche"),
                producto("p2", "Zanahoria")
        ));
        when(fusionIgnoradaRepository.findByUsuarioId("usuario-1")).thenReturn(List.of());

        List<ParDuplicadoDTO> resultado = matchingService.buscarDuplicadosEnDespensa("usuario-1");

        assertThat(resultado).isEmpty();
    }
}
