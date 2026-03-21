import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';

interface RandomPickerProps {
  items: string[];
  onPick?: (item: string) => void;
  title?: string;
}

export function RandomPicker({ items, onPick, title = 'اختر عشوائياً' }: RandomPickerProps) {
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
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <Pressable
        onPress={handleSpin}
        disabled={isSpinning || items.length === 0}
        style={({ pressed }) => [
          styles.diceButton,
          (pressed && !isSpinning) && styles.pressed,
          (isSpinning || items.length === 0) && styles.disabled,
        ]}
      >
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <MaterialIcons name="casino" size={64} color={colors.surface} />
        </Animated.View>
      </Pressable>

      {selectedItem && !isSpinning && (
        <View style={styles.result}>
          <MaterialIcons name="star" size={24} color={colors.secondary} />
          <Text style={styles.resultText}>{selectedItem}</Text>
        </View>
      )}

      {items.length === 0 && (
        <Text style={styles.emptyText}>لا يوجد عناصر للاختيار</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  diceButton: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  disabled: {
    opacity: 0.5,
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  resultText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.textLight,
  },
});
