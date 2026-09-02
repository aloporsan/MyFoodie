import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ReporteModal } from '@/components/social';
import { useToast } from '@/hooks/useToast';
import { showConfirm } from '@/hooks/useConfirm';
import {
  COMENTARIO_MAX_LENGTH,
  Comentario,
  comentarioService,
} from '@/services/comentarioService';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { handleApiError } from '@/utils/errorHandler';
import { ComentarioCard } from './ComentarioCard';

interface Props {
  recetaId: string;
  onCountChange?: (total: number) => void;
}

export function ListaComentarios({ recetaId, onCountChange }: Props) {
  const { showError } = useToast();
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comentarioAReportar, setComentarioAReportar] = useState<Comentario | null>(null);

  const sincronizar = useCallback(
    (lista: Comentario[]) => {
      setComentarios(lista);
      onCountChange?.(lista.length);
    },
    [onCountChange],
  );

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    comentarioService
      .obtenerComentarios(recetaId)
      .then((lista) => {
        if (cancelado) return;
        sincronizar(lista);
        setError(null);
      })
      .catch(() => {
        if (!cancelado) setError('No se pudieron cargar los comentarios');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [recetaId, sincronizar]);

  const enviar = async () => {
    const limpio = texto.trim();
    if (!limpio || enviando) return;
    setEnviando(true);
    try {
      const creado = await comentarioService.crearComentario(recetaId, limpio);
      sincronizar([creado, ...comentarios]);
      setTexto('');
    } catch (e) {
      showError(handleApiError(e));
    } finally {
      setEnviando(false);
    }
  };

  const eliminar = (comentario: Comentario) => {
    showConfirm('Eliminar comentario', '¿Seguro que quieres eliminar tu comentario?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await comentarioService.eliminarComentario(recetaId, comentario.id);
            sincronizar(comentarios.filter((c) => c.id !== comentario.id));
          } catch (e) {
            showError(handleApiError(e));
          }
        },
      },
    ]);
  };

  const restantes = COMENTARIO_MAX_LENGTH - texto.length;

  return (
    <View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={texto}
          onChangeText={setTexto}
          placeholder="Escribe un comentario…"
          placeholderTextColor={colors.grayMid}
          multiline
          maxLength={COMENTARIO_MAX_LENGTH}
          testID="input-comentario"
        />
        <Pressable
          style={[styles.enviar, (!texto.trim() || enviando) && styles.enviarDisabled]}
          onPress={enviar}
          disabled={!texto.trim() || enviando}
          hitSlop={8}
          testID="btn-enviar-comentario"
        >
          {enviando ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="send" size={16} color={colors.white} />
          )}
        </Pressable>
      </View>
      {texto.length > 0 && restantes <= 50 && (
        <Text style={styles.contador}>{restantes}</Text>
      )}

      {cargando ? (
        <ActivityIndicator style={styles.estado} color={colors.primary} />
      ) : error ? (
        <Text style={[styles.estado, styles.estadoTexto]}>{error}</Text>
      ) : comentarios.length === 0 ? (
        <Text style={[styles.estado, styles.estadoTexto]}>Sé el primero en comentar</Text>
      ) : (
        <View style={styles.lista}>
          {comentarios.map((c) => (
            <ComentarioCard
              key={c.id}
              comentario={c}
              onEliminar={eliminar}
              onReportar={setComentarioAReportar}
            />
          ))}
        </View>
      )}

      <ReporteModal
        visible={comentarioAReportar !== null}
        tipoContenido="COMENTARIO"
        contenidoId={comentarioAReportar?.id ?? ''}
        onClose={() => setComentarioAReportar(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text.primary,
  },
  enviar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enviarDisabled: { backgroundColor: colors.grayMid },
  contador: {
    ...typography.caption,
    color: colors.grayMid,
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  estado: { marginTop: spacing.lg, marginBottom: spacing.sm },
  estadoTexto: { ...typography.caption, color: colors.grayMid, textAlign: 'center' },
  lista: { marginTop: spacing.sm },
});
