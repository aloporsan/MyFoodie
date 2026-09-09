import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { HistorialCompra, historialService } from '@/services/historialService';
import { handleApiError } from '@/utils/errorHandler';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function dateToApi(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatFecha(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const ORIGEN_CONFIG: Record<
  HistorialCompra['origen'],
  { label: string; icono: React.ComponentProps<typeof Ionicons>['name']; color: string }
> = {
  lista: { label: 'Lista', icono: 'cart-outline', color: colors.primary },
  ticket: { label: 'Ticket', icono: 'receipt-outline', color: colors.secondary },
};

export function HistorialComprasScreen() {
  const router = useRouter();
  const [historial, setHistorial] = useState<HistorialCompra[]>([]);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const datos = await historialService.obtenerHistorialCompras({ fechaDesde, fechaHasta });
      setHistorial(datos);
      setError(null);
    } catch (e) {
      setError(handleApiError(e));
    }
  }, [fechaDesde, fechaHasta]);

  useEffect(() => {
    cargar().finally(() => setCargandoInicial(false));
  }, [cargar]);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargar();
    setRefreshing(false);
  };

  if (cargandoInicial) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitulo}>Historial de compras</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filtros}>
        <DateField
          label="Desde"
          value={fechaDesde}
          onChange={setFechaDesde}
          maximumDate={fechaHasta ? new Date(fechaHasta + 'T12:00:00') : undefined}
        />
        <DateField
          label="Hasta"
          value={fechaHasta}
          onChange={setFechaHasta}
          minimumDate={fechaDesde ? new Date(fechaDesde + 'T12:00:00') : undefined}
        />
        {(fechaDesde || fechaHasta) && (
          <Pressable
            style={styles.limpiarBtn}
            onPress={() => {
              setFechaDesde('');
              setFechaHasta('');
            }}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={20} color={colors.grayMid} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={historial}
        keyExtractor={(item) => item.id}
        contentContainerStyle={historial.length === 0 ? styles.centrado : styles.lista}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.emptyWrapper}>
            <Ionicons name="receipt-outline" size={56} color={colors.grayMid} />
            <Text style={styles.emptyTitulo}>
              {error
                ? error
                : fechaDesde || fechaHasta
                  ? 'No hay compras en el rango seleccionado'
                  : 'Aún no tienes compras registradas'}
            </Text>
          </View>
        }
        renderItem={({ item }) => <HistorialCard compra={item} />}
      />
    </SafeAreaView>
  );
}

function HistorialCard({ compra }: { compra: HistorialCompra }) {
  const cfg = ORIGEN_CONFIG[compra.origen];
  return (
    <View style={cardStyles.container}>
      <View style={[cardStyles.iconoWrapper, { backgroundColor: cfg.color + '20' }]}>
        <Ionicons name={cfg.icono} size={20} color={cfg.color} />
      </View>
      <View style={cardStyles.info}>
        <Text style={cardStyles.titulo} numberOfLines={1}>
          {compra.titulo}
        </Text>
        <Text style={cardStyles.fecha}>{formatFecha(compra.fecha)}</Text>
        {compra.items.length > 0 && (
          <Text style={cardStyles.items} numberOfLines={2}>
            {compra.items.join(' · ')}
          </Text>
        )}
      </View>
      <View style={cardStyles.derecha}>
        <View style={[cardStyles.badge, { backgroundColor: cfg.color + '20' }]}>
          <Text style={[cardStyles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        <Text style={cardStyles.contador}>
          {compra.numeroItems} producto{compra.numeroItems !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );
}

function DateField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}) {
  const [show, setShow] = useState(false);
  const pickerDate = value ? new Date(value + 'T12:00:00') : new Date();

  const handleChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (date) onChange(dateToApi(date));
  };

  return (
    <View style={dateStyles.wrapper}>
      <Pressable style={dateStyles.row} onPress={() => setShow(true)}>
        <Ionicons
          name="calendar-outline"
          size={16}
          color={value ? colors.primary : colors.grayMid}
        />
        <Text style={[dateStyles.text, !value && dateStyles.placeholder]} numberOfLines={1}>
          {value ? formatFecha(value) : label}
        </Text>
      </Pressable>

      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      {show && Platform.OS === 'ios' && (
        <View style={dateStyles.iosWrapper}>
          <Pressable style={dateStyles.doneBtn} onPress={() => setShow(false)}>
            <Text style={dateStyles.doneBtnText}>Hecho</Text>
          </Pressable>
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display="spinner"
            onChange={handleChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
          />
        </View>
      )}
    </View>
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
    borderBottomColor: colors.grayLight,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitulo: { ...typography.heading3, color: colors.text.primary },
  filtros: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  limpiarBtn: { padding: spacing.xs },
  lista: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  centrado: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyWrapper: { alignItems: 'center', gap: spacing.md },
  emptyTitulo: { ...typography.heading3, color: colors.text.primary, textAlign: 'center' },
});

const cardStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  iconoWrapper: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  titulo: { ...typography.label, color: colors.text.primary },
  fecha: { ...typography.caption, color: colors.text.secondary },
  items: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },
  derecha: { alignItems: 'flex-end', gap: spacing.xs },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
  },
  badgeText: { ...typography.caption, fontWeight: '700' },
  contador: { ...typography.caption, color: colors.text.secondary },
});

const dateStyles = StyleSheet.create({
  wrapper: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.grayLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  text: { ...typography.caption, color: colors.text.primary, flex: 1 },
  placeholder: { color: colors.grayMid },
  iosWrapper: { backgroundColor: colors.white },
  doneBtn: { alignSelf: 'flex-end', padding: spacing.sm },
  doneBtnText: { ...typography.label, color: colors.primary, fontWeight: '700' },
});
