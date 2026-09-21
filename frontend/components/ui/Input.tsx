import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View, type ViewStyle } from 'react-native';
import { borderRadius } from '@/theme/borderRadius';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  rightElement?: React.ReactNode;
}

export function Input({
  label,
  error,
  containerStyle,
  style,
  rightElement,
  secureTextEntry,
  value,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  // HOTFIX (teclado Samsung): antes este componente reimplementaba el enmascarado a mano
  // (un estado `displayValue` con puntos + un `realValue` reconstruido letra a letra en cada
  // pulsación) y mantenía el TextInput completamente controlado. Eso forzaba un re-render de
  // React que reescribía `value` en cada tecla — justo la ventana en la que el motor de
  // predicción/composición de los teclados Samsung entra en carrera con React Native y acaba
  // registrando la misma pulsación dos veces. Un intento anterior de arreglarlo solo con props
  // (autoCorrect, textContentType...) no fue suficiente porque no tocaba esta causa real.
  //
  // El fix: los campos de contraseña se dejan sin controlar (defaultValue en vez de value).
  // El enmascarado — incluido el "parpadeo" del último carácter tecleado — lo hace el propio
  // secureTextEntry nativo del sistema operativo, sin que React reescriba el texto en cada
  // pulsación. `onChangeText` se sigue llamando con normalidad en cada cambio (para validación,
  // comprobar que las contraseñas coinciden, etc.), solo dejamos de retroalimentar `value`.
  // Se captura si el campo nace como campo de contraseña una sola vez: si `secureTextEntry`
  // cambia después (el ojo de mostrar/ocultar), no debe alternar entre controlado y no
  // controlado, solo cambiar el enmascarado nativo.
  const esCampoContraseña = useRef(!!secureTextEntry).current;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputRow,
        focused && styles.inputFocused,
        !!error && styles.inputError,
      ]}>
        <TextInput
          style={[styles.input, rightElement ? styles.inputWithRight : null, style]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={colors.grayMid}
          {...props}
          {...(esCampoContraseña
            ? { defaultValue: typeof value === 'string' ? value : undefined }
            : { value: typeof value === 'string' ? value : undefined })}
          autoCorrect={secureTextEntry ? false : props.autoCorrect}
          autoCapitalize={secureTextEntry ? 'none' : props.autoCapitalize}
          spellCheck={secureTextEntry ? false : props.spellCheck}
          textContentType={secureTextEntry ? 'password' : props.textContentType}
          importantForAutofill={secureTextEntry ? 'no' : props.importantForAutofill}
          secureTextEntry={!!secureTextEntry}
        />
        {rightElement && (
          <View style={styles.rightElement}>{rightElement}</View>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.text.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
    paddingVertical: spacing.md,
  },
  inputWithRight: {
    paddingRight: spacing.sm,
  },
  rightElement: {
    paddingLeft: spacing.sm,
    justifyContent: 'center',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
  },
});
