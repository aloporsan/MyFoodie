package com.myfoodie.application.service;

import com.myfoodie.application.dto.unidad.UnidadConvertidaDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

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
}
