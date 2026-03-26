
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useSessions } from '@/hooks/useSessions';
import { RandomPicker, BGGGamePicker, GameWheel } from '@/components';
import { loadBGGCollection } from '@/services/bggService';
import { getUserProfile } from '@/services/supabaseService';
import { spacing, borderRadius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAlert } from '@/template';
import { GameVoteResult } from '@/types';

const STATUS_CONFIG = {
  upcoming: { label: 'قادمة', icon: 'schedule' as const },
  ongoing: { label: 'جارية الآن', icon: 'play-circle-filled' as const },
  completed: { label: 'منتهية', icon: 'check-circle' as const },
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { 
    sessions, 
    joinSession, 
    leaveSession, 
    rateSession, 
    startSession, 
    endSession,
    deleteSession,
    addFoodOrder,
    updateFoodOrder,
    deleteFoodOrder,
    addGameVote,
    removeGameVote,
    getUserVoteCount,
    refreshSessions,
  } = useSessions();
  const { showAlert } = useAlert();
  const { colors, shadows } = useTheme();

  const [isDeleted, setIsDeleted] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [gameBrought, setGameBrought] = useState('');
  const [snackBrought, setSnackBrought] = useState('');
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showBGGPicker, setShowBGGPicker] = useState(false);
  const [showGameWheelModal, setShowGameWheelModal] = useState(false);
  
  const [hasBGGGames, setHasBGGGames] = useState(false);
  const [lastFoodOrder, setLastFoodOrder] = useState<string | null>(null);
  
  const [foodOrderText, setFoodOrderText] = useState('');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [voteCount, setVoteCount] = useState(0);

  // Check if user has BGG collection on mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      const games = await loadBGGCollection();
      setHasBGGGames(games.length > 0);
      
      const profile = await getUserProfile(user.id);
      if (profile?.last_food_order) {
        setLastFoodOrder(profile.last_food_order);
      }
    };
    
    loadUserData();
  }, [user]);

  const session = sessions.find(s => s.id === id);

  // Timer for ongoing sessions
  useEffect(() => {
    if (!session || session.status !== 'ongoing' || !session.startedAt) return;

    const startTime = new Date(session.startedAt).getTime();
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session?.status, session?.startedAt]);

  // Load user vote count
  useEffect(() => {
    if (!session || !user) return;
    getUserVoteCount(session.id, user.id).then(setVoteCount);
  }, [session?.id, user?.id, session?.gameVotes]);

  // Refresh sessions periodically for real-time updates (polling)
  useEffect(() => {
    if (isDeleted) return;
    const interval = setInterval(() => {
      refreshSessions();
    }, 5000);
    return () => clearInterval(interval);
  }, [isDeleted]);

  // Auto-redirect if session was deleted by someone else
  useEffect(() => {
    if (!session && user && !isDeleted) {
      router.replace('/(tabs)');
    }
  }, [session, user, isDeleted]);

  // ✅ ALL useMemo hooks MUST be before early return
  // Aggregate games from attendees
  const allGamesBrought = useMemo(() => {
    if (!session) return [];
    const games: string[] = [];
    session.attendees.forEach(a => {
      if (a.gameBrought) {
        games.push(a.gameBrought);
      }
    });
    return games;
  }, [session?.attendees]);

  // Calculate vote results
  const voteResults: GameVoteResult[] = useMemo(() => {
    if (!session) return [];
    const voteMap = new Map<string, { count: number; voters: string[] }>();
    
    (session.gameVotes || []).forEach(vote => {
      const current = voteMap.get(vote.gameName) || { count: 0, voters: [] };
      const voter = session.attendees.find(a => a.userId === vote.userId);
      voteMap.set(vote.gameName, {
        count: current.count + 1,
        voters: [...current.voters, voter?.userName || 'غير معروف'],
      });
    });

    return Array.from(voteMap.entries())
      .map(([gameName, { count, voters }]) => ({
        gameName,
        voteCount: count,
        voters,
      }))
      .sort((a, b) => b.voteCount - a.voteCount);
  }, [session?.gameVotes, session?.attendees]);

  const userVotes = useMemo(() => {
    if (!session || !user) return [];
    return (session.gameVotes || [])
      .filter(v => v.userId === user.id)
      .map(v => v.gameName);
  }, [session?.gameVotes, user?.id]);

  // ✅ Early return AFTER all hooks
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
  const isOngoing = session.status === 'ongoing';
  const isUpcoming = session.status === 'upcoming';
  const isCompleted = session.status === 'completed';

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

  const handleStartSession = async () => {
    if (!isHost) {
      return;
    }
    
    showAlert('بدء الجلسة', 'هل تريد بدء الجلسة الآن؟ سيتم إرسال إشعار للحضور.', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'بدء',
        onPress: async () => {
          try {
            await startSession(session.id);
            showAlert('تم!', 'بدأت الجلسة - تم إرسال إشعار للحضور');
          } catch (error) {
            console.error('Error in handleStartSession:', error);
            const errorMessage = error instanceof Error ? error.message : 'فشل بدء الجلسة';
            showAlert('خطأ', errorMessage);
          }
        },
      },
    ]);
  };

  const handleEndSession = async () => {
    if (!isHost) {
      return;
    }
    
    showAlert('إنهاء الجلسة', 'هل تريد إنهاء الجلسة؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'إنهاء',
        style: 'destructive',
        onPress: async () => {
          try {
            await endSession(session.id, elapsedTime);
            showAlert('تم!', 'انتهت الجلسة - يمكنك الآن التقييم');
          } catch (error) {
            console.error('Error in handleEndSession:', error);
            const errorMessage = error instanceof Error ? error.message : 'فشل إنهاء الجلسة';
            showAlert('خطأ', errorMessage);
          }
        },
      },
    ]);
  };

  const handleDeleteSession = async () => {
    if (!isHost) {
      return;
    }
    
    showAlert(
      'حذف الجلسة', 
      'هل أنت متأكد من حذف هذه الجلسة؟ لا يمكن التراجع عن هذا الإجراء.', 
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleted(true);
              await deleteSession(session.id);
              await refreshSessions();
              router.replace('/(tabs)');
              setTimeout(() => {
                showAlert('تم!', 'تم حذف الجلسة بنجاح');
              }, 300);
            } catch (error) {
              console.error('Error in handleDeleteSession:', error);
              const errorMessage = error instanceof Error ? error.message : 'فشل حذف الجلسة';
              showAlert('خطأ', errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleAddFoodOrder = async () => {
    if (!foodOrderText.trim()) return;
    
    if (editingOrderId) {
      await updateFoodOrder(editingOrderId, foodOrderText.trim());
      setEditingOrderId(null);
    } else {
      await addFoodOrder(session.id, user.id, user.name, foodOrderText.trim());
    }
    
    setFoodOrderText('');
  };

  const handleDeleteFoodOrder = async (orderId: string) => {
    showAlert('حذف الطلب', 'هل تريد حذف هذا الطلب؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          await deleteFoodOrder(orderId);
        },
      },
    ]);
  };

  const handleEditFoodOrder = (orderId: string, orderText: string) => {
    setEditingOrderId(orderId);
    setFoodOrderText(orderText);
  };

  const handleToggleGameVote = async (gameName: string) => {
    if (userVotes.includes(gameName)) {
      await removeGameVote(session.id, user.id, gameName);
    } else {
      if (voteCount >= 3) {
        showAlert('تنبيه', 'يمكنك التصويت لـ 3 ألعاب كحد أقصى');
        return;
      }
      await addGameVote(session.id, user.id, gameName);
    }
  };

  const attendeeNames = session.attendees.map(a => a.userName);
  const AVATAR_COLORS = [colors.primary, colors.accent, colors.secondary, colors.badge];

  const myFoodOrders = (session.foodOrders || []).filter(f => f.userId === user.id);
  const allFoodOrders = session.foodOrders || [];

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
        {isOngoing && (
          <Text style={{
            fontSize: typography.sizes.md,
            fontWeight: typography.weights.bold,
            color: statusColor,
            marginStart: spacing.md,
          }}>
            {formatDuration(elapsedTime)}
          </Text>
        )}
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
      </View>

      {/* Host Controls */}
      {isHost && isUpcoming && (
        <View style={{ marginBottom: spacing.lg }}>
          <Pressable
            style={({ pressed }) => [{
              flexDirection: 'row',
              backgroundColor: colors.success,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadows.md,
            }, pressed && { opacity: 0.8 }]}
            onPress={handleStartSession}
          >
            <MaterialIcons name="play-circle-filled" size={24} color="#FFFFFF" />
            <Text style={{
              fontSize: typography.sizes.lg,
              fontWeight: typography.weights.bold,
              color: '#FFFFFF',
              marginStart: spacing.sm,
            }}>بدء الجلسة</Text>
          </Pressable>
        </View>
      )}

      {isHost && isOngoing && (
        <View style={{ marginBottom: spacing.lg }}>
          <Pressable
            style={({ pressed }) => [{
              flexDirection: 'row',
              backgroundColor: colors.error,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadows.md,
            }, pressed && { opacity: 0.8 }]}
            onPress={handleEndSession}
          >
            <MaterialIcons name="stop-circle" size={24} color="#FFFFFF" />
            <Text style={{
              fontSize: typography.sizes.lg,
              fontWeight: typography.weights.bold,
              color: '#FFFFFF',
              marginStart: spacing.sm,
            }}>إنهاء الجلسة</Text>
          </Pressable>
        </View>
      )}

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

      {/* Food Orders (Only for ongoing sessions and attendees) */}
      {isOngoing && isAttending && (
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{
            fontSize: typography.sizes.lg,
            fontWeight: typography.weights.semibold,
            color: colors.text,
            marginBottom: spacing.sm,
          }}>طلبات الأكل 🍕</Text>
          
          {/* Add/Edit Order */}
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.sm,
            ...shadows.sm,
          }}>
            {lastFoodOrder && !editingOrderId && myFoodOrders.length === 0 && (
              <Pressable
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.primaryLight + '15',
                  borderRadius: borderRadius.sm,
                  padding: spacing.sm,
                  marginBottom: spacing.sm,
                }}
                onPress={() => setFoodOrderText(lastFoodOrder)}
              >
                <MaterialIcons name="history" size={16} color={colors.primary} />
                <Text style={{
                  fontSize: typography.sizes.xs,
                  color: colors.primary,
                  marginStart: spacing.xs,
                  flex: 1,
                }}>اقتراح من آخر جلسة: {lastFoodOrder}</Text>
              </Pressable>
            )}
            
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: colors.background,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  fontSize: typography.sizes.md,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                  textAlign: 'right',
                }}
                placeholder="أضف طلبك..."
                placeholderTextColor={colors.textLight}
                value={foodOrderText}
                onChangeText={setFoodOrderText}
              />
              <Pressable
                style={({ pressed }) => [{
                  backgroundColor: colors.primary,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.lg,
                  justifyContent: 'center',
                  alignItems: 'center',
                }, pressed && { opacity: 0.7 }]}
                onPress={handleAddFoodOrder}
              >
                <MaterialIcons 
                  name={editingOrderId ? "check" : "add"} 
                  size={24} 
                  color="#FFFFFF" 
                />
              </Pressable>
              {editingOrderId && (
                <Pressable
                  style={({ pressed }) => [{
                    backgroundColor: colors.error,
                    borderRadius: borderRadius.md,
                    paddingHorizontal: spacing.md,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }, pressed && { opacity: 0.7 }]}
                  onPress={() => {
                    setEditingOrderId(null);
                    setFoodOrderText('');
                  }}
                >
                  <MaterialIcons name="close" size={24} color="#FFFFFF" />
                </Pressable>
              )}
            </View>
          </View>

          {/* All Orders */}
          {allFoodOrders.length > 0 && (
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              ...shadows.sm,
            }}>
              <Text style={{
                fontSize: typography.sizes.sm,
                fontWeight: typography.weights.semibold,
                color: colors.textSecondary,
                marginBottom: spacing.sm,
              }}>جميع الطلبات ({allFoodOrders.length})</Text>
              {allFoodOrders.map((order) => (
                <View
                  key={order.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: colors.background,
                    borderRadius: borderRadius.sm,
                    padding: spacing.sm,
                    marginBottom: spacing.xs,
                    borderStartWidth: order.userId === user.id ? 3 : 0,
                    borderStartColor: colors.primary,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: typography.sizes.xs,
                      color: colors.textLight,
                    }}>{order.userName}</Text>
                    <Text style={{
                      fontSize: typography.sizes.md,
                      color: colors.text,
                      fontWeight: typography.weights.medium,
                    }}>{order.orderText}</Text>
                  </View>
                  {order.userId === user.id && (
                    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                      <Pressable
                        style={({ pressed }) => ({
                          padding: spacing.xs,
                          opacity: pressed ? 0.5 : 1,
                        })}
                        onPress={() => handleEditFoodOrder(order.id, order.orderText)}
                      >
                        <MaterialIcons name="edit" size={18} color={colors.accent} />
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => ({
                          padding: spacing.xs,
                          opacity: pressed ? 0.5 : 1,
                        })}
                        onPress={() => handleDeleteFoodOrder(order.id)}
                      >
                        <MaterialIcons name="delete" size={18} color={colors.error} />
                      </Pressable>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Games List */}
      {allGamesBrought.length > 0 && (
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{
            fontSize: typography.sizes.lg,
            fontWeight: typography.weights.semibold,
            color: colors.text,
            marginBottom: spacing.sm,
          }}>الألعاب المتوفرة 🎲</Text>
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            ...shadows.sm,
          }}>
            {allGamesBrought.map((game, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.background,
                  borderRadius: borderRadius.sm,
                  padding: spacing.sm,
                  marginBottom: index < allGamesBrought.length - 1 ? spacing.xs : 0,
                }}
              >
                <MaterialIcons name="videogame-asset" size={18} color={colors.accent} />
                <Text style={{
                  fontSize: typography.sizes.md,
                  color: colors.text,
                  marginStart: spacing.sm,
                }}>{game}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Game Voting (Only if games available and session is ongoing/upcoming) */}
      {allGamesBrought.length > 0 && !isCompleted && (
        <View style={{ marginBottom: spacing.lg }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.sm,
          }}>
            <Text style={{
              fontSize: typography.sizes.lg,
              fontWeight: typography.weights.semibold,
              color: colors.text,
            }}>التصويت على الألعاب 🗳️</Text>
            <View style={{
              backgroundColor: colors.primary + '15',
              borderRadius: borderRadius.round,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
            }}>
              <Text style={{
                fontSize: typography.sizes.xs,
                color: colors.primary,
                fontWeight: typography.weights.bold,
              }}>صوّتك: {voteCount}/3</Text>
            </View>
          </View>

          {/* Vote Buttons */}
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.sm,
            ...shadows.sm,
          }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {allGamesBrought.map((game, index) => {
                const isVoted = userVotes.includes(game);
                return (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isVoted ? colors.primary : colors.background,
                      borderRadius: borderRadius.md,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      borderWidth: 1.5,
                      borderColor: isVoted ? colors.primary : colors.border,
                    }, pressed && { opacity: 0.7 }]}
                    onPress={() => handleToggleGameVote(game)}
                  >
                    <MaterialIcons 
                      name={isVoted ? "check-circle" : "radio-button-unchecked"} 
                      size={18} 
                      color={isVoted ? '#FFFFFF' : colors.textLight} 
                    />
                    <Text style={{
                      fontSize: typography.sizes.sm,
                      color: isVoted ? '#FFFFFF' : colors.text,
                      fontWeight: isVoted ? typography.weights.bold : typography.weights.medium,
                      marginStart: spacing.xs,
                    }}>{game}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Vote Results */}
          {voteResults.length > 0 && (
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              ...shadows.sm,
            }}>
              <Text style={{
                fontSize: typography.sizes.sm,
                fontWeight: typography.weights.semibold,
                color: colors.textSecondary,
                marginBottom: spacing.sm,
              }}>نتائج التصويت</Text>
              {voteResults.map((result, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: index === 0 ? colors.primary + '10' : colors.background,
                    borderRadius: borderRadius.sm,
                    padding: spacing.sm,
                    marginBottom: index < voteResults.length - 1 ? spacing.xs : 0,
                    borderWidth: index === 0 ? 1.5 : 0,
                    borderColor: colors.primary,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: typography.sizes.md,
                      color: index === 0 ? colors.primary : colors.text,
                      fontWeight: index === 0 ? typography.weights.bold : typography.weights.medium,
                    }}>
                      {index === 0 && '🏆 '}
                      {result.gameName}
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: index === 0 ? colors.primary : colors.accent,
                    borderRadius: borderRadius.round,
                    minWidth: 28,
                    height: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: spacing.sm,
                  }}>
                    <Text style={{
                      fontSize: typography.sizes.sm,
                      color: '#FFFFFF',
                      fontWeight: typography.weights.bold,
                    }}>{result.voteCount}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Game Wheel Button */}
      {allGamesBrought.length > 0 && (
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
            onPress={() => setShowGameWheelModal(true)}
          >
            <MaterialIcons name="casino" size={24} color="#FFFFFF" />
            <Text style={{
              fontSize: typography.sizes.lg,
              fontWeight: typography.weights.bold,
              color: '#FFFFFF',
              marginStart: spacing.sm,
            }}>عجلة اختيار اللعبة</Text>
          </Pressable>
        </View>
      )}

      {/* Random Picker Button */}
      {session.attendees.length > 0 && (
        <View style={{ marginBottom: spacing.lg }}>
          <Pressable
            style={({ pressed }) => [{
              flexDirection: 'row',
              backgroundColor: colors.secondary,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadows.md,
            }, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
            onPress={() => setShowPickerModal(true)}
          >
            <MaterialIcons name="shuffle" size={24} color="#FFFFFF" />
            <Text style={{
              fontSize: typography.sizes.lg,
              fontWeight: typography.weights.bold,
              color: '#FFFFFF',
              marginStart: spacing.sm,
            }}>عجلة الحظ - من يبدأ؟</Text>
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

      {/* Delete Session Button (Host only, not ongoing) */}
      {isHost && !isOngoing && (
        <View style={{ marginBottom: spacing.md }}>
          <Pressable
            style={({ pressed }) => [{
              flexDirection: 'row',
              backgroundColor: colors.surface,
              borderWidth: 1.5,
              borderColor: colors.error,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              justifyContent: 'center',
              ...shadows.sm,
            }, pressed && { opacity: 0.7, backgroundColor: colors.error + '08' }]}
            onPress={handleDeleteSession}
          >
            <MaterialIcons name="delete-forever" size={24} color={colors.error} />
            <Text style={{
              fontSize: typography.sizes.lg,
              fontWeight: typography.weights.semibold,
              color: colors.error,
              marginStart: spacing.sm,
            }}>حذف الجلسة</Text>
          </Pressable>
        </View>
      )}

      {/* Action Buttons */}
      <View style={{ marginTop: spacing.sm }}>
        {!isAttending && isUpcoming && (
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
            onPress={() => {
              if (hasBGGGames) {
                setShowBGGPicker(true);
              } else {
                setShowJoinModal(true);
              }
            }}
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
        )}
        
        {isAttending && isUpcoming && (
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}>
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
            >
              <View style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: borderRadius.xl,
                borderTopRightRadius: borderRadius.xl,
                padding: spacing.lg,
                paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.lg,
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                    <Text style={{
                      fontSize: typography.sizes.sm,
                      fontWeight: typography.weights.semibold,
                      color: colors.text,
                    }}>وش بتجيب معك؟ (اللعبة)</Text>
                    <Pressable
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.xs,
                        backgroundColor: colors.accent + '15',
                        paddingHorizontal: spacing.sm + 2,
                        paddingVertical: spacing.xs,
                        borderRadius: borderRadius.round,
                        opacity: pressed ? 0.7 : 1,
                      })}
                      onPress={() => {
                        setShowJoinModal(false);
                        setTimeout(() => setShowBGGPicker(true), 200);
                      }}
                    >
                      <MaterialIcons name="casino" size={14} color={colors.accent} />
                      <Text style={{
                        fontSize: typography.sizes.xs,
                        fontWeight: typography.weights.semibold,
                        color: colors.accent,
                      }}>اختر من BGG</Text>
                    </Pressable>
                  </View>
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
                    placeholder="مثال: كاتان، مونوبولي"
                    placeholderTextColor={colors.textLight}
                    value={gameBrought}
                    onChangeText={setGameBrought}
                  />
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
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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

      {/* Game Wheel Modal */}
      <Modal
        visible={showGameWheelModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGameWheelModal(false)}
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
            <Text style={{
              fontSize: typography.sizes.xl,
              fontWeight: typography.weights.bold,
              color: colors.text,
              marginBottom: spacing.lg,
              textAlign: 'center',
            }}>عجلة اختيار اللعبة</Text>
            
            <GameWheel
              games={allGamesBrought}
              onResult={(game) => {
                // Just show in wheel, don't close modal
              }}
            />
            
            <Pressable
              style={({ pressed }) => [{
                backgroundColor: colors.background,
                paddingVertical: spacing.sm + 2,
                paddingHorizontal: spacing.lg,
                borderRadius: borderRadius.md,
                marginTop: spacing.lg,
                alignItems: 'center',
              }, pressed && { opacity: 0.7 }]}
              onPress={() => setShowGameWheelModal(false)}
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
        onClose={() => {
          setShowBGGPicker(false);
          setTimeout(() => setShowJoinModal(true), 200);
        }}
        onSelect={(name) => setGameBrought(name)}
        playerCount={session.attendees.length + 1}
      />
    </ScrollView>
  );
}
