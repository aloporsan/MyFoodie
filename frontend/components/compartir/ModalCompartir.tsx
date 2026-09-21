import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BuscadorUsuarios } from '@/components/social';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import type { UsuarioBusqueda } from '@/services/socialService';
import { useCompartirStore } from '@/store/compartirStore';
import { useSocialStore } from '@/store/socialStore';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { handleApiError } from '@/utils/errorHandler';

const MAX_RECEPTORES = 10;
const MENSAJE_MAX_LENGTH = 200;

interface Props {
  visible: boolean;
  recetaId: string;
  onClose: () => void;
}

export function ModalCompartir({ visible, recetaId, onClose }: Props) {
  const { showSuccess, showWarning, showError } = useToast();
  const insets = useSafeAreaInsets();

  const resultadosBusqueda = useSocialStore((s) => s.resultadosBusqueda);
  const buscarUsuarios = useSocialStore((s) => s.buscarUsuarios);

  const isLoading = useCompartirStore((s) => s.isLoading);
  const compartirReceta = useCompartirStore((s) => s.compartirReceta);

  const [texto, setTexto] = useState('');
  const [seleccionados, setSeleccionados] = useState<UsuarioBusqueda[]>([]);
  const [mensaje, setMensaje] = useState('');

  const reset = () => {
    setTexto('');
    setSeleccionados([]);
    setMensaje('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleBuscar = (t: string) => {
    setTexto(t);
    buscarUsuarios(t, true);
  };

  const handleLimpiar = () => {
    setTexto('');
    buscarUsuarios('', true);
  };

  const handleSeleccionar = (usuario: UsuarioBusqueda) => {
    if (seleccionados.some((u) => u.id === usuario.id)) return;
    if (seleccionados.length >= MAX_RECEPTORES) {
      showWarning(`Puedes compartir con un máximo de ${MAX_RECEPTORES} usuarios`);
      return;
    }
    setSeleccionados((prev) => [...prev, usuario]);
  };

  const handleQuitar = (usuarioId: string) => {
    setSeleccionados((prev) => prev.filter((u) => u.id !== usuarioId));
  };

  const handleCompartir = async () => {
    if (seleccionados.length === 0) return;
    try {
      await compartirReceta(
        recetaId,
        seleccionados.map((u) => u.id),
        mensaje.trim() || undefined
      );
      showSuccess(`Receta compartida con ${seleccionados.length} usuarios`);
      reset();
      onClose();
    } catch (e) {
      showError(handleApiError(e));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />
          <View style={[styles.sheet, { paddingBottom: spacing.lg + insets.bottom }]}>
            <View style={styles.header}>
              <Text style={styles.titulo}>Compartir receta</Text>
              <Pressable onPress={handleClose} hitSlop={8} testID="btn-cerrar-modal">
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </Pressable>
            </View>

            <BuscadorUsuarios
              value={texto}
              onBuscar={handleBuscar}
              onLimpiar={handleLimpiar}
              placeholder="Buscar usuarios..."
            />

            {seleccionados.length > 0 && (
              <View style={styles.chipsRow} testID="chips-seleccionados">
                {seleccionados.map((u) => (
                  <View key={u.id} style={styles.chip} testID={`chip-usuario-${u.id}`}>
                    <Text style={styles.chipTexto} numberOfLines={1}>
                      {u.nombreUsuario}
                    </Text>
                    <Pressable
                      onPress={() => handleQuitar(u.id)}
                      hitSlop={8}
                      testID={`btn-quitar-${u.id}`}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.grayDark} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {texto.trim().length > 0 && (
              <FlatList
                style={styles.resultados}
                data={resultadosBusqueda}
                keyExtractor={(u) => u.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.resultadoItem}
                    onPress={() => handleSeleccionar(item)}
                    testID={`resultado-usuario-${item.id}`}
                  >
                    {item.fotoPerfil ? (
                      <Image source={{ uri: item.fotoPerfil }} style={styles.resultadoFoto} />
                    ) : (
                      <View style={[styles.resultadoFoto, styles.resultadoFotoPlaceholder]}>
                        <Ionicons name="person" size={16} color={colors.white} />
                      </View>
                    )}
                    <View style={styles.resultadoInfo}>
                      <Text style={styles.resultadoNombre} numberOfLines={1}>
                        {item.nombre}
                      </Text>
                      <Text style={styles.resultadoUsuario} numberOfLines={1}>
                        @{item.nombreUsuario}
                      </Text>
                    </View>
                    {seleccionados.some((u) => u.id === item.id) && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </Pressable>
                )}
              />
            )}

            <View style={styles.mensajeWrapper}>
              <TextInput
                style={styles.mensajeInput}
                placeholder="Añade un mensaje (opcional)"
                placeholderTextColor={colors.grayMid}
                value={mensaje}
                onChangeText={(t) => setMensaje(t.slice(0, MENSAJE_MAX_LENGTH))}
                maxLength={MENSAJE_MAX_LENGTH}
                multiline
                testID="input-mensaje"
              />
              <Text style={styles.contador} testID="contador-caracteres">
                {mensaje.length}/{MENSAJE_MAX_LENGTH}
              </Text>
            </View>

            <Button
              label="Compartir"
              onPress={handleCompartir}
              disabled={seleccionados.length === 0}
              loading={isLoading}
              fullWidth
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  titulo: {
    ...typography.heading2,
    color: colors.text.primary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    maxWidth: 160,
  },
  chipTexto: {
    ...typography.caption,
    color: colors.text.primary,
    flexShrink: 1,
  },
  resultados: {
    maxHeight: 200,
  },
  resultadoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  resultadoFoto: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
  },
  resultadoFotoPlaceholder: {
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultadoInfo: {
    flex: 1,
    gap: 2,
  },
  resultadoNombre: {
    ...typography.label,
    color: colors.text.primary,
  },
  resultadoUsuario: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  mensajeWrapper: {
    gap: spacing.xs,
  },
  mensajeInput: {
    ...typography.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  contador: {
    ...typography.caption,
    color: colors.grayMid,
    alignSelf: 'flex-end',
  },
});
