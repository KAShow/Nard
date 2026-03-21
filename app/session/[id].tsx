import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useSessions } from '@/hooks/useSessions';
import { RandomPicker } from '@/components/RandomPicker';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { useAlert } from '@/template';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { sessions, joinSession, leaveSession, rateSession } = useSessions();
  const { showAlert } = useAlert();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [gameBrought, setGameBrought] = useState('');
  const [snackBrought, setSnackBrought] = useState('');
  const [showPickerModal, setShowPickerModal] = useState(false);

  const session = sessions.find(s => s.id === id);

  if (!session || !user) {
    return (
      <View style={styles.error}>
        <MaterialIcons name="error" size={64} color={colors.textLight} />
        <Text style={styles.errorText}>الجلسة غير موجودة</Text>
      </View>
    );
  }

  const isAttending = session.attendees.some(a => a.userId === user.id);
  const isFull = session.attendees.length >= session.maxPlayers;
  const isHost = session.hostId === user.id;
  const userRating = session.ratings.find(r => r.userId === user.id);

  const handleJoin = async () => {
    if (isFull && !isAttending) {
      showAlert('عذراً', 'الجلسة مكتملة');
      return;
    }

    await joinSession(session.id, {
      userId: user.id,
      userName: user.name,
      gameBrought: gameBrought.trim() || undefined,
      snackBrought: snackBrought.trim() || undefined,
      joinedAt: new Date().toISOString(),
    });

    setShowJoinModal(false);
    setGameBrought('');
    setSnackBrought('');
    showAlert('رائع!', 'تم تأكيد حضورك');
  };

  const handleLeave = () => {
    showAlert('تأكيد', 'هل تريد إلغاء حضورك؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'نعم',
        style: 'destructive',
        onPress: async () => {
          await leaveSession(session.id, user.id);
          showAlert('تم', 'تم إلغاء حضورك');
        },
      },
    ]);
  };

  const handleRate = async (emoji: string) => {
    await rateSession(session.id, user.id, emoji);
  };

  const attendeeNames = session.attendees.map(a => a.userName);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialIcons name="casino" size={32} color={colors.primary} />
          <Text style={styles.title}>{session.title}</Text>
        </View>
        {isHost && (
          <View style={styles.hostBadge}>
            <Text style={styles.hostBadgeText}>أنت المنظم</Text>
          </View>
        )}
      </View>

      {session.description && (
        <Text style={styles.description}>{session.description}</Text>
      )}

      <View style={styles.infoCard}>
        <InfoRow icon="calendar-today" label="التاريخ" value={session.date} />
        <InfoRow icon="access-time" label="الوقت" value={session.time} />
        <InfoRow icon="location-on" label="المكان" value={session.location} />
        {session.locationUrl && (
          <Pressable 
            style={styles.linkButton}
            onPress={() => showAlert('رابط الموقع', session.locationUrl || '')}
          >
            <MaterialIcons name="link" size={20} color={colors.accent} />
            <Text style={styles.linkText}>فتح الموقع في الخرائط</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          الحضور ({session.attendees.length}/{session.maxPlayers})
        </Text>
        {session.attendees.length === 0 ? (
          <Text style={styles.emptyText}>لا يوجد حضور بعد</Text>
        ) : (
          session.attendees.map(attendee => (
            <View key={attendee.userId} style={styles.attendeeCard}>
              <View style={styles.attendeeHeader}>
                <MaterialIcons name="person" size={24} color={colors.primary} />
                <Text style={styles.attendeeName}>{attendee.userName}</Text>
              </View>
              {attendee.gameBrought && (
                <View style={styles.attendeeInfo}>
                  <MaterialIcons name="videogame-asset" size={16} color={colors.accent} />
                  <Text style={styles.attendeeInfoText}>{attendee.gameBrought}</Text>
                </View>
              )}
              {attendee.snackBrought && (
                <View style={styles.attendeeInfo}>
                  <MaterialIcons name="fastfood" size={16} color={colors.secondary} />
                  <Text style={styles.attendeeInfoText}>{attendee.snackBrought}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {session.attendees.length > 0 && (
        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [
              styles.pickerButton,
              pressed && styles.pickerButtonPressed,
            ]}
            onPress={() => setShowPickerModal(true)}
          >
            <MaterialIcons name="casino" size={24} color={colors.surface} />
            <Text style={styles.pickerButtonText}>عجلة الحظ</Text>
          </Pressable>
        </View>
      )}

      {session.status === 'completed' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>قيّم الجلسة</Text>
          <View style={styles.ratingButtons}>
            {['🔥', '😍', '👍', '😊', '😐'].map(emoji => (
              <Pressable
                key={emoji}
                style={({ pressed }) => [
                  styles.emojiButton,
                  userRating?.emoji === emoji && styles.emojiButtonSelected,
                  pressed && styles.emojiButtonPressed,
                ]}
                onPress={() => handleRate(emoji)}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
          {session.ratings.length > 0 && (
            <View style={styles.ratingsDisplay}>
              {session.ratings.map((rating, index) => (
                <Text key={index} style={styles.ratingEmoji}>{rating.emoji}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.actions}>
        {!isAttending ? (
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              isFull && styles.disabledButton,
              pressed && !isFull && styles.primaryButtonPressed,
            ]}
            onPress={() => setShowJoinModal(true)}
            disabled={isFull}
          >
            <MaterialIcons name="check-circle" size={24} color={colors.surface} />
            <Text style={styles.primaryButtonText}>
              {isFull ? 'الجلسة مكتملة' : 'أنا جاي'}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
            ]}
            onPress={handleLeave}
          >
            <MaterialIcons name="cancel" size={24} color={colors.error} />
            <Text style={styles.secondaryButtonText}>إلغاء الحضور</Text>
          </Pressable>
        )}
      </View>

      {/* Join Modal */}
      <Modal
        visible={showJoinModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>تأكيد الحضور</Text>
            
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>وش بتجيب معك؟ (اللعبة)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="مثال: كاتان، مونوبولي"
                placeholderTextColor={colors.textLight}
                value={gameBrought}
                onChangeText={setGameBrought}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>الخفايف 🍿</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="مثال: قهوة، حلا، فطائر"
                placeholderTextColor={colors.textLight}
                value={snackBrought}
                onChangeText={setSnackBrought}
              />
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonSecondary,
                  pressed && styles.modalButtonPressed,
                ]}
                onPress={() => setShowJoinModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>إلغاء</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  pressed && styles.modalButtonPressed,
                ]}
                onPress={handleJoin}
              >
                <Text style={styles.modalButtonTextPrimary}>تأكيد</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Picker Modal */}
      <Modal
        visible={showPickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <RandomPicker
              items={attendeeNames}
              title="من يبدأ؟"
              onPick={(name) => {
                showAlert('الفائز!', `${name} سيبدأ اللعب أولاً`);
                setShowPickerModal(false);
              }}
            />
            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
              onPress={() => setShowPickerModal(false)}
            >
              <Text style={styles.closeButtonText}>إغلاق</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <MaterialIcons name={icon as any} size={20} color={colors.primary} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.textLight,
    marginTop: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  hostBadge: {
    backgroundColor: colors.badge,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  hostBadgeText: {
    color: colors.surface,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  description: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoContent: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
  },
  infoValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  linkText: {
    fontSize: typography.sizes.sm,
    color: colors.accent,
    marginLeft: spacing.xs,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  attendeeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  attendeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  attendeeName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  attendeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  attendeeInfoText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  pickerButton: {
    flexDirection: 'row',
    backgroundColor: colors.dice,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  pickerButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  pickerButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.surface,
    marginLeft: spacing.sm,
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  emojiButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  emojiButtonSelected: {
    backgroundColor: colors.surfaceLight,
    ...shadows.md,
  },
  emojiButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.9 }],
  },
  emoji: {
    fontSize: 32,
  },
  ratingsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  ratingEmoji: {
    fontSize: 24,
  },
  actions: {
    marginTop: spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  primaryButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.surface,
    marginLeft: spacing.sm,
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  secondaryButtonPressed: {
    opacity: 0.7,
  },
  secondaryButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.error,
    marginLeft: spacing.sm,
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalField: {
    marginBottom: spacing.md,
  },
  modalLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonSecondary: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonPressed: {
    opacity: 0.7,
  },
  modalButtonTextPrimary: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.surface,
  },
  modalButtonTextSecondary: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  closeButton: {
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  closeButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
});
