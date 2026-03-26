import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { spacing, borderRadius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAlert } from '@/template';

type ViewMode = 'initial' | 'login' | 'signup';

export default function LoginScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const { colors, shadows } = useTheme();
  const { signInWithPassword, signUpWithPassword, operationLoading } = useAuth();
  const router = useRouter();
  const { showAlert } = useAlert();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('تنبيه', 'الرجاء إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    const { error } = await signInWithPassword(email.trim(), password.trim());
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

  const featureAccentColors = [colors.accent, colors.primary, colors.secondary];

  if (viewMode === 'initial') {
    return (
      <LinearGradient
        colors={[colors.background, colors.surfaceLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1 }}
      >
        <View style={{
          flex: 1,
          padding: spacing.lg,
          justifyContent: 'center',
        }}>
          {/* Header / Branding */}
          <View style={{ alignItems: 'center', marginBottom: spacing.xxl + 8 }}>
            <View style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.lg,
              ...shadows.lg,
            }}>
              <MaterialIcons name="casino" size={64} color={colors.primary} />
            </View>
            <Text style={{
              fontSize: typography.sizes.hero + 8,
              fontWeight: typography.weights.bold,
              color: colors.text,
              marginTop: spacing.sm,
            }}>نرد</Text>
            <Text style={{
              fontSize: typography.sizes.lg,
              color: colors.textSecondary,
              marginTop: spacing.xs,
              textAlign: 'center',
            }}>منظم جلسات الألعاب اللوحية</Text>
          </View>

          {/* Buttons */}
          <View style={{ marginBottom: spacing.xxl }}>
            <Pressable
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  paddingVertical: spacing.md + 4,
                  paddingHorizontal: spacing.lg,
                  borderRadius: borderRadius.lg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.md,
                  ...shadows.md,
                },
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
              onPress={() => setViewMode('login')}
            >
              <Text style={{
                fontSize: typography.sizes.lg,
                fontWeight: typography.weights.bold,
                color: colors.surface,
              }}>تسجيل الدخول</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                {
                  backgroundColor: colors.surface,
                  borderWidth: 2,
                  borderColor: colors.primary,
                  paddingVertical: spacing.md + 2,
                  paddingHorizontal: spacing.lg,
                  borderRadius: borderRadius.lg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...shadows.sm,
                },
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
              onPress={() => setViewMode('signup')}
            >
              <Text style={{
                fontSize: typography.sizes.lg,
                fontWeight: typography.weights.bold,
                color: colors.primary,
              }}>إنشاء حساب جديد</Text>
            </Pressable>
          </View>

          {/* Feature Items */}
          <View style={{ gap: spacing.md }}>
            {[
              { icon: 'group' as const, text: 'نظم جلساتك مع أصدقائك' },
              { icon: 'videogame-asset' as const, text: 'شارك ألعابك المفضلة' },
              { icon: 'emoji-events' as const, text: 'اجمع النقاط والألقاب' },
            ].map((feature, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  paddingVertical: spacing.lg,
                  paddingHorizontal: spacing.lg,
                  borderRadius: borderRadius.lg,
                  borderStartWidth: 5,
                  borderStartColor: featureAccentColors[index],
                  ...shadows.md,
                }}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: featureAccentColors[index] + '18',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <MaterialIcons name={feature.icon} size={26} color={featureAccentColors[index]} />
                </View>
                <Text style={{
                  fontSize: typography.sizes.lg,
                  fontWeight: typography.weights.medium,
                  color: colors.text,
                  marginStart: spacing.md,
                  flex: 1,
                }}>
                  {feature.text}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (viewMode === 'login') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={[colors.background, colors.surfaceLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1 }}
        >
          <View style={{
            flex: 1,
            padding: spacing.lg,
            justifyContent: 'center',
          }}>
            {/* Back Button */}
            <Pressable
              onPress={() => { setViewMode('initial'); setEmailFocused(false); setPasswordFocused(false); }}
              style={{
                position: 'absolute',
                top: spacing.xxl,
                end: spacing.md,
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                ...shadows.md,
              }}
            >
              <MaterialIcons name="arrow-forward" size={24} color={colors.text} />
            </Pressable>

            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: spacing.xxl }}>
              <View style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.md,
                ...shadows.md,
              }}>
                <MaterialIcons name="casino" size={48} color={colors.primary} />
              </View>
              <Text style={{
                fontSize: typography.sizes.hero,
                fontWeight: typography.weights.bold,
                color: colors.text,
                marginTop: spacing.sm,
              }}>تسجيل الدخول</Text>
            </View>

            {/* Form */}
            <View style={{ marginBottom: spacing.xl }}>
              {/* Email Input */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                marginBottom: spacing.md,
                borderWidth: emailFocused ? 2 : 1,
                borderColor: emailFocused ? colors.primary : colors.border,
                ...shadows.sm,
              }}>
                <MaterialIcons name="email" size={24} color={emailFocused ? colors.primary : colors.textSecondary} />
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: typography.sizes.md,
                    color: colors.text,
                    marginStart: spacing.sm,
                    textAlign: 'right',
                    paddingVertical: spacing.xs,
                  }}
                  placeholder="البريد الإلكتروني"
                  placeholderTextColor={colors.textLight}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>

              {/* Password Input */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                marginBottom: spacing.lg,
                borderWidth: passwordFocused ? 2 : 1,
                borderColor: passwordFocused ? colors.primary : colors.border,
                ...shadows.sm,
              }}>
                <MaterialIcons name="lock" size={24} color={passwordFocused ? colors.primary : colors.textSecondary} />
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: typography.sizes.md,
                    color: colors.text,
                    marginStart: spacing.sm,
                    textAlign: 'right',
                    paddingVertical: spacing.xs,
                  }}
                  placeholder="كلمة المرور"
                  placeholderTextColor={colors.textLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
              </View>

              {/* Login Button */}
              <Pressable
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.primary,
                    paddingVertical: spacing.md + 4,
                    paddingHorizontal: spacing.lg,
                    borderRadius: borderRadius.lg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...shadows.md,
                  },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
                onPress={handleLogin}
                disabled={operationLoading}
              >
                {operationLoading ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={{
                    fontSize: typography.sizes.lg,
                    fontWeight: typography.weights.bold,
                    color: colors.surface,
                  }}>دخول</Text>
                )}
              </Pressable>
            </View>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    );
  }

  if (viewMode === 'signup') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={[colors.background, colors.surfaceLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1 }}
        >
          <View style={{
            flex: 1,
            padding: spacing.lg,
            justifyContent: 'center',
          }}>
            {/* Back Button */}
            <Pressable
              onPress={() => { setViewMode('initial'); setEmailFocused(false); setPasswordFocused(false); setConfirmPasswordFocused(false); }}
              style={{
                position: 'absolute',
                top: spacing.xxl,
                end: spacing.md,
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                ...shadows.md,
              }}
            >
              <MaterialIcons name="arrow-forward" size={24} color={colors.text} />
            </Pressable>

            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: spacing.xxl }}>
              <View style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.md,
                ...shadows.md,
              }}>
                <MaterialIcons name="casino" size={48} color={colors.primary} />
              </View>
              <Text style={{
                fontSize: typography.sizes.hero,
                fontWeight: typography.weights.bold,
                color: colors.text,
                marginTop: spacing.sm,
              }}>إنشاء حساب</Text>
            </View>

            {/* Form */}
            <View style={{ marginBottom: spacing.xl }}>
              {/* Email Input */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                marginBottom: spacing.md,
                borderWidth: emailFocused ? 2 : 1,
                borderColor: emailFocused ? colors.primary : colors.border,
                ...shadows.sm,
              }}>
                <MaterialIcons name="email" size={24} color={emailFocused ? colors.primary : colors.textSecondary} />
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: typography.sizes.md,
                    color: colors.text,
                    marginStart: spacing.sm,
                    textAlign: 'right',
                    paddingVertical: spacing.xs,
                  }}
                  placeholder="البريد الإلكتروني"
                  placeholderTextColor={colors.textLight}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>

              {/* Password Input */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                marginBottom: spacing.md,
                borderWidth: passwordFocused ? 2 : 1,
                borderColor: passwordFocused ? colors.primary : colors.border,
                ...shadows.sm,
              }}>
                <MaterialIcons name="lock" size={24} color={passwordFocused ? colors.primary : colors.textSecondary} />
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: typography.sizes.md,
                    color: colors.text,
                    marginStart: spacing.sm,
                    textAlign: 'right',
                    paddingVertical: spacing.xs,
                  }}
                  placeholder="كلمة المرور (6 أحرف على الأقل)"
                  placeholderTextColor={colors.textLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
              </View>

              {/* Confirm Password Input */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                marginBottom: spacing.lg,
                borderWidth: confirmPasswordFocused ? 2 : 1,
                borderColor: confirmPasswordFocused ? colors.primary : colors.border,
                ...shadows.sm,
              }}>
                <MaterialIcons name="lock" size={24} color={confirmPasswordFocused ? colors.primary : colors.textSecondary} />
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: typography.sizes.md,
                    color: colors.text,
                    marginStart: spacing.sm,
                    textAlign: 'right',
                    paddingVertical: spacing.xs,
                  }}
                  placeholder="تأكيد كلمة المرور"
                  placeholderTextColor={colors.textLight}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                />
              </View>

              {/* Signup Button */}
              <Pressable
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.primary,
                    paddingVertical: spacing.md + 4,
                    paddingHorizontal: spacing.lg,
                    borderRadius: borderRadius.lg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...shadows.md,
                  },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
                onPress={handleSignup}
                disabled={operationLoading}
              >
                {operationLoading ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={{
                    fontSize: typography.sizes.lg,
                    fontWeight: typography.weights.bold,
                    color: colors.surface,
                  }}>إنشاء الحساب</Text>
                )}
              </Pressable>
            </View>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    );
  }
}
