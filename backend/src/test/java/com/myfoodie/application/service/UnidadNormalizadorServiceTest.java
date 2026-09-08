package com.myfoodie.application.service;

import com.myfoodie.application.dto.unidad.UnidadConvertidaDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("UnidadNormalizadorService — conversión de unidades subjetivas")
class UnidadNormalizadorServiceTest {

    private final UnidadNormalizadorService service = new UnidadNormalizadorService();

    // -------------------------------------------------------------------------
    // convertirAMetrica / normalizarUnidades
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("convierte_cucharada_a_15_ml")
    void convierte_cucharada_a_15_ml() {
        UnidadConvertidaDTO resultado = service.normalizarUnidades(2, "cucharada");

        assertThat(resultado.cantidadConvertida()).isEqualTo(30.0);
        assertThat(resultado.unidadConvertida()).isEqualTo("ml");
        assertThat(resultado.fueConvertida()).isTrue();
    }

    @Test
    @DisplayName("convierte_cucharadita_a_5_ml")
    void convierte_cucharadita_a_5_ml() {
        UnidadConvertidaDTO resultado = service.normalizarUnidades(1, "cucharadita");

        assertThat(resultado.cantidadConvertida()).isEqualTo(5.0);
        assertThat(resultado.unidadConvertida()).isEqualTo("ml");
        assertThat(resultado.fueConvertida()).isTrue();
    }

    @Test
    @DisplayName("convierte_taza_a_250_ml")
    void convierte_taza_a_250_ml() {
        UnidadConvertidaDTO resultado = service.normalizarUnidades(1, "taza");

        assertThat(resultado.cantidadConvertida()).isEqualTo(250.0);
        assertThat(resultado.unidadConvertida()).isEqualTo("ml");
        assertThat(resultado.fueConvertida()).isTrue();
    }

    @Test
    @DisplayName("convierte_pizca_a_0_5_g")
    void convierte_pizca_a_0_5_g() {
        UnidadConvertidaDTO resultado = service.normalizarUnidades(1, "pizca");

        assertThat(resultado.cantidadConvertida()).isEqualTo(0.5);
        assertThat(resultado.unidadConvertida()).isEqualTo("g");
        assertThat(resultado.fueConvertida()).isTrue();
    }

    @Test
    @DisplayName("convierte_kilo_a_1000_g")
    void convierte_kilo_a_1000_g() {
        UnidadConvertidaDTO resultado = service.normalizarUnidades(1, "kilo");

        assertThat(resultado.cantidadConvertida()).isEqualTo(1000.0);
        assertThat(resultado.unidadConvertida()).isEqualTo("g");
        assertThat(resultado.fueConvertida()).isTrue();
    }

    @Test
    @DisplayName("no_convierte_unidades_ya_objetivas")
    void no_convierte_unidades_ya_objetivas() {
        for (String unidad : new String[] {"ml", "g", "l", "kg", "oz", "lb", "unidad", "unidades", "ud", "uds"}) {
            UnidadConvertidaDTO resultado = service.normalizarUnidades(3, unidad);

            assertThat(resultado.fueConvertida()).as("unidad: " + unidad).isFalse();
            assertThat(resultado.cantidadConvertida()).as("unidad: " + unidad).isEqualTo(3.0);
            assertThat(resultado.unidadConvertida()).as("unidad: " + unidad).isEqualTo(unidad);
        }
    }

    @Test
    @DisplayName("detecta_correctamente_unidades_subjetivas")
    void detecta_correctamente_unidades_subjetivas() {
        for (String subjetiva : new String[] {"cucharada", "cucharadita", "taza", "vaso", "pizca", "kilo"}) {
            assertThat(service.esUnidadSubjetiva(subjetiva)).as("subjetiva: " + subjetiva).isTrue();
        }
        for (String objetiva : new String[] {"ml", "g", "kg", "l", "unidad"}) {
            assertThat(service.esUnidadSubjetiva(objetiva)).as("objetiva: " + objetiva).isFalse();
        }
    }

