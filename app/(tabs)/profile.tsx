import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useSessions } from '@/hooks/useSessions';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, borderRadius, typography } from '@/constants/theme';
import { BadgeInfo } from '@/types';

const BADGES: BadgeInfo[] = [
  { id: 'king', name: 'ملك البورد جيمز', emoji: '👑', description: 'أحضر 10 ألعاب مختلفة' },
  { id: 'provider', name: 'راعي الواجب', emoji: '🍕', description: 'أحضر وجبات لـ 5 جلسات' },
  { id: 'savior', name: 'المنقذ', emoji: '🦸', description: 'انضم في آخر لحظة 3 مرات' },
  { id: 'veteran', name: 'محترف الجلسات', emoji: '⭐', description: 'حضر 20 جلسة' },
];

const BADGE_THRESHOLDS: Record<string, number> = {
  king: 10,
  provider: 5,
  savior: 3,
  veteran: 20,
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { sessions } = useSessions();
  const { colors, shadows, isDark, toggleTheme } = useTheme();

  if (!user) return null;

  const attendedSessions = sessions.filter(s =>
    s.attendees.some(a => a.userId === user.id)
  );
  const hostedSessions = sessions.filter(s => s.hostId === user.id);
  const gamesCount = attendedSessions.reduce((count, session) => {
    const userAttendee = session.attendees.find(a => a.userId === user.id);
    return count + (userAttendee?.gameBrought ? 1 : 0);
  }, 0);
  const snacksCount = attendedSessions.reduce((count, session) => {
    const userAttendee = session.attendees.find(a => a.userId === user.id);
    return count + (userAttendee?.snackBrought ? 1 : 0);
  }, 0);

  const getBadgeProgress = (badgeId: string): { current: number; target: number } => {
    const target = BADGE_THRESHOLDS[badgeId] ?? 0;
    switch (badgeId) {
      case 'king':
        return { current: gamesCount, target };
      case 'provider':
        return { current: snacksCount, target };
      case 'veteran':
        return { current: attendedSessions.length, target };
      case 'savior':
      default:
        return { current: 0, target };
    }
  };

  const firstLetter = user.name?.charAt(0) ?? '?';

  const handleLogout = async () => {
    await logout();
    router.replace('/login' as any);
  };

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
    >
      {/* Header with gradient background */}
      <LinearGradient
        colors={[colors.primaryLight + '26', colors.background]}
        style={{
          alignItems: 'center',
          paddingTop: spacing.xl,
          paddingBottom: spacing.lg,
          paddingHorizontal: spacing.md,
        }}
      >
        {/* Dark mode toggle */}
        <Pressable
          onPress={toggleTheme}
          style={({ pressed }) => ({
            position: 'absolute',
            top: spacing.md,
            left: spacing.md,
            width: 40,
            height: 40,
            borderRadius: borderRadius.round,
            backgroundColor: colors.surface,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: pressed ? 0.7 : 1,
            ...shadows.sm,
          })}
        >
          <MaterialIcons
            name={isDark ? 'light-mode' : 'dark-mode'}
            size={22}
            color={isDark ? colors.secondary : colors.primaryDark}
          />
        </Pressable>

        {/* Avatar with first letter */}
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: borderRadius.round,
            backgroundColor: '#FFFFFF',
            borderWidth: 3,
            borderColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing.md,
            ...shadows.md,
          }}
        >
          <Text
            style={{
              fontSize: 36,
              fontWeight: typography.weights.bold,
              color: colors.primary,
            }}
          >
            {firstLetter}
          </Text>
        </View>

        <Text
          style={{
            fontSize: typography.sizes.title,
            fontWeight: typography.weights.bold,
            color: colors.text,
            marginBottom: spacing.xs,
          }}
        >
          {user.name}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.secondary + '30',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.round,
          }}
        >
          <MaterialIcons name="stars" size={18} color={colors.accent} />
          <Text
            style={{
              fontSize: typography.sizes.lg,
              fontWeight: typography.weights.semibold,
              color: colors.accent,
              marginStart: spacing.xs,
            }}
          >
            {user.points} نقطة
          </Text>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginHorizontal: spacing.md,
          marginBottom: spacing.xl,
          gap: spacing.sm,
        }}
      >
        <StatCard
          icon="event"
          label="جلسة حضرتها"
          value={attendedSessions.length}
          accentColor={colors.primary}
          colors={colors}
          shadows={shadows}
        />
        <StatCard
          icon="casino"
          label="لعبة أحضرتها"
          value={gamesCount}
          accentColor={colors.accent}
          colors={colors}
          shadows={shadows}
        />
        <StatCard
          icon="star"
          label="جلسة نظمتها"
          value={hostedSessions.length}
          accentColor={colors.secondary}
          colors={colors}
          shadows={shadows}
        />
      </View>

      {/* Badges Section */}
      <View style={{ marginHorizontal: spacing.md, marginBottom: spacing.xl }}>
        <Text
          style={{
            fontSize: typography.sizes.lg,
            fontWeight: typography.weights.semibold,
            color: colors.text,
            marginBottom: spacing.md,
          }}
        >
          الألقاب والإنجازات
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.md,
          }}
        >
          {BADGES.map(badge => {
            const earned = user.badges.includes(badge.id);
            const progress = getBadgeProgress(badge.id);
            return (
              <BadgeCard
                key={badge.id}
                badge={badge}
                earned={earned}
                progress={progress}
                colors={colors}
                shadows={shadows}
              />
            );
          })}
        </View>
      </View>

      {/* Logout */}
      <Pressable
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.md,
          marginHorizontal: spacing.md,
          opacity: pressed ? 0.5 : 1,
        })}
        onPress={handleLogout}
      >
        <MaterialIcons name="logout" size={20} color={colors.error} />
        <Text
          style={{
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.medium,
            color: colors.error,
            marginStart: spacing.sm,
          }}
        >
          تسجيل الخروج
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function StatCard({
  icon,
  label,
  value,
  accentColor,
  colors,
  shadows,
}: {
  icon: string;
  label: string;
  value: number;
  accentColor: string;
  colors: any;
  shadows: any;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        borderTopWidth: 3,
        borderTopColor: accentColor,
        padding: spacing.md,
        alignItems: 'center',
        ...shadows.sm,
      }}
    >
      <MaterialIcons name={icon as any} size={28} color={accentColor} />
      <Text
        style={{
          fontSize: typography.sizes.xxl,
          fontWeight: typography.weights.bold,
          color: colors.text,
          marginTop: spacing.xs,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: typography.sizes.xs,
          color: colors.textSecondary,
          marginTop: spacing.xs,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function BadgeCard({
  badge,
  earned,
  progress,
  colors,
  shadows,
}: {
  badge: BadgeInfo;
  earned: boolean;
  progress: { current: number; target: number };
  colors: any;
  shadows: any;
}) {
  return (
    <View
      style={{
        width: '47%' as any,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
        opacity: earned ? 1 : 0.65,
        borderWidth: earned ? 2 : 0,
        borderColor: earned ? colors.badge : 'transparent',
        ...shadows.sm,
      }}
    >
      {earned && (
        <View
          style={{
            position: 'absolute',
            top: -6,
            end: -6,
            width: 24,
            height: 24,
            borderRadius: borderRadius.round,
            backgroundColor: colors.success,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <MaterialIcons name="check" size={14} color="#FFFFFF" />
        </View>
      )}

      {!earned && (
        <View
          style={{
            position: 'absolute',
            top: spacing.sm,
            end: spacing.sm,
          }}
        >
          <MaterialIcons name="lock" size={16} color={colors.textLight} />
        </View>
      )}

      <Text style={{ fontSize: 44, marginBottom: spacing.sm }}>
        {badge.emoji}
      </Text>

      <Text
        style={{
          fontSize: typography.sizes.sm,
          fontWeight: typography.weights.semibold,
          color: earned ? colors.text : colors.textLight,
          textAlign: 'center',
          marginBottom: spacing.xs,
        }}
      >
        {badge.name}
      </Text>

      <Text
        style={{
          fontSize: typography.sizes.xs,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: !earned ? spacing.sm : 0,
        }}
      >
        {badge.description}
      </Text>

      {/* Progress indicator for locked badges */}
      {!earned && (
        <View
          style={{
            backgroundColor: colors.surfaceLight,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.round,
            minWidth: 48,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: typography.sizes.xs,
              fontWeight: typography.weights.semibold,
              color: colors.primary,
            }}
          >
            {badge.id === 'savior'
              ? `؟/${progress.target}`
              : `${progress.current}/${progress.target}`}
          </Text>
        </View>
      )}
    </View>
  );
}
