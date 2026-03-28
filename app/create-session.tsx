import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateObj, setDateObj] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState<'بيت البصري' | 'جراسياس'>('بيت البصري');
  const [maxPlayers, setMaxPlayers] = useState(8);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // العنوان = تاريخ اليوم المختار تلقائياً
  const title = formatDate(dateObj);

  const handleDateChange = (event: { type: string }, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleTimeChange = (event: { type: string }, selectedTime?: Date) => {
    if (selectedTime) {
      setTempDate(selectedTime);
    }
  };

  const confirmDatePicker = () => {
    setDateObj(tempDate);
    setShowDatePicker(false);
  };

  const confirmTimePicker = () => {
    setDateObj(tempDate);
    setShowTimePicker(false);
  };

  const openDatePicker = () => {
    setTempDate(dateObj);
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    setTempDate(dateObj);
    setShowTimePicker(true);
  };

  const handleCreate = async () => {
    if (!user || isSubmitting) return;

    if (maxPlayers < 2) {
      showAlert('تنبيه', 'عدد اللاعبين يجب أن يكون 2 على الأقل');
      return;
    }

    setIsSubmitting(true);
    try {
      await createSession({
        hostId: user.id,
        hostName: user.name,
        title,
        description: '',
        date: formatDate(dateObj),
        time: formatTime(dateObj),
        location: location,
        maxPlayers,
        status: 'upcoming',
      });

      showAlert('نجاح', 'تم إنشاء الجلسة بنجاح');
      router.back();
    } catch (error) {
      showAlert('خطأ', 'فشل إنشاء الجلسة، حاول مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
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

  const PickerField = ({ label, value, icon, onPress }: { label: string, value: string, icon: keyof typeof MaterialIcons.glyphMap, onPress: () => void }) => (
    <Pressable onPress={onPress}>
      <View style={{ marginBottom: spacing.md }}>
        <Text style={{
          fontSize: typography.sizes.sm,
          fontWeight: typography.weights.semibold,
          color: colors.textSecondary,
          marginBottom: spacing.xs,
          textAlign: 'right',
          width: '100%',
        }}>
          {label}
        </Text>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceLight,
          borderRadius: borderRadius.md,
          borderWidth: 1.5,
          borderColor: colors.primary + '50',
          paddingHorizontal: spacing.md,
          minHeight: 52,
          ...shadows.sm,
        }}>
          <MaterialIcons name={icon} size={20} color={colors.textLight} style={{ marginEnd: spacing.sm }} />
          <Text style={{
            flex: 1,
            fontSize: typography.sizes.md,
            color: colors.textSecondary,
            textAlign: 'right',
            paddingVertical: spacing.md,
          }}>
            {value}
          </Text>
        </View>
      </View>
    </Pressable>
  );

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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader
          icon="place"
          title="الوقت والمكان"
          color={colors.accent}
          bgColor={colors.accent + '15'}
        />

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <PickerField
              label="التاريخ *"
              value={formatDate(dateObj)}
              icon="calendar-today"
              onPress={openDatePicker}
            />
          </View>
          <View style={{ flex: 1 }}>
            <PickerField
              label="الوقت *"
              value={formatTime(dateObj)}
              icon="access-time"
              onPress={openTimePicker}
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
            backgroundColor: isSubmitting ? colors.primaryLight : colors.primary,
            paddingVertical: spacing.md + 4,
            paddingHorizontal: spacing.lg,
            borderRadius: borderRadius.lg,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.xxl,
            opacity: isSubmitting ? 0.7 : 1,
            ...shadows.md,
          }, pressed && !isSubmitting && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
          onPress={handleCreate}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginEnd: spacing.sm }} />
          ) : (
            <MaterialIcons name="event-available" size={24} color="#FFFFFF" style={{ marginEnd: spacing.sm }} />
          )}
          <Text style={{
            fontSize: typography.sizes.lg,
            fontWeight: typography.weights.bold,
            color: '#FFFFFF',
          }}>{isSubmitting ? 'جاري الإنشاء...' : 'إنشاء الجلسة'}</Text>
        </Pressable>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Pressable style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }} onPress={() => setShowDatePicker(false)}>
          <View onStartShouldSetResponder={() => true} style={{
            backgroundColor: colors.surface,
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            width: '85%',
            maxWidth: 400,
            ...shadows.xl,
          }}>
            <Text style={{
              fontSize: typography.sizes.xl,
              fontWeight: typography.weights.bold,
              color: colors.text,
              marginBottom: spacing.lg,
              textAlign: 'center',
            }}>اختر التاريخ</Text>
            
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              minimumDate={new Date()}
              locale="ar"
              style={{ width: '100%', height: 220, backgroundColor: colors.background }}
              themeVariant={colors.background === '#121212' ? 'dark' : 'light'}
            />

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Pressable
                style={({ pressed }) => [{
                  flex: 1,
                  paddingVertical: spacing.md,
                  borderRadius: borderRadius.md,
                  alignItems: 'center',
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                }, pressed && { opacity: 0.7 }]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={{
                  fontSize: typography.sizes.md,
                  fontWeight: typography.weights.semibold,
                  color: colors.text,
                }}>إلغاء</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [{
                  flex: 1,
                  paddingVertical: spacing.md,
                  borderRadius: borderRadius.md,
                  alignItems: 'center',
                  backgroundColor: colors.primary,
                  ...shadows.sm,
                }, pressed && { opacity: 0.7 }]}
                onPress={confirmDatePicker}
              >
                <Text style={{
                  fontSize: typography.sizes.md,
                  fontWeight: typography.weights.bold,
                  color: '#FFFFFF',
                }}>تأكيد</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <Pressable style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }} onPress={() => setShowTimePicker(false)}>
          <View onStartShouldSetResponder={() => true} style={{
            backgroundColor: colors.surface,
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            width: '85%',
            maxWidth: 400,
            ...shadows.xl,
          }}>
            <Text style={{
              fontSize: typography.sizes.xl,
              fontWeight: typography.weights.bold,
              color: colors.text,
              marginBottom: spacing.lg,
              textAlign: 'center',
            }}>اختر الوقت</Text>
            
            <DateTimePicker
              value={tempDate}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
              locale="ar"
              style={{ width: '100%', height: 220, backgroundColor: colors.background }}
              themeVariant={colors.background === '#121212' ? 'dark' : 'light'}
            />

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Pressable
                style={({ pressed }) => [{
                  flex: 1,
                  paddingVertical: spacing.md,
                  borderRadius: borderRadius.md,
                  alignItems: 'center',
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                }, pressed && { opacity: 0.7 }]}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={{
                  fontSize: typography.sizes.md,
                  fontWeight: typography.weights.semibold,
                  color: colors.text,
                }}>إلغاء</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [{
                  flex: 1,
                  paddingVertical: spacing.md,
                  borderRadius: borderRadius.md,
                  alignItems: 'center',
                  backgroundColor: colors.primary,
                  ...shadows.sm,
                }, pressed && { opacity: 0.7 }]}
                onPress={confirmTimePicker}
              >
                <Text style={{
                  fontSize: typography.sizes.md,
                  fontWeight: typography.weights.bold,
                  color: '#FFFFFF',
                }}>تأكيد</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}
