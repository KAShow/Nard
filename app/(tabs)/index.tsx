import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSessions } from '@/hooks/useSessions';
import { SessionCard } from '@/components/SessionCard';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Session } from '@/types';

export default function SessionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sessions, isLoading, refreshSessions } = useSessions();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    return session.status === filter;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcomingSessions = sessions.filter(s => s.status === 'upcoming');
  const nextSession = upcomingSessions.length > 0 ? upcomingSessions[0] : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialIcons name="casino" size={32} color={colors.primary} />
          <Text style={styles.title}>نرد</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
          onPress={() => router.push('/create-session')}
        >
          <MaterialIcons name="add" size={28} color={colors.surface} />
        </Pressable>
      </View>

      {nextSession && (
        <View style={styles.nextSession}>
          <View style={styles.nextSessionHeader}>
            <MaterialIcons name="star" size={20} color={colors.secondary} />
            <Text style={styles.nextSessionTitle}>الجلسة القادمة</Text>
          </View>
          <SessionCard session={nextSession} />
        </View>
      )}

      <View style={styles.filters}>
        <FilterButton 
          label="الكل" 
          active={filter === 'all'} 
          onPress={() => setFilter('all')}
        />
        <FilterButton 
          label="القادمة" 
          active={filter === 'upcoming'} 
          onPress={() => setFilter('upcoming')}
        />
        <FilterButton 
          label="المنتهية" 
          active={filter === 'completed'} 
          onPress={() => setFilter('completed')}
        />
      </View>

      <FlatList
        data={filteredSessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SessionCard session={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshSessions}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="event-busy" size={64} color={colors.textLight} />
            <Text style={styles.emptyText}>لا توجد جلسات</Text>
            <Text style={styles.emptySubtext}>ابدأ بإنشاء جلسة جديدة</Text>
          </View>
        }
      />
    </View>
  );
}

function FilterButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.filterButton,
        active && styles.filterButtonActive,
        pressed && styles.filterButtonPressed,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  addButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  nextSession: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  nextSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  nextSessionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonPressed: {
    opacity: 0.7,
  },
  filterText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.surface,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
});
