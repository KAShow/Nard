import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useSessions } from '@/hooks/useSessions';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { useAlert } from '@/template';

export default function CreateSessionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { createSession } = useSessions();
  const { showAlert } = useAlert();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('8');

  const handleCreate = async () => {
    if (!user) return;

    if (!title.trim() || !date.trim() || !time.trim() || !location.trim()) {
      showAlert('تنبيه', 'الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    const playersCount = parseInt(maxPlayers, 10);
    if (isNaN(playersCount) || playersCount < 2) {
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
      maxPlayers: playersCount,
      status: 'upcoming',
    });

    showAlert('نجح', 'تم إنشاء الجلسة بنجاح');
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <View style={styles.field}>
          <Text style={styles.label}>عنوان الجلسة *</Text>
          <TextInput
            style={styles.input}
            placeholder="مثال: جلسة استراتيجية مسائية"
            placeholderTextColor={colors.textLight}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>الوصف</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="وصف الجلسة والألعاب المتوقعة"
            placeholderTextColor={colors.textLight}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>التاريخ *</Text>
            <TextInput
              style={styles.input}
              placeholder="2026-03-25"
              placeholderTextColor={colors.textLight}
              value={date}
              onChangeText={setDate}
            />
          </View>

          <View style={styles.halfField}>
            <Text style={styles.label}>الوقت *</Text>
            <TextInput
              style={styles.input}
              placeholder="7:00 مساءً"
              placeholderTextColor={colors.textLight}
              value={time}
              onChangeText={setTime}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>المكان *</Text>
          <TextInput
            style={styles.input}
            placeholder="مثال: مقهى اللعبة، الرياض"
            placeholderTextColor={colors.textLight}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>رابط الموقع (اختياري)</Text>
          <View style={styles.inputWithIcon}>
            <MaterialIcons name="link" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.inputIcon}
              placeholder="رابط خرائط جوجل"
              placeholderTextColor={colors.textLight}
              value={locationUrl}
              onChangeText={setLocationUrl}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>الحد الأقصى للاعبين *</Text>
          <TextInput
            style={styles.input}
            placeholder="8"
            placeholderTextColor={colors.textLight}
            value={maxPlayers}
            onChangeText={setMaxPlayers}
            keyboardType="number-pad"
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleCreate}
        >
          <MaterialIcons name="add-circle" size={24} color={colors.surface} />
          <Text style={styles.buttonText}>إنشاء الجلسة</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  field: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.text,
    ...shadows.sm,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  inputIcon: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
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
    marginLeft: spacing.sm,
  },
});
