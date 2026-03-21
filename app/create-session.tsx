import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useSessions } from '@/hooks/useSessions';
import { spacing, borderRadius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAlert } from '@/template';

export default function CreateSessionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { createSession } = useSessions();
  const { showAlert } = useAlert();
  const { colors, shadows } = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const requiredFields = { title, date, time, location };
  const filledCount = Object.values(requiredFields).filter(v => v.trim()).length;
  const totalRequired = Object.keys(requiredFields).length;
  const progressPercent = (filledCount / totalRequired) * 100;

  const markTouched = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const isFieldInvalid = (field: string, value: string) => {
    return touched[field] && !value.trim();
  };

  const handleCreate = async () => {
    if (!user) return;

    if (!title.trim() || !date.trim() || !time.trim() || !location.trim()) {
      setTouched({ title: true, date: true, time: true, location: true });
      showAlert('تنبيه', 'الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    if (maxPlayers < 2) {
      showAlert('تنبيه', 'عدد اللاعبين يجب أن يكون 2 على الأقل');
      return;
    }

    await createSession({
      hostId: user.id,
      hostName: user.name,
      title: title.trim(),
      description: description.trim(),
      date: date.trim(),
      time: time.trim(),
      location: location.trim(),
      locationUrl: locationUrl.trim() || undefined,
      maxPlayers,
      status: 'upcoming',
    });

    showAlert('نجح', 'تم إنشاء الجلسة بنجاح');
    router.back();
  };

  const inputStyle = (invalid: boolean) => ({
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.sizes.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: invalid ? colors.error : colors.border,
    textAlign: 'right' as const,
    ...shadows.sm,
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {/* Progress Bar */}
      <View style={{
        height: 3,
        backgroundColor: colors.divider,
      }}>
        <View style={{
          height: 3,
          width: `${progressPercent}%`,
          backgroundColor: progressPercent === 100 ? colors.success : colors.primary,
          borderRadius: 2,
        }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + spacing.lg }}
      >
        {/* Section: معلومات الجلسة */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.md,
          gap: spacing.xs,
        }}>
          <View style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.primary + '15',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MaterialIcons name="info-outline" size={16} color={colors.primary} />
          </View>
          <Text style={{
            fontSize: typography.sizes.md,
            fontWeight: typography.weights.semibold,
            color: colors.text,
          }}>معلومات الجلسة</Text>
        </View>

        <View style={{ marginBottom: spacing.md }}>
          <Text style={{
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.semibold,
            color: colors.text,
            marginBottom: spacing.xs,
          }}>عنوان الجلسة *</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={[inputStyle(isFieldInvalid('title', title)), { flex: 1 }]}
              placeholder="مثال: جلسة استراتيجية مسائية"
              placeholderTextColor={colors.textLight}
              value={title}
              onChangeText={setTitle}
              onBlur={() => markTouched('title')}
            />
            {title.trim() && (
              <MaterialIcons name="check-circle" size={20} color={colors.success} style={{ position: 'absolute', left: spacing.sm }} />
            )}
          </View>
          {isFieldInvalid('title', title) && (
            <Text style={{ fontSize: typography.sizes.xs, color: colors.error, marginTop: spacing.xs }}>مطلوب</Text>
          )}
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.semibold,
            color: colors.text,
            marginBottom: spacing.xs,
          }}>الوصف</Text>
          <TextInput
            style={[inputStyle(false), { minHeight: 80, textAlignVertical: 'top' }]}
            placeholder="وصف الجلسة والألعاب المتوقعة"
            placeholderTextColor={colors.textLight}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Section: الوقت والمكان */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.md,
          gap: spacing.xs,
        }}>
          <View style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.accent + '15',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MaterialIcons name="place" size={16} color={colors.accent} />
          </View>
          <Text style={{
            fontSize: typography.sizes.md,
            fontWeight: typography.weights.semibold,
            color: colors.text,
          }}>الوقت والمكان</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.semibold,
              color: colors.text,
              marginBottom: spacing.xs,
            }}>التاريخ *</Text>
            <TextInput
              style={inputStyle(isFieldInvalid('date', date))}
              placeholder="2026-03-25"
              placeholderTextColor={colors.textLight}
              value={date}
              onChangeText={setDate}
              onBlur={() => markTouched('date')}
            />
            {isFieldInvalid('date', date) && (
              <Text style={{ fontSize: typography.sizes.xs, color: colors.error, marginTop: spacing.xs }}>مطلوب</Text>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.semibold,
              color: colors.text,
              marginBottom: spacing.xs,
            }}>الوقت *</Text>
            <TextInput
              style={inputStyle(isFieldInvalid('time', time))}
              placeholder="7:00 مساءً"
              placeholderTextColor={colors.textLight}
              value={time}
              onChangeText={setTime}
              onBlur={() => markTouched('time')}
            />
            {isFieldInvalid('time', time) && (
              <Text style={{ fontSize: typography.sizes.xs, color: colors.error, marginTop: spacing.xs }}>مطلوب</Text>
            )}
          </View>
        </View>

        <View style={{ marginBottom: spacing.md }}>
          <Text style={{
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.semibold,
            color: colors.text,
            marginBottom: spacing.xs,
          }}>المكان *</Text>
          <TextInput
            style={inputStyle(isFieldInvalid('location', location))}
            placeholder="مثال: مقهى اللعبة، الرياض"
            placeholderTextColor={colors.textLight}
            value={location}
            onChangeText={setLocation}
            onBlur={() => markTouched('location')}
          />
          {isFieldInvalid('location', location) && (
            <Text style={{ fontSize: typography.sizes.xs, color: colors.error, marginTop: spacing.xs }}>مطلوب</Text>
          )}
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.semibold,
            color: colors.text,
            marginBottom: spacing.xs,
          }}>رابط الموقع (اختياري)</Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm + 2,
            borderWidth: 1,
            borderColor: colors.border,
            ...shadows.sm,
          }}>
            <MaterialIcons name="link" size={20} color={colors.textSecondary} />
            <TextInput
              style={{
                flex: 1,
                fontSize: typography.sizes.md,
                color: colors.text,
                marginStart: spacing.sm,
                textAlign: 'right',
              }}
              placeholder="رابط خرائط جوجل"
              placeholderTextColor={colors.textLight}
              value={locationUrl}
              onChangeText={setLocationUrl}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Section: الإعدادات */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.md,
          gap: spacing.xs,
        }}>
          <View style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.secondary + '20',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MaterialIcons name="settings" size={16} color={colors.secondaryDark} />
          </View>
          <Text style={{
            fontSize: typography.sizes.md,
            fontWeight: typography.weights.semibold,
            color: colors.text,
          }}>الإعدادات</Text>
        </View>

        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.semibold,
            color: colors.text,
            marginBottom: spacing.sm,
          }}>الحد الأقصى للاعبين *</Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.lg,
          }}>
            <Pressable
              onPress={() => setMaxPlayers(prev => Math.max(2, prev - 1))}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: maxPlayers <= 2 ? colors.surfaceLight : colors.primary + '15',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: maxPlayers <= 2 ? colors.border : colors.primary,
                opacity: pressed ? 0.7 : 1,
              })}
              disabled={maxPlayers <= 2}
            >
              <MaterialIcons name="remove" size={24} color={maxPlayers <= 2 ? colors.textLight : colors.primary} />
            </Pressable>

            <View style={{
              minWidth: 60,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.lg,
              borderRadius: borderRadius.md,
              ...shadows.sm,
            }}>
              <Text style={{
                fontSize: typography.sizes.xxl,
                fontWeight: typography.weights.bold,
                color: colors.text,
              }}>{maxPlayers}</Text>
            </View>

            <Pressable
              onPress={() => setMaxPlayers(prev => Math.min(20, prev + 1))}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: maxPlayers >= 20 ? colors.surfaceLight : colors.primary + '15',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: maxPlayers >= 20 ? colors.border : colors.primary,
                opacity: pressed ? 0.7 : 1,
              })}
              disabled={maxPlayers >= 20}
            >
              <MaterialIcons name="add" size={24} color={maxPlayers >= 20 ? colors.textLight : colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          style={({ pressed }) => [{
            flexDirection: 'row',
            backgroundColor: colors.primary,
            paddingVertical: spacing.md + 2,
            paddingHorizontal: spacing.lg,
            borderRadius: borderRadius.lg,
            alignItems: 'center',
            justifyContent: 'center',
            ...shadows.md,
          }, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
          onPress={handleCreate}
        >
          <MaterialIcons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={{
            fontSize: typography.sizes.lg,
            fontWeight: typography.weights.bold,
            color: '#FFFFFF',
            marginStart: spacing.sm,
          }}>إنشاء الجلسة</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
