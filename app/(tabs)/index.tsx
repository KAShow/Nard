import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSessions } from '@/hooks/useSessions';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { SessionCard } from '@/components/SessionCard';
import { spacing, borderRadius, typography } from '@/constants/theme';
import { Session } from '@/types';

function getDaysUntil(dateString: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function SkeletonCard({ colors }: { colors: any }) {
  return (
    <View
      style={{
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
      }}
    >
      <View
        style={{
          backgroundColor: colors.border,
          borderRadius: borderRadius.sm,
          height: 18,
          width: '60%',
          marginBottom: spacing.sm,
        }}
      />
      <View
        style={{
          backgroundColor: colors.border,
          borderRadius: borderRadius.sm,
          height: 14,
          width: '80%',
          marginBottom: spacing.sm,
        }}
      />
      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs }}>
        <View
          style={{
            backgroundColor: colors.border,
            borderRadius: borderRadius.sm,
            height: 14,
            width: 80,
          }}
        />
        <View
          style={{
            backgroundColor: colors.border,
            borderRadius: borderRadius.sm,
            height: 14,
            width: 60,
          }}
        />
      </View>
    </View>
  );
}

function FilterButton({
  label,
  active,
  count,
  colors,
  onPress,
}: {
  label: string;
  active: boolean;
  count?: number;
  colors: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm + 2,
          borderRadius: borderRadius.round,
          backgroundColor: active ? colors.primary : colors.surface,
          borderWidth: 1.5,
          borderColor: active ? colors.primary : colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] },
      ]}
      onPress={onPress}
    >
      <Text
        style={{
          fontSize: typography.sizes.sm,
          fontWeight: active ? typography.weights.bold : typography.weights.medium,
          color: active ? colors.surface : colors.textSecondary,
        }}
      >
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View
          style={{
            backgroundColor: active ? 'rgba(255,255,255,0.3)' : colors.surfaceLight,
            borderRadius: borderRadius.round,
            minWidth: 22,
            height: 22,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: spacing.xs,
          }}
        >
          <Text
            style={{
              fontSize: typography.sizes.xs,
              fontWeight: typography.weights.bold,
              color: active ? colors.surface : colors.textSecondary,
            }}
          >
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default function SessionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const { user } = useAuth();
  const { sessions, isLoading, refreshSessions } = useSessions();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

  const filteredSessions = useMemo(() => {
    return sessions
      .filter((session) => {
        if (filter === 'all') return true;
        return session.status === filter;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sessions, filter]);

  const upcomingSessions = useMemo(
    () => sessions.filter((s) => s.status === 'upcoming'),
    [sessions]
  );
  const completedSessions = useMemo(
    () => sessions.filter((s) => s.status === 'completed'),
    [sessions]
  );
  const nextSession = upcomingSessions.length > 0 ? upcomingSessions[0] : null;

  const daysUntilNext = nextSession ? getDaysUntil(nextSession.date) : null;

  const showSkeleton = isLoading && sessions.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
        }}
      >
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
            <MaterialIcons name="casino" size={32} color={colors.primary} />
            <Text
              style={{
                fontSize: typography.sizes.title,
                fontWeight: typography.weights.bold,
                color: colors.text,
                marginStart: spacing.sm,
              }}
            >
              نرد
            </Text>
          </View>
          {user && (
            <Text
              style={{
                fontSize: typography.sizes.md,
                fontWeight: typography.weights.medium,
                color: colors.textSecondary,
                marginStart: spacing.xs,
              }}
            >
              مرحبا، {user.name}
            </Text>
          )}
        </View>
        <Pressable
          style={({ pressed }) => [
            {
              width: 50,
              height: 50,
              borderRadius: borderRadius.round,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              ...shadows.md,
            },
            pressed && { opacity: 0.8, transform: [{ scale: 0.93 }] },
          ]}
          onPress={() => router.push('/create-session' as any)}
        >
          <MaterialIcons name="add" size={28} color={colors.surface} />
        </Pressable>
      </View>

      {/* Next Session Card */}
      {nextSession && (
        <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: spacing.sm,
            }}
          >
            <MaterialIcons name="star" size={20} color={colors.secondary} />
            <Text
              style={{
                fontSize: typography.sizes.md,
                fontWeight: typography.weights.semibold,
                color: colors.text,
                marginStart: spacing.xs,
              }}
            >
              الجلسة القادمة
            </Text>
          </View>
          <LinearGradient
            colors={[colors.primary + '12', colors.primaryLight + '08', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: borderRadius.lg,
              padding: 2,
            }}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: borderRadius.lg - 1,
                overflow: 'hidden',
              }}
            >
              <LinearGradient
                colors={[colors.primary + '0A', colors.primaryLight + '05', colors.surface]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{ padding: spacing.md }}
              >
                {daysUntilNext !== null && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: spacing.sm,
                      gap: spacing.xs,
                    }}
                  >
                    <MaterialIcons name="schedule" size={16} color={colors.primary} />
                    <Text
                      style={{
                        fontSize: typography.sizes.sm,
                        fontWeight: typography.weights.semibold,
                        color: colors.primary,
                      }}
                    >
                      {daysUntilNext === 0 ? 'اليوم!' : `بعد ${daysUntilNext} أيام`}
                    </Text>
                  </View>
                )}
                <SessionCard session={nextSession} />
              </LinearGradient>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Filter Buttons */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: spacing.md,
          marginBottom: spacing.md,
          gap: spacing.sm,
        }}
      >
        <FilterButton
          label="الكل"
          active={filter === 'all'}
          count={sessions.length}
          colors={colors}
          onPress={() => setFilter('all')}
        />
        <FilterButton
          label="القادمة"
          active={filter === 'upcoming'}
          count={upcomingSessions.length}
          colors={colors}
          onPress={() => setFilter('upcoming')}
        />
        <FilterButton
          label="المنتهية"
          active={filter === 'completed'}
          count={completedSessions.length}
          colors={colors}
          onPress={() => setFilter('completed')}
        />
      </View>

      {/* Sessions List */}
      {showSkeleton ? (
        <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm }}>
          <SkeletonCard colors={colors} />
          <SkeletonCard colors={colors} />
          <SkeletonCard colors={colors} />
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SessionCard session={item} />}
          contentContainerStyle={{
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.lg + insets.bottom,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshSessions}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: spacing.xxl + spacing.xl,
              }}
            >
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: borderRadius.round,
                  backgroundColor: colors.surfaceLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.lg,
                }}
              >
                <MaterialIcons name="event-busy" size={80} color={colors.textLight} />
              </View>
              <Text
                style={{
                  fontSize: typography.sizes.xl,
                  fontWeight: typography.weights.bold,
                  color: colors.textSecondary,
                  marginBottom: spacing.xs,
                }}
              >
                لا توجد جلسات
              </Text>
              <Text
                style={{
                  fontSize: typography.sizes.sm,
                  color: colors.textLight,
                  marginBottom: spacing.lg,
                }}
              >
                ابدأ بإنشاء جلسة جديدة
              </Text>
              <Pressable
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    backgroundColor: colors.primary,
                    paddingHorizontal: spacing.xl,
                    paddingVertical: spacing.md,
                    borderRadius: borderRadius.round,
                    ...shadows.md,
                  },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
                ]}
                onPress={() => router.push('/create-session' as any)}
              >
                <MaterialIcons name="add-circle-outline" size={22} color={colors.surface} />
                <Text
                  style={{
                    fontSize: typography.sizes.md,
                    fontWeight: typography.weights.bold,
                    color: colors.surface,
                  }}
                >
                  إنشاء جلسة
                </Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}
