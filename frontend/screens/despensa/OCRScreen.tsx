import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { AjusteOCR, OCRResultadoCard } from '@/components/ocr/OCRResultadoCard';
import { ImagenTicketSeleccionada, SelectorImagenTicket } from '@/components/ocr/SelectorImagenTicket';
import { useToast } from '@/hooks/useToast';
import { AccionConfirmacionOCR, ProductoConfirmadoOCR } from '@/services/ocrService';
import { useOCRStore } from '@/store/ocrStore';
import { borderRadius, colors, spacing, typography } from '@/theme';

export function OCRScreen() {
  const router = useRouter();
  const { showSuccess, showError, showInfo } = useToast();
  const {
    resultados,
    isProcessing,
    isConfirming,
    procesarTicket,
    confirmarProductos,
    limpiarResultados,
  } = useOCRStore();

  const [imagen, setImagen] = useState<ImagenTicketSeleccionada | null>(null);
  const [ajustes, setAjustes] = useState<Record<number, AjusteOCR>>({});

  // Al entrar en la pantalla se descarta cualquier resultado de un escaneo anterior,
  // así siempre se empieza en el paso 1 (selección de imagen).
  useEffect(() => {
    limpiarResultados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enRevision = resultados.length > 0;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/despensa'));

  const handleProcesar = async () => {
    if (!imagen) return;
    const formData = new FormData();
    formData.append('imagen', {
      uri: imagen.uri,
      name: imagen.nombre,
      type: imagen.tipo,
    } as unknown as Blob);
    try {
      const detectados = await procesarTicket(formData);
      setAjustes({});
      if (detectados.length === 0) {
        showInfo('No hemos detectado ningún producto en esta imagen. Prueba con otra foto más nítida.');
      }
    } catch {
      showError(useOCRStore.getState().error ?? 'No se pudo procesar el ticket. Inténtalo de nuevo.');
    }
  };

  const handleAjusteChange = (indice: number, ajuste: AjusteOCR) => {
    setAjustes((prev) => ({ ...prev, [indice]: ajuste }));
  };

  const productosAAñadir = resultados.filter((_, i) => !ajustes[i]?.ignorado).length;

  const construirProductoConfirmado = (
    resultado: (typeof resultados)[number],
    ajuste: AjusteOCR | undefined
  ): ProductoConfirmadoOCR => {
    const base = {
      nombre: ajuste?.nombre ?? resultado.productoTicket.nombreDetectado,
      cantidad: ajuste?.cantidad ?? resultado.productoTicket.cantidadDetectada ?? 1,
      unidad: ajuste?.unidad ?? resultado.productoTicket.unidadDetectada ?? 'unidad',
      fechaCaducidad: ajuste?.fechaCaducidad ?? null,
    };

    if (ajuste?.ignorado) {
      return { ...base, accion: 'ignorado', productoExistenteId: null };
    }

    // AUTOMATICO (el backend ya decidió actualizar) o el usuario confirmó que la sugerencia
    // era el mismo producto: en ambos casos se suma cantidad al producto existente.
    const debeActualizar =
      resultado.accion === 'actualizado' ||
      (resultado.accion === 'sugerencia' && ajuste?.confirmaSugerencia === true);

    const accion: AccionConfirmacionOCR = debeActualizar ? 'actualizado' : 'nuevo';
    return {
      ...base,
      accion,
      productoExistenteId: debeActualizar ? (resultado.productoExistente?.id ?? null) : null,
    };
  };

  const handleConfirmar = async () => {
    const productos = resultados.map((resultado, i) =>
      construirProductoConfirmado(resultado, ajustes[i])
    );
    try {
      const resumen = await confirmarProductos(productos);
      setImagen(null);
      setAjustes({});
      showSuccess(
        `${resumen.añadidos} producto${resumen.añadidos === 1 ? '' : 's'} añadido${resumen.añadidos === 1 ? '' : 's'}, ` +
          `${resumen.actualizados} actualizado${resumen.actualizados === 1 ? '' : 's'}, ` +
          `${resumen.ignorados} ignorado${resumen.ignorados === 1 ? '' : 's'}`
      );
      router.replace('/despensa');
    } catch {
      showError(useOCRStore.getState().error ?? 'No se pudieron añadir los productos. Inténtalo de nuevo.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LoadingOverlay visible={isProcessing} mensaje="Analizando tu ticket..." />
      <LoadingOverlay visible={isConfirming} mensaje="Añadiendo productos a tu despensa..." />

      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitulo}>Escanear ticket</Text>
        <View style={{ width: 24 }} />
      </View>

      {!enRevision ? (
        <View style={styles.pasoSeleccion}>
          <SelectorImagenTicket imagen={imagen} onSeleccionarImagen={setImagen} disabled={isProcessing} />
          <Pressable
            style={[styles.btnProcesar, (!imagen || isProcessing) && styles.btnDisabled]}
            onPress={handleProcesar}
            disabled={!imagen || isProcessing}
          >
            <Text style={styles.btnProcesarText}>Procesar ticket</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitulo}>
              Hemos encontrado {resultados.length} producto{resultados.length === 1 ? '' : 's'} en tu ticket
            </Text>
            {resultados.map((resultado, i) => (
              <OCRResultadoCard
                key={`${resultado.productoTicket.lineaOriginal}-${i}`}
                resultado={resultado}
                onChange={(ajuste) => handleAjusteChange(i, ajuste)}
              />
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.contador}>
              Añadirás {productosAAñadir} producto{productosAAñadir === 1 ? '' : 's'}
            </Text>
            <Pressable
              style={[styles.btnGuardar, (isConfirming || productosAAñadir === 0) && styles.btnDisabled]}
              onPress={handleConfirmar}
              disabled={isConfirming || productosAAñadir === 0}
            >
              {isConfirming ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.btnGuardarText}>Añadir a despensa</Text>
              )}
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  headerTitulo: { ...typography.heading3, color: colors.text.primary, flex: 1, textAlign: 'center' },
  pasoSeleccion: { flex: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.lg },
  btnProcesar: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnProcesarText: { ...typography.button, color: colors.white },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  subtitulo: { ...typography.heading3, color: colors.text.primary },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray,
    gap: spacing.sm,
  },
  contador: { ...typography.caption, color: colors.text.secondary, textAlign: 'center' },
  btnGuardar: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnGuardarText: { ...typography.button, color: colors.white },
  btnDisabled: { opacity: 0.4 },
});
