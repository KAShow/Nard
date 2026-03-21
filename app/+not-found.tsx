import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, borderRadius, typography } from '@/constants/theme';

export default function NotFoundScreen() {
  const { colors, shadows } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
      }}>
        <View style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: colors.surfaceLight,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
        }}>
          <MaterialIcons name="explore-off" size={48} color={colors.textLight} />
        </View>

        <Text style={{
          fontSize: typography.sizes.title,
          fontWeight: typography.weights.bold,
          color: colors.text,
          marginBottom: spacing.sm,
        }}>الصفحة غير موجودة</Text>

        <Text style={{
          fontSize: typography.sizes.md,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: spacing.xxl,
          lineHeight: 24,
        }}>يبدو أن الصفحة التي تبحث عنها غير موجودة</Text>

        <Pressable
          style={({ pressed }) => [{
            backgroundColor: colors.primary,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.round,
            ...shadows.md,
          }, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
          onPress={() => router.push('/')}
        >
          <Text style={{
            color: '#FFFFFF',
            fontWeight: typography.weights.bold,
            fontSize: typography.sizes.md,
          }}>العودة للرئيسية</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
