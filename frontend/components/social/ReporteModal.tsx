import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import {
  MOTIVOS_REPORTE,
  MotivoReporte,
  REPORTE_DESCRIPCION_MAX_LENGTH,
  TipoContenidoReporte,
  reporteService,
} from '@/services/reporteService';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { handleApiError } from '@/utils/errorHandler';

interface Props {
  visible: boolean;
  tipoContenido: TipoContenidoReporte;
  contenidoId: string;
  onClose: () => void;
}

const TITULO_POR_TIPO: Record<TipoContenidoReporte, string> = {
  PERFIL: 'Reportar perfil',
  RECETA: 'Reportar receta',
  COMENTARIO: 'Reportar comentario',
};

export function ReporteModal({ visible, tipoContenido, contenidoId, onClose }: Props) {
  const { showSuccess, showError } = useToast();
  const [motivo, setMotivo] = useState<MotivoReporte | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);

  const reset = () => {
    setMotivo(null);
    setDescripcion('');
    setEnviando(false);
  };

  const cerrar = () => {
    reset();
    onClose();
  };

  const esOtro = motivo === 'OTRO';
  const puedeEnviar = motivo !== null && (!esOtro || descripcion.trim().length > 0) && !enviando;

  const enviar = async () => {
    if (!motivo || !puedeEnviar) return;
    setEnviando(true);
    try {
      await reporteService.crearReporte({
        tipoContenido,
        contenidoId,
        motivo,
        descripcionAdicional: descripcion.trim() || undefined,
      });
      showSuccess('Gracias, hemos recibido tu reporte');
      cerrar();
    } catch (e) {
      showError(handleApiError(e));
      setEnviando(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={cerrar}>
      <View style={styles.container}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={cerrar} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.titulo}>{TITULO_POR_TIPO[tipoContenido]}</Text>
            <Pressable onPress={cerrar} hitSlop={8} testID="btn-cerrar-reporte">
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.seccion}>¿Cuál es el problema?</Text>
            {MOTIVOS_REPORTE.map((opcion) => {
              const seleccionado = motivo === opcion.valor;
              return (
                <Pressable
                  key={opcion.valor}
                  style={styles.opcion}
                  onPress={() => setMotivo(opcion.valor)}
                  testID={`motivo-${opcion.valor}`}
                >
                  <Ionicons
                    name={seleccionado ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={seleccionado ? colors.primary : colors.grayMid}
                  />
                  <Text style={styles.opcionTexto}>{opcion.etiqueta}</Text>
                </Pressable>
              );
            })}

            {esOtro && (
              <TextInput
                style={styles.input}
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Cuéntanos qué ocurre"
                placeholderTextColor={colors.grayMid}
                multiline
                maxLength={REPORTE_DESCRIPCION_MAX_LENGTH}
                testID="input-descripcion-reporte"
              />
            )}
          </ScrollView>

          <Button
            label="Enviar reporte"
            onPress={enviar}
            disabled={!puedeEnviar}
            loading={enviando}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: { ...typography.heading2, color: colors.text.primary },
  seccion: { ...typography.label, color: colors.text.secondary, marginBottom: spacing.sm },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  opcionTexto: { ...typography.body, color: colors.text.primary },
  input: {
    marginTop: spacing.sm,
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text.primary,
    textAlignVertical: 'top',
  },
});