    @Test
    @DisplayName("esUnidadSubjetiva es insensible a mayúsculas y espacios")
    void esUnidadSubjetiva_ignora_mayusculas_y_espacios() {
        assertThat(service.esUnidadSubjetiva(" Taza ")).isTrue();
        assertThat(service.esUnidadSubjetiva("CUCHARADA")).isTrue();
    }

    @Test
    @DisplayName("normalizarUnidades devuelve la cantidad y unidad tal cual cuando ya es objetiva")
    void normalizarUnidades_devuelveTalCual_siEsObjetiva() {
        UnidadConvertidaDTO resultado = service.normalizarUnidades(500, "ml");

        assertThat(resultado.cantidadConvertida()).isEqualTo(500.0);
        assertThat(resultado.unidadConvertida()).isEqualTo("ml");
        assertThat(resultado.fueConvertida()).isFalse();
    }

    // -------------------------------------------------------------------------
    // convertirAUnidadDeCompra — RF-DESP-019, lista de la compra eficiente
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("convertirAUnidadDeCompra convierte 3 tazas de leche a 0.75 L, no a 750 ml")
    void convertirAUnidadDeCompra_tazas_a_litros() {
        UnidadConvertidaDTO resultado = service.convertirAUnidadDeCompra(3, "taza");

        assertThat(resultado.cantidadConvertida()).isEqualTo(0.75);
        assertThat(resultado.unidadConvertida()).isEqualTo("l");
        assertThat(resultado.fueConvertida()).isTrue();
    }

    @Test
    @DisplayName("convertirAUnidadDeCompra convierte 2 kilos (unidad subjetiva en palabra) a 2 kg")
    void convertirAUnidadDeCompra_kilo_a_kg() {
        UnidadConvertidaDTO resultado = service.convertirAUnidadDeCompra(2, "kilo");

        assertThat(resultado.cantidadConvertida()).isEqualTo(2.0);
        assertThat(resultado.unidadConvertida()).isEqualTo("kg");
        assertThat(resultado.fueConvertida()).isTrue();
    }

    @Test
    @DisplayName("convertirAUnidadDeCompra redondea a 2 decimales cantidades muy pequeñas (ej. pizcas)")
    void convertirAUnidadDeCompra_redondeaCantidadesPequeñas() {
        UnidadConvertidaDTO resultado = service.convertirAUnidadDeCompra(4, "pizca");

        // 4 pizcas = 2 g = 0.002 kg, redondeado a 2 decimales
        assertThat(resultado.cantidadConvertida()).isEqualTo(0.0);
        assertThat(resultado.unidadConvertida()).isEqualTo("kg");
        assertThat(resultado.fueConvertida()).isTrue();
    }

    @Test
    @DisplayName("convertirAUnidadDeCompra no altera unidades ya objetivas")
    void convertirAUnidadDeCompra_noAltera_unidadesObjetivas() {
        UnidadConvertidaDTO resultado = service.convertirAUnidadDeCompra(2, "kg");

        assertThat(resultado.cantidadConvertida()).isEqualTo(2.0);
        assertThat(resultado.unidadConvertida()).isEqualTo("kg");
        assertThat(resultado.fueConvertida()).isFalse();
    }

    // -------------------------------------------------------------------------
    // convertirCantidad — RF-DESP-022, fusión de duplicados con unidades distintas
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("convertirCantidad convierte litros a mililitros dentro de la familia de volumen")
    void convertirCantidad_litros_a_mililitros() {
        Optional<Double> resultado = service.convertirCantidad(2, "l", "ml");

        assertThat(resultado).contains(2000.0);
    }

    @Test
    @DisplayName("convertirCantidad convierte mililitros a litros dentro de la familia de volumen")
    void convertirCantidad_mililitros_a_litros() {
        Optional<Double> resultado = service.convertirCantidad(500, "ml", "l");

        assertThat(resultado).contains(0.5);
    }

