import React, { useEffect, useRef, useState } from 'react';
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
  onChangeText,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const realValue = useRef<string>(typeof value === 'string' ? value : '');

  useEffect(() => {
    if (!secureTextEntry) return;
    const v = typeof value === 'string' ? value : '';
    if (v !== realValue.current) {
      realValue.current = v;
      setDisplayValue('●'.repeat(v.length));
    }
  }, [secureTextEntry, value]);

  const handleSecureChange = (text: string) => {
    const prev = displayValue;
    const delta = text.length - prev.length;

    if (delta > 0) {
      const newChars = text.slice(prev.length);
      realValue.current = realValue.current + newChars;
    } else if (delta < 0) {
      realValue.current = realValue.current.slice(0, realValue.current.length + delta);
    }

    const n = realValue.current.length;
    setDisplayValue(n === 0 ? '' : '●'.repeat(n - 1) + realValue.current[n - 1]);
    onChangeText?.(realValue.current);
  };

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
          value={secureTextEntry ? displayValue : (typeof value === 'string' ? value : undefined)}
          onChangeText={secureTextEntry ? handleSecureChange : onChangeText}
          // El campo nunca usa el secureTextEntry nativo (el enmascarado lo gestionamos
          // a mano arriba para poder mostrar el último carácter tecleado). Por eso hay que
          // decirle al teclado explícitamente que esto es una contraseña: si no, el
          // autocorrector/autocompletado de Android lo trata como texto normal y puede
          // insertar caracteres de más que sí acaban en realValue (bug real, no solo visual).
          autoCorrect={secureTextEntry ? false : props.autoCorrect}
          autoCapitalize={secureTextEntry ? 'none' : props.autoCapitalize}
          spellCheck={secureTextEntry ? false : props.spellCheck}
          textContentType={secureTextEntry ? 'password' : props.textContentType}
          importantForAutofill={secureTextEntry ? 'no' : props.importantForAutofill}
          secureTextEntry={false}
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
