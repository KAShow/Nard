import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useSessions } from '@/hooks/useSessions';
import { RandomPicker } from '@/components/RandomPicker';
import { BGGGamePicker } from '@/components/BGGGamePicker';
import { spacing, borderRadius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAlert } from '@/template';

const STATUS_CONFIG = {
  upcoming: { label: 'قادمة', icon: 'schedule' as const },
  ongoing: { label: 'جارية الآن', icon: 'play-circle-filled' as const },
  completed: { label: 'منتهية', icon: 'check-circle' as const },
};

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { sessions, joinSession, leaveSession, rateSession } = useSessions();
  const { showAlert } = useAlert();
  const { colors, shadows } = useTheme();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [gameBrought, setGameBrought] = useState('');
  const [snackBrought, setSnackBrought] = useState('');
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showBGGPicker, setShowBGGPicker] = useState(false);

  const session = sessions.find(s => s.id === id);

  if (!session || !user) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
      }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.surfaceLight,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.md,
        }}>
          <MaterialIcons name="error-outline" size={40} color={colors.textLight} />
        </View>
        <Text style={{
          fontSize: typography.sizes.lg,
          fontWeight: typography.weights.semibold,
          color: colors.textSecondary,
          marginTop: spacing.sm,
        }}>الجلسة غير موجودة</Text>
      </View>
    );
  }

  const isAttending = session.attendees.some(a => a.userId === user.id);
  const isFull = session.attendees.length >= session.maxPlayers;
  const isHost = session.hostId === user.id;
  const userRating = session.ratings.find(r => r.userId === user.id);

  const statusColor = session.status === 'upcoming' ? colors.primary
    : session.status === 'ongoing' ? colors.success
    : colors.textLight;
  const statusConfig = STATUS_CONFIG[session.status];

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
  const AVATAR_COLORS = [colors.primary, colors.accent, colors.secondary, colors.badge];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + spacing.lg }}
    >
      {/* Status Banner */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: statusColor + '15',
        borderRadius: borderRadius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: statusColor + '30',
      }}>
        <MaterialIcons name={statusConfig.icon} size={18} color={statusColor} />
        <Text style={{
          fontSize: typography.sizes.sm,
          fontWeight: typography.weights.semibold,
          color: statusColor,
          marginStart: spacing.xs,
        }}>{statusConfig.label}</Text>
      </View>

      {/* Header */}
      <View style={{ marginBottom: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
          <MaterialIcons name="casino" size={32} color={colors.primary} />
          <Text style={{
            fontSize: typography.sizes.title,
            fontWeight: typography.weights.bold,
            color: colors.text,
            marginStart: spacing.sm,
            flex: 1,
          }}>{session.title}</Text>
        </View>
        {isHost && (
          <View style={{
            backgroundColor: colors.badge,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs + 1,
            borderRadius: borderRadius.round,
            alignSelf: 'flex-start',
          }}>
            <Text style={{
              color: '#FFFFFF',
              fontSize: typography.sizes.xs,
              fontWeight: typography.weights.bold,
            }}>أنت المنظم</Text>
          </View>
        )}
      </View>

      {session.description && (
        <Text style={{
          fontSize: typography.sizes.md,
          color: colors.textSecondary,
          lineHeight: 24,
          marginBottom: spacing.md,
        }}>{session.description}</Text>
      )}

      {/* Info Card */}
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
        ...shadows.sm,
      }}>
        {[
          { icon: 'calendar-today' as const, label: 'التاريخ', value: session.date, color: colors.primary },
          { icon: 'access-time' as const, label: 'الوقت', value: session.time, color: colors.accent },
          { icon: 'location-on' as const, label: 'المكان', value: session.location, color: colors.secondary },
        ].map((info, idx) => (
          <View key={idx} style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: idx < 2 ? spacing.md : 0,
          }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: info.color + '15',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <MaterialIcons name={info.icon} size={18} color={info.color} />
            </View>
            <View style={{ marginStart: spacing.sm, flex: 1 }}>
              <Text style={{
                fontSize: typography.sizes.xs,
                color: colors.textLight,
              }}>{info.label}</Text>
              <Text style={{
                fontSize: typography.sizes.md,
                fontWeight: typography.weights.semibold,
                color: colors.text,
              }}>{info.value}</Text>
            </View>
          </View>
        ))}
        {session.locationUrl && (
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}
            onPress={() => showAlert('رابط الموقع', session.locationUrl || '')}
          >
            <MaterialIcons name="link" size={20} color={colors.accent} />
            <Text style={{
              fontSize: typography.sizes.sm,
              color: colors.accent,
              marginStart: spacing.xs,
            }}>فتح الموقع في الخرائط</Text>
          </Pressable>
        )}
      </View>

      {/* Attendees Section */}
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={{
          fontSize: typography.sizes.lg,
          fontWeight: typography.weights.semibold,
          color: colors.text,
          marginBottom: spacing.sm,
        }}>
          الحضور ({session.attendees.length}/{session.maxPlayers})
        </Text>
        {session.attendees.length === 0 ? (
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: borderRadius.md,
            padding: spacing.xl,
            alignItems: 'center',
            ...shadows.sm,
          }}>
            <MaterialIcons name="people-outline" size={40} color={colors.textLight} />
            <Text style={{
              fontSize: typography.sizes.sm,
              color: colors.textLight,
              marginTop: spacing.sm,
            }}>لا يوجد حضور بعد</Text>
          </View>
        ) : (
          session.attendees.map((attendee, idx) => {
            const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const hasBrought = attendee.gameBrought || attendee.snackBrought;
            return (
              <View key={attendee.userId} style={{
                backgroundColor: colors.surface,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.sm,
                borderStartWidth: hasBrought ? 3 : 0,
                borderStartColor: attendee.gameBrought ? colors.accent : colors.secondary,
                ...shadows.sm,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: attendee.gameBrought || attendee.snackBrought ? spacing.sm : 0 }}>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: avatarColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ color: '#FFFFFF', fontSize: typography.sizes.md, fontWeight: typography.weights.bold }}>
                      {attendee.userName.charAt(0)}
                    </Text>
                  </View>
                  <Text style={{
                    fontSize: typography.sizes.md,
                    fontWeight: typography.weights.semibold,
                    color: colors.text,
                    marginStart: spacing.sm,
                  }}>{attendee.userName}</Text>
                </View>
                {attendee.gameBrought && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, marginStart: spacing.xxl - 4 }}>
                    <MaterialIcons name="videogame-asset" size={14} color={colors.accent} />
                    <Text style={{ fontSize: typography.sizes.sm, color: colors.textSecondary, marginStart: spacing.xs }}>{attendee.gameBrought}</Text>
                  </View>
                )}
                {attendee.snackBrought && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, marginStart: spacing.xxl - 4 }}>
                    <MaterialIcons name="fastfood" size={14} color={colors.secondary} />
                    <Text style={{ fontSize: typography.sizes.sm, color: colors.textSecondary, marginStart: spacing.xs }}>{attendee.snackBrought}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* Random Picker Button */}
      {session.attendees.length > 0 && (
        <View style={{ marginBottom: spacing.lg }}>
          <Pressable
            style={({ pressed }) => [{
              flexDirection: 'row',
              backgroundColor: colors.dice,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadows.md,
            }, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
            onPress={() => setShowPickerModal(true)}
          >
            <MaterialIcons name="casino" size={24} color="#FFFFFF" />
            <Text style={{
              fontSize: typography.sizes.lg,
              fontWeight: typography.weights.bold,
              color: '#FFFFFF',
              marginStart: spacing.sm,
            }}>عجلة الحظ</Text>
          </Pressable>
        </View>
      )}

      {/* Rating Section */}
      {session.status === 'completed' && (
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{
            fontSize: typography.sizes.lg,
            fontWeight: typography.weights.semibold,
            color: colors.text,
            marginBottom: spacing.sm,
          }}>قيّم الجلسة</Text>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            marginBottom: spacing.sm,
            ...shadows.sm,
          }}>
            {['🔥', '😍', '👍', '😊', '😐'].map(emoji => (
              <Pressable
                key={emoji}
                style={({ pressed }) => [{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: userRating?.emoji === emoji ? colors.primaryLight + '30' : colors.surfaceLight,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: userRating?.emoji === emoji ? 2 : 0,
                  borderColor: colors.primary,
                }, pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] }]}
                onPress={() => handleRate(emoji)}
              >
                <Text style={{ fontSize: 28 }}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
          {session.ratings.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {session.ratings.map((rating, index) => (
                <Text key={index} style={{ fontSize: 22 }}>{rating.emoji}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={{ marginTop: spacing.sm }}>
        {!isAttending ? (
          <Pressable
            style={({ pressed }) => [{
              flexDirection: 'row',
              backgroundColor: colors.primary,
              paddingVertical: spacing.md + 2,
              paddingHorizontal: spacing.lg,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadows.md,
            }, isFull && { opacity: 0.5 }, pressed && !isFull && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
            onPress={() => setShowJoinModal(true)}
            disabled={isFull}
          >
            <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
            <Text style={{
              fontSize: typography.sizes.lg,
              fontWeight: typography.weights.bold,
              color: '#FFFFFF',
              marginStart: spacing.sm,
            }}>{isFull ? 'الجلسة مكتملة' : 'أنا جاي'}</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [{
              flexDirection: 'row',
              backgroundColor: colors.surface,
              borderWidth: 1.5,
              borderColor: colors.error,
              paddingVertical: spacing.md + 2,
              paddingHorizontal: spacing.lg,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadows.sm,
            }, pressed && { opacity: 0.7, backgroundColor: colors.error + '08' }]}
            onPress={handleLeave}
          >
            <MaterialIcons name="cancel" size={24} color={colors.error} />
            <Text style={{
              fontSize: typography.sizes.lg,
              fontWeight: typography.weights.semibold,
              color: colors.error,
              marginStart: spacing.sm,
            }}>إلغاء الحضور</Text>
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
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: borderRadius.xl,
            borderTopRightRadius: borderRadius.xl,
            padding: spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
          }}>
            <View style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.border,
              alignSelf: 'center',
              marginBottom: spacing.lg,
            }} />
            <Text style={{
              fontSize: typography.sizes.xl,
              fontWeight: typography.weights.bold,
              color: colors.text,
              marginBottom: spacing.lg,
              textAlign: 'center',
            }}>تأكيد الحضور</Text>

            <View style={{ marginBottom: spacing.md }}>
              <Text style={{
                fontSize: typography.sizes.sm,
                fontWeight: typography.weights.semibold,
                color: colors.text,
                marginBottom: spacing.xs,
              }}>وش بتجيب معك؟ (اللعبة)</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TextInput
                  style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    borderRadius: borderRadius.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm + 2,
                    fontSize: typography.sizes.md,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                    textAlign: 'right',
                  }}
                  placeholder="مثال: كاتان، مونوبولي"
                  placeholderTextColor={colors.textLight}
                  value={gameBrought}
                  onChangeText={setGameBrought}
                />
                <Pressable
                  style={({ pressed }) => ({
                    backgroundColor: colors.accent,
                    borderRadius: borderRadius.md,
                    paddingHorizontal: spacing.md,
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: pressed ? 0.7 : 1,
                  })}
                  onPress={() => setShowBGGPicker(true)}
                >
                  <MaterialIcons name="search" size={22} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

            <View style={{ marginBottom: spacing.lg }}>
              <Text style={{
                fontSize: typography.sizes.sm,
                fontWeight: typography.weights.semibold,
                color: colors.text,
                marginBottom: spacing.xs,
              }}>الخفايف 🍿</Text>
              <TextInput
                style={{
                  backgroundColor: colors.background,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm + 2,
                  fontSize: typography.sizes.md,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                  textAlign: 'right',
                }}
                placeholder="مثال: قهوة، حلا، فطائر"
                placeholderTextColor={colors.textLight}
                value={snackBrought}
                onChangeText={setSnackBrought}
              />
            </View>

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
                onPress={() => setShowJoinModal(false)}
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
                onPress={handleJoin}
              >
                <Text style={{
                  fontSize: typography.sizes.md,
                  fontWeight: typography.weights.bold,
                  color: '#FFFFFF',
                }}>تأكيد</Text>
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
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.md,
        }}>
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            width: '100%',
            maxWidth: 400,
          }}>
            <RandomPicker
              items={attendeeNames}
              title="من يبدأ؟"
              onPick={(name) => {
                showAlert('الفائز!', `${name} سيبدأ اللعب أولاً`);
                setShowPickerModal(false);
              }}
            />
            <Pressable
              style={({ pressed }) => [{
                backgroundColor: colors.background,
                paddingVertical: spacing.sm + 2,
                paddingHorizontal: spacing.lg,
                borderRadius: borderRadius.md,
                marginTop: spacing.md,
                alignItems: 'center',
              }, pressed && { opacity: 0.7 }]}
              onPress={() => setShowPickerModal(false)}
            >
              <Text style={{
                fontSize: typography.sizes.md,
                fontWeight: typography.weights.semibold,
                color: colors.text,
              }}>إغلاق</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* BGG Game Picker */}
      <BGGGamePicker
        visible={showBGGPicker}
        onClose={() => setShowBGGPicker(false)}
        onSelect={(name) => setGameBrought(name)}
        playerCount={session.attendees.length + 1}
      />
    </ScrollView>
  );
}
