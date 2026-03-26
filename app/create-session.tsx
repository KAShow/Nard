import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform, I18nManager } from 'react-native';
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

    showAlert('نجاح', 'تم إنشاء الجلسة بنجاح');
    router.back();
  };

  // I18nManager.isRTL is true, so 'row' flows Right-to-Left. 
  // We place the Icon first so it appears on the Right.
  const SectionHeader = ({ icon, title, color, bgColor }: { icon: keyof typeof MaterialIcons.glyphMap, title: string, color: string, bgColor: string }) => (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
      marginTop: spacing.lg,
      gap: spacing.sm,
    }}>
      <View style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: bgColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <MaterialIcons name={icon} size={18} color={color} />
      </View>
      <Text style={{
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.bold,
        color: colors.text,
      }}>{title}</Text>
    </View>
  );

  const CustomInput = ({ 
    label, value, onChangeText, placeholder, field, multiline = false, icon, keyboardType = 'default' 
  }: any) => {
    const invalid = isFieldInvalid(field, value);
    return (
      <View style={{ marginBottom: spacing.md }}>
        <Text style={{
          fontSize: typography.sizes.sm,
          fontWeight: typography.weights.semibold,
          color: invalid ? colors.error : colors.textSecondary,
          marginBottom: spacing.xs,
          textAlign: 'right',
          width: '100%',
        }}>
          {label}
        </Text>
        <View style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          backgroundColor: colors.surface,
          borderRadius: borderRadius.md,
          borderWidth: 1.5,
          borderColor: invalid ? colors.error : (value ? colors.primary + '50' : colors.border),
          paddingHorizontal: spacing.md,
          minHeight: multiline ? 100 : 52,
          ...shadows.sm,
        }}>
          {icon && (
            <MaterialIcons 
              name={icon} 
              size={20} 
              color={invalid ? colors.error : (value ? colors.primary : colors.textLight)} 
              style={{ marginEnd: spacing.sm, marginTop: multiline ? spacing.md : 0 }} 
            />
          )}
          <TextInput
            style={{
              flex: 1,
              fontSize: typography.sizes.md,
              color: colors.text,
              textAlign: I18nManager.isRTL ? 'right' : 'right',
              paddingVertical: spacing.md,
              textAlignVertical: multiline ? 'top' : 'center',
            }}
            placeholder={placeholder}
            placeholderTextColor={colors.textLight}
            value={value}
            onChangeText={onChangeText}
            onBlur={() => markTouched(field)}
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
            keyboardType={keyboardType}
          />
          {value.trim() !== '' && !multiline && !invalid && (
             <MaterialIcons name="check-circle" size={18} color={colors.success} style={{ marginStart: spacing.sm }} />
          )}
        </View>
        {invalid && (
          <Text style={{ fontSize: typography.sizes.xs, color: colors.error, marginTop: spacing.xs, textAlign: 'right' }}>
            هذا الحقل مطلوب
          </Text>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {/* Progress Bar */}
      <View style={{ height: 4, backgroundColor: colors.divider }}>
        <View style={{
          height: 4,
          width: `${progressPercent}%`,
          backgroundColor: progressPercent === 100 ? colors.success : colors.primary,
          borderTopEndRadius: 2,
          borderBottomEndRadius: 2,
        }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader 
          icon="info-outline" 
          title="معلومات الجلسة" 
          color={colors.primary} 
          bgColor={colors.primary + '15'} 
        />

        <CustomInput 
          label="عنوان الجلسة *" 
          field="title" 
          value={title} 
          onChangeText={setTitle} 
          placeholder="مثال: جلسة استراتيجية مسائية"
          icon="title"
        />

        <CustomInput 
          label="الوصف" 
          field="description" 
          value={description} 
          onChangeText={setDescription} 
          placeholder="وصف الجلسة والألعاب المتوقعة..."
          multiline={true}
          icon="description"
        />

        <SectionHeader 
          icon="place" 
          title="الوقت والمكان" 
          color={colors.accent} 
          bgColor={colors.accent + '15'} 
        />

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <CustomInput 
              label="التاريخ *" 
              field="date" 
              value={date} 
              onChangeText={setDate} 
              placeholder="2026-03-25"
              icon="calendar-today"
            />
          </View>
          <View style={{ flex: 1 }}>
            <CustomInput 
              label="الوقت *" 
              field="time" 
              value={time} 
              onChangeText={setTime} 
              placeholder="7:00 مساءً"
              icon="access-time"
            />
          </View>
        </View>

        <CustomInput 
          label="المكان *" 
          field="location" 
          value={location} 
          onChangeText={setLocation} 
          placeholder="مثال: مقهى اللعبة، الرياض"
          icon="location-on"
        />

        <CustomInput 
          label="رابط الموقع (اختياري)" 
          field="locationUrl" 
          value={locationUrl} 
          onChangeText={setLocationUrl} 
          placeholder="رابط خرائط جوجل"
          icon="link"
          keyboardType="url"
        />

        <SectionHeader 
          icon="settings" 
          title="الإعدادات" 
          color={colors.secondaryDark} 
          bgColor={colors.secondary + '25'} 
        />

        <View style={{ marginBottom: spacing.xl, backgroundColor: colors.surface, padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, ...shadows.sm }}>
          <Text style={{
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.semibold,
            color: colors.textSecondary,
            marginBottom: spacing.md,
            textAlign: 'right',
          }}>الحد الأقصى للاعبين *</Text>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.xl,
          }}>
            {/* 1st Element in RTL row starts on RIGHT: This should be (+) */}
            <Pressable
              onPress={() => setMaxPlayers(prev => Math.min(20, prev + 1))}
              style={({ pressed }) => ({
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: maxPlayers >= 20 ? colors.surfaceLight : colors.primary + '15',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: maxPlayers >= 20 ? colors.border : colors.primary,
                opacity: pressed ? 0.7 : 1,
              })}
              disabled={maxPlayers >= 20}
            >
              <MaterialIcons name="add" size={26} color={maxPlayers >= 20 ? colors.textLight : colors.primary} />
            </Pressable>

            {/* 2nd Element: Number */}
            <View style={{
              width: 70,
              height: 60,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.background,
              borderRadius: borderRadius.md,
              borderWidth: 1,
              borderColor: colors.primary + '30',
            }}>
              <Text style={{
                fontSize: typography.sizes.hero,
                fontWeight: typography.weights.bold,
                color: colors.primaryDark,
              }}>{maxPlayers}</Text>
            </View>

            {/* 3rd Element: (-) on LEFT */}
            <Pressable
              onPress={() => setMaxPlayers(prev => Math.max(2, prev - 1))}
              style={({ pressed }) => ({
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: maxPlayers <= 2 ? colors.surfaceLight : colors.primary + '15',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: maxPlayers <= 2 ? colors.border : colors.primary,
                opacity: pressed ? 0.7 : 1,
              })}
              disabled={maxPlayers <= 2}
            >
              <MaterialIcons name="remove" size={26} color={maxPlayers <= 2 ? colors.textLight : colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          style={({ pressed }) => [{
            flexDirection: 'row',
            backgroundColor: progressPercent === 100 ? colors.primary : colors.primaryLight,
            paddingVertical: spacing.md + 4,
            paddingHorizontal: spacing.lg,
            borderRadius: borderRadius.lg,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.xxl,
            ...shadows.md,
          }, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
          onPress={handleCreate}
        >
          {/* In RTL, the first element goes to the right, followed by text. But we want Icon text -> or text icon? Let's just keep standard Icon then Text, which looks great universally if marginEnd is on Icon */}
          <MaterialIcons name="event-available" size={24} color="#FFFFFF" style={{ marginEnd: spacing.sm }} />
          <Text style={{
            fontSize: typography.sizes.lg,
            fontWeight: typography.weights.bold,
            color: '#FFFFFF',
          }}>إنشاء الجلسة</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
