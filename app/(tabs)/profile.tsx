import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useSessions } from '@/hooks/useSessions';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { BadgeInfo } from '@/types';

const BADGES: BadgeInfo[] = [
  { id: 'king', name: 'ملك البورد جيمز', emoji: '👑', description: 'أحضر 10 ألعاب مختلفة' },
  { id: 'provider', name: 'راعي الواجب', emoji: '🍕', description: 'أحضر وجبات لـ 5 جلسات' },
  { id: 'savior', name: 'المنقذ', emoji: '🦸', description: 'انضم في آخر لحظة 3 مرات' },
  { id: 'veteran', name: 'محترف الجلسات', emoji: '⭐', description: 'حضر 20 جلسة' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { sessions } = useSessions();

  if (!user) return null;

  const attendedSessions = sessions.filter(s => 
    s.attendees.some(a => a.userId === user.id)
  );
  const hostedSessions = sessions.filter(s => s.hostId === user.id);
  const gamesCount = attendedSessions.reduce((count, session) => {
    const userAttendee = session.attendees.find(a => a.userId === user.id);
    return count + (userAttendee?.gameBrought ? 1 : 0);
  }, 0);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={48} color={colors.primary} />
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.points}>{user.points} نقطة</Text>
      </View>

      <View style={styles.stats}>
        <StatCard icon="event" label="جلسة حضرتها" value={attendedSessions.length} />
        <StatCard icon="casino" label="لعبة أحضرتها" value={gamesCount} />
        <StatCard icon="star" label="جلسة نظمتها" value={hostedSessions.length} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الألقاب والإنجازات</Text>
        <View style={styles.badges}>
          {BADGES.map(badge => (
            <BadgeCard 
              key={badge.id} 
              badge={badge} 
              earned={user.badges.includes(badge.id)}
            />
          ))}
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && styles.logoutButtonPressed,
        ]}
        onPress={handleLogout}
      >
        <MaterialIcons name="logout" size={24} color={colors.error} />
        <Text style={styles.logoutText}>تسجيل الخروج</Text>
      </Pressable>
    </ScrollView>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <MaterialIcons name={icon as any} size={32} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BadgeCard({ badge, earned }: { badge: BadgeInfo; earned: boolean }) {
  return (
    <View style={[styles.badgeCard, !earned && styles.badgeCardLocked]}>
      <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
      <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]}>
        {badge.name}
      </Text>
      <Text style={styles.badgeDescription}>{badge.description}</Text>
      {!earned && (
        <View style={styles.lockBadge}>
          <MaterialIcons name="lock" size={16} color={colors.textLight} />
        </View>
      )}
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
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  name: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  points: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  statValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  badgeCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  badgeCardLocked: {
    opacity: 0.5,
  },
  badgeEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  badgeName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  badgeNameLocked: {
    color: colors.textLight,
  },
  badgeDescription: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  lockBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  logoutButtonPressed: {
    opacity: 0.7,
  },
  logoutText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.error,
    marginLeft: spacing.sm,
  },
});
