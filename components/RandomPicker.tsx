import React, { useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface RandomPickerProps {
  items: string[];
  onPick?: (item: string) => void;
  title?: string;
}

export function RandomPicker({ items, onPick, title = 'اختر عشوائياً' }: RandomPickerProps) {
  const { colors, shadows } = useTheme();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinAnim] = useState(new Animated.Value(0));

  const handleSpin = () => {
    if (items.length === 0 || isSpinning) return;

    setIsSpinning(true);
    spinAnim.setValue(0);

    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      const randomIndex = Math.floor(Math.random() * items.length);
      const picked = items[randomIndex];
      setSelectedItem(picked);
      setIsSpinning(false);
      onPick?.(picked);
    });
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1080deg'],
  });

  return (
    <View style={{ alignItems: 'center', padding: spacing.lg }}>
      <Text style={{
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.semibold,
        color: colors.text,
        marginBottom: spacing.md,
      }}>{title}</Text>

      <Pressable
        onPress={handleSpin}
        disabled={isSpinning || items.length === 0}
        style={({ pressed }) => [{
          width: 120,
          height: 120,
          borderRadius: borderRadius.round,
          backgroundColor: colors.dice,
          justifyContent: 'center',
          alignItems: 'center',
          ...shadows.lg,
        },
        (pressed && !isSpinning) && { opacity: 0.8, transform: [{ scale: 0.95 }] },
        (isSpinning || items.length === 0) && { opacity: 0.5 },
        ]}
      >
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <MaterialIcons name="casino" size={64} color="#FFFFFF" />
        </Animated.View>
      </Pressable>

      {selectedItem && !isSpinning && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: spacing.lg,
          backgroundColor: colors.surfaceLight,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderRadius: borderRadius.lg,
        }}>
          <MaterialIcons name="star" size={24} color={colors.secondary} />
          <Text style={{
            fontSize: typography.sizes.xl,
            fontWeight: typography.weights.bold,
            color: colors.text,
            marginStart: spacing.sm,
          }}>{selectedItem}</Text>
        </View>
      )}

      {items.length === 0 && (
        <Text style={{
          marginTop: spacing.md,
          fontSize: typography.sizes.sm,
          color: colors.textLight,
        }}>لا يوجد عناصر للاختيار</Text>
      )}
    </View>
  );
}
