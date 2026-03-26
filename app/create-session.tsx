import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform, I18nManager } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '@/hooks/useAuth';
import { useSessions } from '@/hooks/useSessions';
import { spacing, borderRadius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAlert } from '@/template';
import { getSupabaseClient } from '@/template';

const FUNNY_TITLES = [
  'معركة النرد الطاحنة',
  'ليلة الانتقام والمكر',
  'صراع العمالقة في نص الليل',
  'جلسة تكسير الرؤوس (بالمحبة)',
  'كش ملك.. أو النرد!',
  'جلسة الضحك والدموع',
  'تدمير الصداقات.. مرحباً!',
  'جلسة الخداع الاستراتيجي',
  'مين بيخسر اليوم؟',
];

export default function CreateSessionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { createSession } = useSessions();
  const { showAlert } = useAlert();
  const { colors, shadows } = useTheme();

  const [title, setTitle] = useState(() => FUNNY_TITLES[Math.floor(Math.random() * FUNNY_TITLES.length)]);
  const [dateObj, setDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState<'بيت البصري' | 'جراسياس'>('بيت البصري');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [generatingTitle, setGeneratingTitle] = useState(false);

  const requiredFields = { title };
  const filledCount = Object.values(requiredFields).filter(v => v.trim()).length;
  // Location, Time, Date are always valid now
  const progressPercent = (filledCount / 1) * 100;

  const markTouched = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const isFieldInvalid = (field: string, value: string) => {
    return touched[field] && !value.trim();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateObj(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setDateObj(selectedTime);
    }
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const generateAITitle = async () => {
    setGeneratingTitle(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.functions.invoke('generate-funny-title');
      
      if (error) {
        showAlert('خطأ', 'فشل توليد العنوان');
        return;
      }
      
      if (data?.title) {
        setTitle(data.title);
      }
    } catch (error: any) {
      showAlert('خطأ', error.message || 'فشل توليد العنوان');
    } finally {
      setGeneratingTitle(false);
    }
  };

  const handleCreate = async () => {
    if (!user) return;

    if (!title.trim()) {
      setTouched({ title: true });
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
      description: '', 
      date: formatDate(dateObj),
      time: formatTime(dateObj),
      location: location,
      maxPlayers,
      status: 'upcoming',
    });

    showAlert('نجاح', 'تم إنشاء الجلسة بنجاح');
    router.back();
  };

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
    label, value, onChangeText, placeholder, field, icon, editable = true, onPress
  }: any) => {
    const invalid = isFieldInvalid(field, value);
    
    const InnerInput = (
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
          alignItems: 'center',
          backgroundColor: editable ? colors.surface : colors.surfaceLight,
          borderRadius: borderRadius.md,
          borderWidth: 1.5,
          borderColor: invalid ? colors.error : (value ? colors.primary + '50' : colors.border),
          paddingHorizontal: spacing.md,
          minHeight: 52,
          ...shadows.sm,
        }}>
          {icon && (
            <MaterialIcons 
              name={icon} 
              size={20} 
              color={invalid ? colors.error : (value && editable ? colors.primary : colors.textLight)} 
              style={{ marginEnd: spacing.sm }} 
            />
          )}
          <TextInput
            style={{
              flex: 1,
              fontSize: typography.sizes.md,
              color: editable ? colors.text : colors.textSecondary,
              textAlign: I18nManager.isRTL ? 'right' : 'right',
              paddingVertical: spacing.md,
            }}
            placeholder={placeholder}
            placeholderTextColor={colors.textLight}
            value={value}
            onChangeText={onChangeText}
            onBlur={() => markTouched(field)}
            editable={editable}
            pointerEvents={editable ? 'auto' : 'none'}
          />
          {value.trim() !== '' && editable && !invalid && (
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

    if (onPress) {
      return (
        <Pressable onPress={onPress}>
          {InnerInput}
        </Pressable>
      );
    }

    return InnerInput;
  };

  const LocationRadioOption = ({ title, selected }: { title: 'بيت البصري' | 'جراسياس', selected: boolean }) => (
    <Pressable
      onPress={() => setLocation(title)}
      style={({ pressed }) => [{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? colors.primary + '15' : colors.surface,
        borderWidth: 1.5,
        borderColor: selected ? colors.primary : colors.border,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        ...shadows.sm,
      }, pressed && { opacity: 0.8 }]}
    >
      <MaterialIcons 
        name={selected ? "radio-button-checked" : "radio-button-unchecked"} 
        size={20} 
        color={selected ? colors.primary : colors.textLight} 
        style={{ marginEnd: spacing.sm }}
      />
      <Text style={{
        fontSize: typography.sizes.md,
        fontWeight: selected ? typography.weights.bold : typography.weights.medium,
        color: selected ? colors.primaryDark : colors.text,
      }}>
        {title}
      </Text>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {showDatePicker && (
        <DateTimePicker
          value={dateObj}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
      
      {showTimePicker && (
        <DateTimePicker
          value={dateObj}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}

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

        <View style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: typography.sizes.sm,
                fontWeight: typography.weights.semibold,
                color: isFieldInvalid('title', title) ? colors.error : colors.textSecondary,
                marginBottom: spacing.xs,
                textAlign: 'right',
              }}>
                عنوان الجلسة *
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: borderRadius.md,
                borderWidth: 1.5,
                borderColor: isFieldInvalid('title', title) ? colors.error : (title ? colors.primary + '50' : colors.border),
                paddingHorizontal: spacing.md,
                minHeight: 52,
                ...shadows.sm,
              }}>
                <MaterialIcons 
                  name="title" 
                  size={20} 
                  color={isFieldInvalid('title', title) ? colors.error : (title ? colors.primary : colors.textLight)} 
                  style={{ marginEnd: spacing.sm }} 
                />
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: typography.sizes.md,
                    color: colors.text,
                    textAlign: I18nManager.isRTL ? 'right' : 'right',
                    paddingVertical: spacing.md,
                  }}
                  placeholder="مثال: جلسة استراتيجية مسائية"
                  placeholderTextColor={colors.textLight}
                  value={title}
                  onChangeText={setTitle}
                  onBlur={() => markTouched('title')}
                />
                {title.trim() !== '' && !isFieldInvalid('title', title) && (
                  <MaterialIcons name="check-circle" size={18} color={colors.success} style={{ marginStart: spacing.sm }} />
                )}
              </View>
              {isFieldInvalid('title', title) && (
                <Text style={{ fontSize: typography.sizes.xs, color: colors.error, marginTop: spacing.xs, textAlign: 'right' }}>
                  هذا الحقل مطلوب
                </Text>
              )}
            </View>
            
            <Pressable
              onPress={generateAITitle}
              disabled={generatingTitle}
              style={({ pressed }) => ({
                width: 52,
                height: 52,
                borderRadius: borderRadius.md,
                backgroundColor: generatingTitle ? colors.surfaceLight : colors.accent + '15',
                borderWidth: 1.5,
                borderColor: generatingTitle ? colors.border : colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
                ...shadows.sm,
              })}
            >
              <MaterialIcons 
                name={generatingTitle ? "hourglass-empty" : "auto-awesome"} 
                size={24} 
                color={generatingTitle ? colors.textLight : colors.accent} 
              />
            </Pressable>
          </View>
        </View>

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
              value={formatDate(dateObj)} 
              icon="calendar-today"
              editable={false}
              onPress={() => setShowDatePicker(true)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <CustomInput 
              label="الوقت *" 
              field="time" 
              value={formatTime(dateObj)} 
              icon="access-time"
              editable={false}
              onPress={() => setShowTimePicker(true)}
            />
          </View>
        </View>

        <View style={{ marginBottom: spacing.md }}>
          <Text style={{
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.semibold,
            color: colors.textSecondary,
            marginBottom: spacing.sm,
            textAlign: 'right',
          }}>
            المكان *
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <LocationRadioOption title="بيت البصري" selected={location === 'بيت البصري'} />
            <LocationRadioOption title="جراسياس" selected={location === 'جراسياس'} />
          </View>
        </View>

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
