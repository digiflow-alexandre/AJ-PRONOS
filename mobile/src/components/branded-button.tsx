import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Radius } from '@/constants/theme';
import { useThemeColors } from '@/lib/use-theme-colors';

type ButtonProps = {
  label: string;
  loadingLabel?: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'gold';
};

export function BrandedButton({
  label,
  loadingLabel,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}: ButtonProps) {
  const c = useThemeColors();
  const isDisabled = disabled || loading;
  const displayLabel = loading && loadingLabel ? loadingLabel : label;

  if (variant === 'ghost') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.base,
          { opacity: pressed || isDisabled ? 0.5 : 1 },
        ]}>
        <Text style={[styles.label, { color: c.text }]}>{displayLabel}</Text>
      </Pressable>
    );
  }

  if (variant === 'gold') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.base,
          {
            backgroundColor: c.gold,
            shadowColor: c.gold,
            shadowOpacity: 0.4,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 0 },
            elevation: 4,
            opacity: pressed || isDisabled ? 0.7 : 1,
          },
        ]}>
        <Text style={[styles.label, { color: '#0A0A0A' }]}>{displayLabel}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: c.ctaBg,
          opacity: pressed || isDisabled ? 0.7 : 1,
        },
      ]}>
      <Text style={[styles.label, { color: c.ctaText }]}>{displayLabel}</Text>
    </Pressable>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
  autoComplete?:
    | 'email'
    | 'password'
    | 'current-password'
    | 'new-password'
    | 'off';
  textContentType?:
    | 'emailAddress'
    | 'password'
    | 'newPassword'
    | 'username'
    | 'none';
};

export function BrandedField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete,
  textContentType,
}: FieldProps) {
  const c = useThemeColors();

  return (
    <View style={{ gap: 6 }}>
      <Text style={[fieldStyles.label, { color: c.textMuted }]}>
        {label.toUpperCase()}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textDim}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        textContentType={textContentType}
        autoCorrect={false}
        style={{
          height: 48,
          paddingHorizontal: 14,
          borderRadius: Radius.md,
          backgroundColor: c.bgElevated,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: c.borderSoft,
          color: c.text,
          fontSize: 16,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

const fieldStyles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
});
