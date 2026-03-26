import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface GameWheelProps {
  games: string[];
  onResult: (game: string) => void;
}

export function GameWheel({ games, onResult }: GameWheelProps) {
  const { colors, shadows } = useTheme();
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const spinValue = useRef(new Animated.Value(0)).current;

  const handleSpin = () => {
    if (isSpinning || games.length === 0) return;

    setIsSpinning(true);
    setSelectedGame(null);

    // Random game selection
    const randomIndex = Math.floor(Math.random() * games.length);
    const selectedGame = games[randomIndex];

    // Spin animation
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: true,
    }).start(() => {
      setSelectedGame(selectedGame);
      setIsSpinning(false);
      onResult(selectedGame);
    });
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1440deg'], // 4 full rotations
  });

  if (games.length === 0) {
    return (
      <View style={{
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        alignItems: 'center',
      }}>
        <MaterialIcons name="info-outline" size={48} color={colors.textLight} />
        <Text style={{
          fontSize: typography.sizes.md,
          color: colors.textSecondary,
          marginTop: spacing.md,
          textAlign: 'center',
        }}>
          لا توجد ألعاب متاحة
        </Text>
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Wheel */}
      <View style={{
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: colors.surface,
        borderWidth: 8,
        borderColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
        ...shadows.xl,
      }}>
        <Animated.View style={{
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: colors.primaryLight + '20',
          borderWidth: 4,
          borderColor: colors.primary + '50',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ rotate: spin }],
        }}>
          <MaterialIcons 
            name="casino" 
            size={80} 
            color={isSpinning ? colors.primary : colors.primaryDark} 
          />
        </Animated.View>
      </View>

      {/* Pointer */}
      <View style={{
        position: 'absolute',
        top: -10,
        left: '50%',
        marginLeft: -15,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.lg,
      }}>
        <MaterialIcons name="arrow-drop-down" size={24} color={colors.surface} />
      </View>

      {/* Result */}
      {selectedGame && !isSpinning && (
        <View style={{
          backgroundColor: colors.success + '15',
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          marginBottom: spacing.md,
          borderWidth: 2,
          borderColor: colors.success,
          width: '100%',
        }}>
          <Text style={{
            fontSize: typography.sizes.sm,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: spacing.xs,
          }}>🎉 اللعبة المختارة</Text>
          <Text style={{
            fontSize: typography.sizes.xl,
            fontWeight: typography.weights.bold,
            color: colors.success,
            textAlign: 'center',
          }}>{selectedGame}</Text>
        </View>
      )}

      {/* Spin Button */}
      <Pressable
        style={({ pressed }) => [{
          flexDirection: 'row',
          backgroundColor: isSpinning ? colors.surfaceLight : colors.dice,
          paddingVertical: spacing.md + 2,
          paddingHorizontal: spacing.xl,
          borderRadius: borderRadius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.md,
        }, pressed && !isSpinning && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}
        onPress={handleSpin}
        disabled={isSpinning}
      >
        <MaterialIcons 
          name="refresh" 
          size={24} 
          color={isSpinning ? colors.textLight : '#FFFFFF'} 
        />
        <Text style={{
          fontSize: typography.sizes.lg,
          fontWeight: typography.weights.bold,
          color: isSpinning ? colors.textLight : '#FFFFFF',
          marginStart: spacing.sm,
        }}>
          {isSpinning ? 'جاري الاختيار...' : 'تدوير العجلة'}
        </Text>
      </Pressable>

      {/* Games List */}
      <View style={{
        marginTop: spacing.lg,
        width: '100%',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        ...shadows.sm,
      }}>
        <Text style={{
          fontSize: typography.sizes.sm,
          fontWeight: typography.weights.semibold,
          color: colors.textSecondary,
          marginBottom: spacing.sm,
        }}>الألعاب المتاحة ({games.length})</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {games.map((game, index) => (
            <View
              key={index}
              style={{
                backgroundColor: colors.background,
                borderRadius: borderRadius.sm,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderWidth: 1,
                borderColor: selectedGame === game ? colors.success : colors.border,
              }}
            >
              <Text style={{
                fontSize: typography.sizes.xs,
                color: selectedGame === game ? colors.success : colors.textSecondary,
                fontWeight: selectedGame === game ? typography.weights.bold : typography.weights.medium,
              }}>{game}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
