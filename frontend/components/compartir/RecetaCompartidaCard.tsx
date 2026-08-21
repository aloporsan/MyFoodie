import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import type { RecetaCompartida } from '@/services/compartirService';
import { useCompartirStore } from '@/store/compartirStore';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { resolveImagenUrl } from '@/utils/media';

interface Props {
  recetaCompartida: RecetaCompartida;
  onVerReceta: () => void;
}

function formatFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function RecetaCompartidaCard({ recetaCompartida, onVerReceta }: Props) {
  const { showSuccess, showError } = useToast();
  const guardarRecetaCompartida = useCompartirStore((s) => s.guardarRecetaCompartida);

  const { emisor, receta, mensaje, leida, createdAt } = recetaCompartida;
  const imagenUrl = resolveImagenUrl(receta.imagenUrl);

  const handleGuardar = async () => {
    try {
      await guardarRecetaCompartida(recetaCompartida.id);
      showSuccess('Receta guardada');
    } catch {
      showError('No se pudo guardar la receta');
    }
  };

  return (
    <View style={styles.container} testID="receta-compartida-card">
      <View style={styles.header}>
        <View style={styles.emisorRow}>
          {emisor.fotoPerfil ? (
            <Image source={{ uri: emisor.fotoPerfil }} style={styles.emisorFoto} contentFit="cover" />
          ) : (
            <View style={[styles.emisorFoto, styles.emisorFotoPlaceholder]}>
              <Ionicons name="person" size={16} color={colors.white} />
            </View>
          )}
          <View style={styles.emisorInfo}>
            <Text style={styles.emisorNombre} numberOfLines={1}>
              {emisor.nombre}
            </Text>
            <Text style={styles.emisorUsuario} numberOfLines={1}>
              @{emisor.nombreUsuario}
            </Text>
          </View>
        </View>
        {!leida && <Badge label="Nueva" variant="secondary" />}
      </View>

      <Pressable onPress={onVerReceta} testID="btn-ver-imagen">
        {imagenUrl ? (
          <Image source={{ uri: imagenUrl }} style={styles.imagen} contentFit="cover" />
        ) : (
          <View style={[styles.imagen, styles.imagenPlaceholder]}>
            <Ionicons name="restaurant-outline" size={36} color={colors.grayMid} />
          </View>
        )}
      </Pressable>

      <View style={styles.contenido}>
        <Text style={styles.titulo} numberOfLines={2}>
          {receta.titulo}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.metaTexto}>{receta.tiempoEstimado} min</Text>
          <Text style={styles.metaSeparador}>·</Text>
          <Text style={styles.metaTexto}>{receta.dificultad}</Text>
        </View>

        {mensaje && (
          <Text style={styles.mensaje} numberOfLines={3} testID="mensaje-emisor">
            &quot;{mensaje}&quot;
          </Text>
        )}

        <Text style={styles.fecha}>{formatFecha(createdAt)}</Text>

        <View style={styles.botones}>
          <Button label="Ver receta" onPress={onVerReceta} variant="secondary" size="sm" style={styles.boton} />
          <Button label="Guardar receta" onPress={handleGuardar} size="sm" style={styles.boton} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  emisorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  emisorFoto: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
  },
  emisorFotoPlaceholder: {
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emisorInfo: {
    flexShrink: 1,
  },
  emisorNombre: {
    ...typography.label,
    color: colors.text.primary,
  },
  emisorUsuario: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  imagen: {
    width: '100%',
    height: 160,
  },
  imagenPlaceholder: {
    backgroundColor: colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenido: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  titulo: {
    ...typography.heading3,
    color: colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaTexto: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  metaSeparador: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  mensaje: {
    ...typography.body,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  fecha: {
    ...typography.caption,
    color: colors.grayMid,
  },
  botones: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  boton: {
    flex: 1,
  },
});
