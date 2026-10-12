import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';

interface Props {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
  tone?: 'paper' | 'primary';
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel: string;
}

export function IconButton({
  icon,
  onPress,
  disabled,
  size = 48,
  tone = 'paper',
  style,
  testID,
  accessibilityLabel,
}: Props) {
  const c = useColors();
  const bg = tone === 'primary' ? c.primary : c.paper;
  const fg = tone === 'primary' ? c.primaryForeground : c.ink;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [
        styles.btn,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderColor: c.border,
          shadowColor: c.shadow,
          opacity: disabled ? 0.35 : 1,
          transform: [{ scale: pressed ? 0.9 : 1 }],
        },
        style,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={size * 0.5} color={fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 2,
  },
});
