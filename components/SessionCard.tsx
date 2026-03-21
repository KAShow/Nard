import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Session } from '@/types';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { useRouter } from 'expo-router';

interface SessionCardProps {
  session: Session;
}

export function SessionCard({ session }: SessionCardProps) {
  const router = useRouter();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('ar', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(date);
  };

  const spotsLeft = session.maxPlayers - session.attendees.length;
  const isFull = spotsLeft <= 0;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={() => router.push(`/session/${session.id}`)}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialIcons name="casino" size={24} color={colors.primary} />
          <Text style={styles.title} numberOfLines={1}>{session.title}</Text>
        </View>
        <View style={[styles.badge, isFull && styles.badgeFull]}>
          <Text style={styles.badgeText}>
            {isFull ? 'مكتمل' : `${spotsLeft} ${spotsLeft === 1 ? 'مقعد' : 'مقاعد'}`}
          </Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.infoRow}>
          <MaterialIcons name="calendar-today" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>{formatDate(session.date)}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="access-time" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>{session.time}</Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.infoRow}>
          <MaterialIcons name="location-on" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText} numberOfLines={1}>{session.location}</Text>
        </View>
      </View>

      {session.description && (
        <Text style={styles.description} numberOfLines={2}>
          {session.description}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.attendees}>
          <MaterialIcons name="people" size={18} color={colors.accent} />
          <Text style={styles.attendeesText}>
            {session.attendees.length} / {session.maxPlayers}
          </Text>
        </View>
        <Text style={styles.hostName}>المنظم: {session.hostName}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgeFull: {
    backgroundColor: colors.textLight,
  },
  badgeText: {
    color: colors.surface,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  info: {
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  attendees: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
    marginLeft: spacing.xs,
  },
  hostName: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
  },
});
