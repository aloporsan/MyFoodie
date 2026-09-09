import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { RecortadorFoto } from '@/components/perfil/RecortadorFoto';
import { showConfirm } from '@/hooks/useConfirm';
import { useToast } from '@/hooks/useToast';
import { usePerfilStore } from '@/store/perfilStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';

interface Errores {
  nombre?: string;
  nombreUsuario?: string;
  biografia?: string;
}

function validar(nombre: string, nombreUsuario: string, biografia: string): Errores {
  const errs: Errores = {};
  if (nombre.trim().length === 0) errs.nombre = 'El nombre no puede estar vacío';
  else if (nombre.trim().length > 100) errs.nombre = 'Máximo 100 caracteres';
  if (nombreUsuario.trim().length < 3) errs.nombreUsuario = 'Mínimo 3 caracteres';
  else if (nombreUsuario.trim().length > 30) errs.nombreUsuario = 'Máximo 30 caracteres';
  if (biografia.length > 500) errs.biografia = 'Máximo 500 caracteres';
  return errs;
}

export function EditarPerfilScreen() {
  const router = useRouter();
  const { perfil, isLoading, editarPerfil } = usePerfilStore();
  const { showSuccess } = useToast();

  const [nombre, setNombre] = useState(perfil?.nombre ?? '');
  const [nombreUsuario, setNombreUsuario] = useState(perfil?.nombreUsuario ?? '');
  const [biografia, setBiografia] = useState(perfil?.biografia ?? '');
  const [fotoPerfil, setFotoPerfil] = useState(perfil?.fotoPerfil ?? '');
  const [pendienteRecorte, setPendienteRecorte] = useState<{ uri: string; ancho: number; alto: number } | null>(null);

  const errores = validar(nombre, nombreUsuario, biografia);
  const hayErrores = Object.keys(errores).length > 0;

  const hayCambios =
    nombre !== (perfil?.nombre ?? '') ||
    nombreUsuario !== (perfil?.nombreUsuario ?? '') ||
    biografia !== (perfil?.biografia ?? '') ||
    fotoPerfil !== (perfil?.fotoPerfil ?? '');

  const procesarResultado = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    // Se toma la imagen sin recortar y se pasa por nuestro recortador cuadrado (misma idea
    // que el escaneo de tickets): así el recorte del avatar es siempre proporcional.
    setPendienteRecorte({ uri: asset.uri, ancho: asset.width, alto: asset.height });
  };

  const avisoPermiso = (recurso: string) =>
    showConfirm(
      'Permiso necesario',
      `Necesitamos acceso a tu ${recurso} para cambiar la foto. Actívalo en los ajustes del sistema.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ir a ajustes', onPress: () => Linking.openSettings() },
      ],
      { icon: 'settings-outline', variant: 'warning' }
    );

  const abrirGaleria = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return avisoPermiso('galería');
    procesarResultado(
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as ImagePicker.MediaType[],
        quality: 1,
      })
    );
  };

  const abrirCamara = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return avisoPermiso('cámara');
    procesarResultado(await ImagePicker.launchCameraAsync({ quality: 1 }));
  };

  const seleccionarFoto = () => {
    showConfirm('Foto de perfil', undefined, [
      { text: 'Hacer una foto', onPress: abrirCamara },
      { text: 'Elegir de la galería', onPress: abrirGaleria },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleGuardar = async () => {
    if (hayErrores || !hayCambios) return;
    try {
      await editarPerfil({
        nombre: nombre.trim(),
        nombreUsuario: nombreUsuario.trim(),
        biografia: biografia.trim() || undefined,
        fotoPerfil: fotoPerfil || undefined,
      });
      showSuccess('Perfil actualizado');
    } catch {
      // el error queda en el store
    }
  };

  const iniciales = (perfil?.nombre ?? '?')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LoadingOverlay visible={isLoading} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitulo}>Editar perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Selector de foto */}
          <View style={styles.fotoSeccion}>
            <Pressable onPress={seleccionarFoto} style={styles.fotoWrapper}>
              {fotoPerfil ? (
                <Image source={{ uri: fotoPerfil }} style={styles.foto} />
              ) : (
                <View style={styles.fotoPlaceholder}>
                  <Text style={styles.iniciales}>{iniciales}</Text>
                </View>
              )}
              <View style={styles.fotoOverlay}>
                <Ionicons name="camera" size={20} color={colors.white} />
              </View>
            </Pressable>
            <Text style={styles.fotoHint}>Toca para cambiar la foto</Text>
          </View>

          <Campo
            label="Nombre"
            valor={nombre}
            onChange={setNombre}
            error={errores.nombre}
            placeholder="Tu nombre completo"
            maxLength={100}
          />
          <Campo
            label="Nombre de usuario"
            valor={nombreUsuario}
            onChange={setNombreUsuario}
            error={errores.nombreUsuario}
            placeholder="nombreusuario"
            maxLength={30}
            autoCapitalize="none"
          />
          <Campo
            label="Biografía"
            valor={biografia}
            onChange={setBiografia}
            error={errores.biografia}
            placeholder="Cuéntanos algo sobre ti..."
            maxLength={500}
            multiline
            contador={`${biografia.length}/500`}
          />

          <Pressable
            style={[
              styles.guardarBtn,
              (hayErrores || !hayCambios || isLoading) && styles.guardarBtnDisabled,
            ]}
            onPress={handleGuardar}
            disabled={hayErrores || !hayCambios || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.guardarTexto}>Guardar cambios</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {pendienteRecorte && (
        <RecortadorFoto
          uri={pendienteRecorte.uri}
          anchoNatural={pendienteRecorte.ancho}
          altoNatural={pendienteRecorte.alto}
          onConfirmar={(dataUri) => {
            setFotoPerfil(dataUri);
            setPendienteRecorte(null);
          }}
          onCancelar={() => setPendienteRecorte(null)}
        />
      )}
    </SafeAreaView>
  );
}

interface CampoProps {
  label: string;
  valor: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  contador?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'url';
}

function Campo({
  label, valor, onChange, error, placeholder, maxLength, multiline, contador, autoCapitalize, keyboardType,
}: CampoProps) {
  return (
    <View style={campoStyles.wrapper}>
      <Text style={campoStyles.label}>{label}</Text>
      <TextInput
        style={[campoStyles.input, multiline && campoStyles.inputMultiline, error && campoStyles.inputError]}
        value={valor}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.grayMid}
        maxLength={maxLength}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
      />
      {contador && <Text style={campoStyles.contador}>{contador}</Text>}
      {error && <Text style={campoStyles.error}>{error}</Text>}
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
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  fotoSeccion: { alignItems: 'center', paddingVertical: spacing.md },
  fotoWrapper: { position: 'relative' },
  foto: { width: 96, height: 96, borderRadius: borderRadius.full },
  fotoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iniciales: { ...typography.heading1, color: colors.white },
  fotoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  fotoHint: { ...typography.caption, color: colors.grayMid, marginTop: spacing.sm },
  guardarBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
    ...shadows.sm,
  },
  guardarBtnDisabled: { backgroundColor: colors.grayMid },
  guardarTexto: { ...typography.button, color: colors.white },
});

const campoStyles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { ...typography.label, color: colors.text.primary },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
    ...typography.body,
    color: colors.text.primary,
  },
  inputMultiline: { height: 100, textAlignVertical: 'top' },
  inputError: { borderColor: colors.error },
  contador: { ...typography.caption, color: colors.grayMid, textAlign: 'right' },
  error: { ...typography.caption, color: colors.error },
});
