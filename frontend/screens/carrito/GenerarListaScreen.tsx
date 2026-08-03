import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ItemCarrito } from '@/services/carritoService';
import { useCarritoStore } from '@/store/carritoStore';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function nombrePorDefecto(): string {
  const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  return `Lista del ${fecha}`;
}

export function GenerarListaScreen() {
  const router = useRouter();
  const { items, generarListaCompra } = useCarritoStore();
  const [nombre, setNombre] = useState('');
  const [creando, setCreando] = useState(false);

  const aceptados = useMemo(() => items.filter((i) => i.estado === 'aceptado'), [items]);

  const porCategoria = useMemo(() => {
    const grupos = new Map<string, ItemCarrito[]>();
    for (const item of aceptados) {
      const cat = item.categoria || 'Sin categoría';
      if (!grupos.has(cat)) grupos.set(cat, []);
      grupos.get(cat)!.push(item);
    }
    return Array.from(grupos.entries());
  }, [aceptados]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/carrito'));

  const handleCrear = async () => {
    setCreando(true);
    try {
      const lista = await generarListaCompra(nombre.trim() || undefined);
      router.replace(`/carrito/lista/${lista.id}`);
    } finally {
      setCreando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitulo}>Generar lista de compra</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.label}>Nombre de la lista</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder={nombrePorDefecto()}
            placeholderTextColor={colors.grayMid}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.resumenTitulo}>
            {aceptados.length} producto{aceptados.length !== 1 ? 's' : ''} aceptado
            {aceptados.length !== 1 ? 's' : ''}
          </Text>
          {porCategoria.map(([categoria, itemsCat]) => (
            <View key={categoria} style={styles.grupo}>
              <Text style={styles.grupoTitulo}>{categoria}</Text>
              {itemsCat.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemNombre} numberOfLines={1}>{item.nombre}</Text>
                  <Text style={styles.itemCantidad}>{item.cantidad} {item.unidad}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.btnCrear, (creando || aceptados.length === 0) && styles.btnDisabled]}
          onPress={handleCrear}
          disabled={creando || aceptados.length === 0}
        >
          {creando ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.btnCrearText}>Crear lista</Text>
          )}
        </Pressable>
      </View>
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
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  label: { ...typography.label, color: colors.text.secondary },
  input: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  resumenTitulo: { ...typography.heading3, color: colors.text.primary, marginBottom: spacing.xs },
  grupo: { marginTop: spacing.sm },
  grupoTitulo: { ...typography.label, color: colors.primaryDark, marginBottom: spacing.xs },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  itemNombre: { ...typography.body, color: colors.text.primary, flex: 1 },
  itemCantidad: { ...typography.caption, color: colors.text.secondary },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray,
  },
  btnCrear: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnCrearText: { ...typography.button, color: colors.white },
  btnDisabled: { opacity: 0.4 },
});