    @Test
    @DisplayName("convertirCantidad convierte kilos a gramos dentro de la familia de peso")
    void convertirCantidad_kilos_a_gramos() {
        Optional<Double> resultado = service.convertirCantidad(1.5, "kg", "g");

        assertThat(resultado).contains(1500.0);
    }

    @Test
    @DisplayName("convertirCantidad convierte onzas y libras a gramos")
    void convertirCantidad_onzas_y_libras_a_gramos() {
        assertThat(service.convertirCantidad(1, "oz", "g")).contains(28.35);
        assertThat(service.convertirCantidad(1, "lb", "g")).contains(453.59);
    }

    @Test
    @DisplayName("convertirCantidad devuelve la misma cantidad si origen y destino son iguales")
    void convertirCantidad_misma_unidad_devuelve_igual() {
        assertThat(service.convertirCantidad(3, "kg", "kg")).contains(3.0);
    }

    @Test
    @DisplayName("convertirCantidad es insensible a mayúsculas y espacios en las unidades")
    void convertirCantidad_ignora_mayusculas_y_espacios() {
        assertThat(service.convertirCantidad(2, " L ", "ML")).contains(2000.0);
    }

    @Test
    @DisplayName("convertirCantidad devuelve empty si las unidades pertenecen a familias distintas")
    void convertirCantidad_familias_distintas_devuelve_empty() {
        assertThat(service.convertirCantidad(1, "l", "kg")).isEmpty();
    }

    @Test
    @DisplayName("convertirCantidad devuelve empty para unidades no objetivas como 'unidad'")
    void convertirCantidad_unidad_no_convertible_devuelve_empty() {
        assertThat(service.convertirCantidad(3, "unidad", "kg")).isEmpty();
    }

    // -------------------------------------------------------------------------
    // familia / cantidadComparable (C7 — comparar unidades por familia)
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("familia clasifica peso, volumen, conteo y desconocida")
    void familia_clasifica_unidades() {
        assertThat(service.familia("kg")).isEqualTo(UnidadNormalizadorService.FamiliaUnidad.PESO);
        assertThat(service.familia("gr")).isEqualTo(UnidadNormalizadorService.FamiliaUnidad.PESO);
        assertThat(service.familia("ML")).isEqualTo(UnidadNormalizadorService.FamiliaUnidad.VOLUMEN);
        assertThat(service.familia("dientes")).isEqualTo(UnidadNormalizadorService.FamiliaUnidad.CONTEO);
        assertThat(service.familia("")).isEqualTo(UnidadNormalizadorService.FamiliaUnidad.CONTEO);
        assertThat(service.familia(null)).isEqualTo(UnidadNormalizadorService.FamiliaUnidad.CONTEO);
        assertThat(service.familia("chorro")).isEqualTo(UnidadNormalizadorService.FamiliaUnidad.DESCONOCIDA);
    }

    @Test
    @DisplayName("cantidadComparable convierte el valor dentro de la familia de peso")
    void cantidadComparable_convierte_peso() {
        assertThat(service.cantidadComparable(1, "kg", "g")).contains(1000.0);
        assertThat(service.cantidadComparable(500, "g", "kg")).contains(0.5);
    }

    @Test
    @DisplayName("cantidadComparable en la familia de conteo compara los números tal cual")
    void cantidadComparable_conteo_sin_conversion() {
        // 1 unidad de ajo cuenta como 1 frente a un ingrediente medido en dientes.
        assertThat(service.cantidadComparable(1, "unidad", "dientes")).contains(1.0);
        assertThat(service.cantidadComparable(2, "rebanadas", "unidades")).contains(2.0);
    }

    @Test
    @DisplayName("cantidadComparable devuelve empty entre familias distintas")
    void cantidadComparable_familias_distintas_empty() {
        assertThat(service.cantidadComparable(200, "g", "unidad")).isEmpty();
        assertThat(service.cantidadComparable(1, "l", "diente")).isEmpty();
    }
}
