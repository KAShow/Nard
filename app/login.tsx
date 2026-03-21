import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { useAlert } from '@/template';

type ViewMode = 'initial' | 'login' | 'signup';

export default function LoginScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { signInWithPassword, signUpWithPassword, operationLoading } = useAuth();
  const router = useRouter();
  const { showAlert } = useAlert();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('تنبيه', 'الرجاء إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    const { error } = await signInWithPassword(email.trim(), password);
    if (error) {
      showAlert('خطأ', error);
      return;
    }

    router.replace('/(tabs)');
  };

  const handleSignup = async () => {
    if (!email.trim()) {
      showAlert('تنبيه', 'الرجاء إدخال البريد الإلكتروني');
      return;
    }

    if (!password.trim() || password.length < 6) {
      showAlert('تنبيه', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('تنبيه', 'كلمات المرور غير متطابقة');
      return;
    }

    const { error, user } = await signUpWithPassword(email.trim(), password);
    if (error) {
      showAlert('خطأ', error);
      return;
    }

    showAlert('مرحباً!', 'تم إنشاء حسابك بنجاح');
    router.replace('/(tabs)');
  };

  if (viewMode === 'initial') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <MaterialIcons name="casino" size={80} color={colors.primary} />
            <Text style={styles.title}>نرد</Text>
            <Text style={styles.subtitle}>منظم جلسات الألعاب اللوحية</Text>
          </View>

          <View style={styles.buttonGroup}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => setViewMode('login')}
            >
              <Text style={styles.buttonText}>تسجيل الدخول</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.buttonSecondary,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => setViewMode('signup')}
            >
              <Text style={styles.buttonSecondaryText}>إنشاء حساب جديد</Text>
            </Pressable>
          </View>

          <View style={styles.features}>
            <FeatureItem icon="group" text="نظم جلساتك مع أصدقائك" />
            <FeatureItem icon="videogame-asset" text="شارك ألعابك المفضلة" />
            <FeatureItem icon="emoji-events" text="اجمع النقاط والألقاب" />
          </View>
        </View>
      </View>
    );
  }

  if (viewMode === 'login') {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <Pressable onPress={() => setViewMode('initial')} style={styles.backButton}>
            <MaterialIcons name="arrow-forward" size={24} color={colors.text} />
          </Pressable>

          <View style={styles.header}>
            <MaterialIcons name="casino" size={60} color={colors.primary} />
            <Text style={styles.title}>تسجيل الدخول</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={24} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="البريد الإلكتروني"
                placeholderTextColor={colors.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={24} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="كلمة المرور"
                placeholderTextColor={colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleLogin}
              disabled={operationLoading}
            >
              {operationLoading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.buttonText}>دخول</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (viewMode === 'signup') {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <Pressable onPress={() => setViewMode('initial')} style={styles.backButton}>
            <MaterialIcons name="arrow-forward" size={24} color={colors.text} />
          </Pressable>

          <View style={styles.header}>
            <MaterialIcons name="casino" size={60} color={colors.primary} />
            <Text style={styles.title}>إنشاء حساب</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={24} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="البريد الإلكتروني"
                placeholderTextColor={colors.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={24} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="كلمة المرور (6 أحرف على الأقل)"
                placeholderTextColor={colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={24} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="تأكيد كلمة المرور"
                placeholderTextColor={colors.textLight}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleSignup}
              disabled={operationLoading}
            >
              {operationLoading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.buttonText}>إنشاء الحساب</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }


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
  backButton: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.md,
    padding: spacing.sm,
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
    textAlign: 'center',
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
  buttonGroup: {
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.surface,
  },
  buttonSecondaryText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  linkText: {
    fontSize: typography.sizes.md,
    color: colors.accent,
    textDecorationLine: 'underline',
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
