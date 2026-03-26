import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Session } from '@/types';
import { spacing, borderRadius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';

interface SessionCardProps {
  session: Session;
}

const AVATAR_COLORS_KEYS = ['primary', 'accent', 'secondary', 'badge'] as const;

export function SessionCard({ session }: SessionCardProps) {
  const router = useRouter();
  const { colors, shadows } = useTheme();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'تاريخ غير محدد';
    // Convert YYYY/MM/DD to YYYY-MM-DD for proper parsing
    const normalizedDate = dateStr.replace(/\//g, '-');
    const date = new Date(normalizedDate);
    if (isNaN(date.getTime())) return 'تاريخ غير صحيح';
    return new Intl.DateTimeFormat('ar', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(date);
  };

  // Defensive: ensure all fields are valid
  const attendees = Array.isArray(session.attendees) ? session.attendees : [];
  const ratings = Array.isArray(session.ratings) ? session.ratings : [];
  const title = session.title || 'جلسة بدون عنوان';
  const location = session.location || 'موقع غير محدد';
  const time = session.time || 'وقت غير محدد';
  const description = session.description || '';
  const hostName = session.hostName || 'منظم';
  const maxPlayers = session.maxPlayers > 0 ? session.maxPlayers : 8;

  const spotsLeft = maxPlayers - attendees.length;
  const isFull = spotsLeft <= 0;
  const fillPercent = Math.min((attendees.length / maxPlayers) * 100, 100);
  const isAlmostFull = fillPercent > 90;

  const statusBorderColor = (() => {
    switch (session.status) {
      case 'upcoming':
        return colors.primary;
      case 'ongoing':
        return colors.success;
      case 'completed':
        return colors.textLight;
    }
  })();

  const visibleAttendees = attendees.slice(0, 4);
  const extraCount = attendees.length - 4;

  return (
    <Pressable
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginBottom: spacing.md,
          borderStartWidth: 4,
          borderStartColor: statusBorderColor,
          ...shadows.md,
        },
        pressed && {
          opacity: 0.7,
          transform: [{ scale: 0.98 }],
        },
      ]}
      onPress={() => router.push(`/session/${session.id}` as any)}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: spacing.sm,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            marginEnd: spacing.sm,
          }}
        >
          <MaterialIcons name="casino" size={24} color={colors.primary} />
          <Text
            style={{
              fontSize: typography.sizes.lg,
              fontWeight: typography.weights.bold,
              color: colors.text,
              marginStart: spacing.sm,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: isFull ? colors.error : colors.accent,
            paddingHorizontal: spacing.sm + 2,
            paddingVertical: spacing.xs + 1,
            borderRadius: borderRadius.round,
            opacity: isFull ? 0.85 : 1,
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: typography.sizes.xs,
              fontWeight: typography.weights.bold,
            }}
          >
            {isFull ? 'مكتمل' : `${spotsLeft} ${spotsLeft === 1 ? 'مقعد' : 'مقاعد'}`}
          </Text>
        </View>
      </View>

      {/* Date & Time */}
      <View style={{ marginBottom: spacing.sm }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.xs,
          }}
        >
          <MaterialIcons name="calendar-today" size={16} color={colors.textSecondary} />
          <Text
            style={{
              fontSize: typography.sizes.sm,
              color: colors.textSecondary,
              marginStart: spacing.xs,
              flex: 1,
            }}
          >
            {formatDate(session.date)}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.xs,
          }}
        >
          <MaterialIcons name="access-time" size={16} color={colors.textSecondary} />
          <Text
            style={{
              fontSize: typography.sizes.sm,
              color: colors.textSecondary,
              marginStart: spacing.xs,
              flex: 1,
            }}
          >
            {time}
          </Text>
        </View>
      </View>

      {/* Location */}
      <View style={{ marginBottom: spacing.sm }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.xs,
          }}
        >
          <MaterialIcons name="location-on" size={16} color={colors.textSecondary} />
          <Text
            style={{
              fontSize: typography.sizes.sm,
              color: colors.textSecondary,
              marginStart: spacing.xs,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {location}
          </Text>
        </View>
      </View>

      {/* Description */}
      {description ? (
        <Text
          style={{
            fontSize: typography.sizes.sm,
            color: colors.textSecondary,
            lineHeight: 20,
            marginBottom: spacing.sm,
          }}
          numberOfLines={2}
        >
          {description}
        </Text>
      ) : null}

      {/* Footer */}
      <View
        style={{
          paddingTop: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.divider,
        }}
      >
        {/* Top row: avatars + host name */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.sm,
          }}
        >
          {/* Overlapping attendee avatars */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {visibleAttendees.map((attendee, index) => {
              const bgColor = colors[AVATAR_COLORS_KEYS[index % AVATAR_COLORS_KEYS.length]];
              return (
                <View
                  key={attendee.userId}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: bgColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginStart: index === 0 ? 0 : -8,
                    borderWidth: 2,
                    borderColor: colors.surface,
                  }}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: typography.weights.bold,
                    }}
                  >
                    {attendee.userName.charAt(0)}
                  </Text>
                </View>
              );
            })}
            {extraCount > 0 && (
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: colors.surfaceLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginStart: -8,
                  borderWidth: 2,
                  borderColor: colors.surface,
                }}
              >
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 10,
                    fontWeight: typography.weights.bold,
                  }}
                >
                  +{extraCount}
                </Text>
              </View>
            )}
            <Text
              style={{
                fontSize: typography.sizes.sm,
                fontWeight: typography.weights.semibold,
                color: colors.accent,
                marginStart: spacing.xs,
              }}
            >
              {attendees.length} / {maxPlayers}
            </Text>
          </View>

          <Text
            style={{
              fontSize: typography.sizes.xs,
              color: colors.textLight,
            }}
          >
            المنظم: {hostName}
          </Text>
        </View>

        {/* Progress bar */}
        <View
          style={{
            height: 3,
            borderRadius: 2,
            backgroundColor: colors.divider,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: 3,
              borderRadius: 2,
              width: `${fillPercent}%`,
              backgroundColor: isAlmostFull ? colors.error : colors.accent,
            }}
          />
        </View>
      </View>
    </Pressable>
  );
}
