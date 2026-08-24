import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ResultadoOCR } from '@/services/ocrService';
import { etiquetaUnidad, UNIDADES_OBJETIVAS } from '@/utils/unidadConfig';
import { borderRadius, colors, spacing, typography } from '@/theme';

export interface AjusteOCR {
  nombre: string;
  cantidad: number;
  unidad: string;
  fechaCaducidad: string | null;
  ignorado: boolean;
  // Solo relevante cuando resultado.accion === 'sugerencia'. null = el usuario aún no ha respondido.
  confirmaSugerencia: boolean | null;
}

interface Props {
  resultado: ResultadoOCR;
  onChange: (ajuste: AjusteOCR) => void;
}

function dateToApi(d: Date): string {
  return d.toISOString().split('T')[0];
}

function apiToDisplay(s: string): string {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

// El OCR a veces detecta "gr"; no forma parte de las unidades objetivas del selector, así
// que la normalizamos a "g" para que el chip correspondiente quede preseleccionado.
function unidadInicialDesde(unidadDetectada: string | null): string {
  if (!unidadDetectada) return 'unidad';
  return unidadDetectada === 'gr' ? 'g' : unidadDetectada;
}

export function OCRResultadoCard({ resultado, onChange }: Props) {
  const { productoTicket, accion, productoExistente, mensajeSugerencia } = resultado;

  const [nombre, setNombre] = useState(productoTicket.nombreDetectado);
  const [cantidadTexto, setCantidadTexto] = useState(
    String(productoTicket.cantidadDetectada ?? 1)
  );
  const [unidad, setUnidad] = useState(unidadInicialDesde(productoTicket.unidadDetectada));
  const [fechaCaducidad, setFechaCaducidad] = useState('');
  const [mostrarFecha, setMostrarFecha] = useState(false);
  const [ignorado, setIgnorado] = useState(false);
  const [confirmaSugerencia, setConfirmaSugerencia] = useState<boolean | null>(null);

  const notify = (overrides: Partial<AjusteOCR> = {}) => {
    onChange({
      nombre,
      cantidad: parseFloat(cantidadTexto) || 0,
      unidad,
      fechaCaducidad: fechaCaducidad || null,
      ignorado,
      confirmaSugerencia,
      ...overrides,
    });
  };

  // Informa al padre del ajuste inicial en cuanto se monta la card, sin esperar a que el
  // usuario edite nada: así el contador de "Añadirás N productos" es correcto desde el principio.
  useEffect(() => {
    notify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNombreChange = (t: string) => {
    setNombre(t);
    notify({ nombre: t });
  };

  const handleCantidadChange = (t: string) => {
    setCantidadTexto(t);
    notify({ cantidad: parseFloat(t) || 0 });
  };

  const handleUnidadChange = (u: string) => {
    setUnidad(u);
    notify({ unidad: u });
  };

  const handleFechaChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setMostrarFecha(false);
    if (date) {
      const iso = dateToApi(date);
      setFechaCaducidad(iso);
      notify({ fechaCaducidad: iso });
    }
  };

  const handleToggleIgnorar = (valor: boolean) => {
    setIgnorado(valor);
    notify({ ignorado: valor });
  };

  const handleResponderSugerencia = (esLoMismo: boolean) => {
    setConfirmaSugerencia(esLoMismo);
    notify({ confirmaSugerencia: esLoMismo });
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.lineaOriginal} numberOfLines={1}>
          {productoTicket.lineaOriginal}
        </Text>
        <Switch
          testID="toggle-ignorar"
          value={ignorado}
          onValueChange={handleToggleIgnorar}
          trackColor={{ false: colors.gray, true: colors.grayMid }}
          thumbColor={colors.white}
          ios_backgroundColor={colors.gray}
        />
      </View>

      {accion === 'actualizado' && productoExistente && (
        <Badge label={`Se actualizará ${productoExistente.nombre}`} variant="primary" />
      )}

      {accion === 'sugerencia' && (
        <View style={styles.banner}>
          <Text style={styles.bannerTexto}>
            {mensajeSugerencia ?? `¿Es lo mismo que "${productoExistente?.nombre}"?`}
          </Text>
          {confirmaSugerencia === null ? (
            <View style={styles.bannerBotones}>
              <Pressable
                style={[styles.bannerBtn, styles.bannerBtnSi]}
                onPress={() => handleResponderSugerencia(true)}
              >
                <Text style={styles.bannerBtnSiTexto}>Sí, es lo mismo</Text>
              </Pressable>
              <Pressable
                style={[styles.bannerBtn, styles.bannerBtnNo]}
                onPress={() => handleResponderSugerencia(false)}
              >
                <Text style={styles.bannerBtnNoTexto}>No, es distinto</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.bannerRespuesta}
              onPress={() => handleResponderSugerencia(!confirmaSugerencia)}
            >
              <Ionicons
                name={confirmaSugerencia ? 'checkmark-circle' : 'add-circle'}
                size={16}
                color={colors.secondary}
              />
              <Text style={styles.bannerRespuestaTexto}>
                {confirmaSugerencia
                  ? `Se fusionará con ${productoExistente?.nombre}`
                  : 'Se añadirá como producto nuevo'}
              </Text>
              <Text style={styles.bannerCambiar}>Cambiar</Text>
            </Pressable>
          )}
        </View>
      )}

      <View style={[styles.campos, ignorado && styles.camposDeshabilitados]} pointerEvents={ignorado ? 'none' : 'auto'}>
        <Campo label="Nombre">
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={handleNombreChange}
            editable={!ignorado}
          />
        </Campo>

        <View style={styles.fila}>
          <View style={styles.campoCantidad}>
            <Campo label="Cantidad">
              <TextInput
                style={styles.input}
                value={cantidadTexto}
                onChangeText={handleCantidadChange}
                keyboardType="decimal-pad"
                editable={!ignorado}
              />
            </Campo>
          </View>

          <View style={styles.campoUnidad}>
            <Campo label="Unidad">
              <View style={styles.chips}>
                {UNIDADES_OBJETIVAS.map((op) => {
                  const activo = unidad === op;
                  return (
                    <Pressable
                      key={op}
                      style={[styles.chip, activo && styles.chipActivo]}
                      onPress={() => handleUnidadChange(op)}
                      disabled={ignorado}
                    >
                      <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>
                        {etiquetaUnidad(op)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Campo>
          </View>
        </View>

        <Campo label="Fecha de caducidad (opcional)">
          <Pressable style={styles.fechaRow} onPress={() => setMostrarFecha(true)} disabled={ignorado}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={fechaCaducidad ? colors.primary : colors.grayMid}
            />
            <Text style={[styles.fechaTexto, !fechaCaducidad && styles.fechaPlaceholder]}>
              {fechaCaducidad ? apiToDisplay(fechaCaducidad) : 'Sin especificar'}
            </Text>
            {fechaCaducidad && (
              <Pressable onPress={() => { setFechaCaducidad(''); notify({ fechaCaducidad: null }); }} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.grayMid} />
              </Pressable>
            )}
          </Pressable>
          {mostrarFecha && (
            <DateTimePicker
              value={fechaCaducidad ? new Date(`${fechaCaducidad}T12:00:00`) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleFechaChange}
            />
          )}
        </Campo>
      </View>
    </Card>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.campoLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  lineaOriginal: {
    ...typography.caption,
    color: colors.grayMid,
    flex: 1,
    fontStyle: 'italic',
  },
  banner: {
    backgroundColor: '#FEF3E0',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  bannerTexto: { ...typography.body, color: colors.text.primary },
  bannerBotones: { flexDirection: 'row', gap: spacing.sm },
  bannerBtn: {
    flex: 1,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  bannerBtnSi: { backgroundColor: colors.secondary },
  bannerBtnSiTexto: { ...typography.label, color: colors.white },
  bannerBtnNo: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.secondary },
  bannerBtnNoTexto: { ...typography.label, color: colors.secondary },
  bannerRespuesta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  bannerRespuestaTexto: { ...typography.caption, color: colors.text.primary, flex: 1 },
  bannerCambiar: { ...typography.caption, color: colors.secondary, fontWeight: '700' },
  campos: { gap: spacing.sm },
  camposDeshabilitados: { opacity: 0.4 },
  campo: { gap: spacing.xs },
  campoLabel: { ...typography.caption, color: colors.text.secondary },
  input: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  fila: { flexDirection: 'row', gap: spacing.sm },
  campoCantidad: { flex: 1 },
  campoUnidad: { flex: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.grayLight,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActivo: { backgroundColor: '#E8F5D0', borderColor: colors.primary },
  chipTexto: { ...typography.caption, color: colors.text.secondary },
  chipTextoActivo: { color: colors.primaryDark, fontWeight: '700' },
  fechaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  fechaTexto: { ...typography.body, color: colors.text.primary, flex: 1 },
  fechaPlaceholder: { color: colors.grayMid },
});
