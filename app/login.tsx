import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { useAlert } from '@/template';

export default function LoginScreen() {
  const [name, setName] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  const { showAlert } = useAlert();

  const handleLogin = async () => {
    if (!name.trim()) {
      showAlert('تنبيه', 'الرجاء إدخال اسمك');
      return;
    }

    await login(name.trim());
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialIcons name="casino" size={80} color={colors.primary} />
          <Text style={styles.title}>نرد</Text>
          <Text style={styles.subtitle}>منظم جلسات الألعاب اللوحية</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={24} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="أدخل اسمك"
              placeholderTextColor={colors.textLight}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleLogin}
          >
            <Text style={styles.buttonText}>ابدأ</Text>
            <MaterialIcons name="arrow-back" size={24} color={colors.surface} />
          </Pressable>

          <View style={styles.infoBox}>
            <MaterialIcons name="info" size={20} color={colors.accent} />
            <Text style={styles.infoText}>
              هذا تسجيل دخول تجريبي - لا تحتاج لكلمة مرور
            </Text>
          </View>
        </View>

        <View style={styles.features}>
          <FeatureItem icon="group" text="نظم جلساتك مع أصدقائك" />
          <FeatureItem icon="videogame-asset" text="شارك ألعابك المفضلة" />
          <FeatureItem icon="emoji-events" text="اجمع النقاط والألقاب" />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <MaterialIcons name={icon as any} size={24} color={colors.accent} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  form: {
    marginBottom: spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginLeft: spacing.sm,
    textAlign: 'right',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.surface,
    marginRight: spacing.sm,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  features: {
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  featureText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    marginLeft: spacing.sm,
  },
});
