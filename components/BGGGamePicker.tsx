import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, borderRadius, typography } from '@/constants/theme';
import { fetchBGGCollection, filterByPlayerCount } from '@/services/bggService';
import { BGGGame } from '@/types';

const BGG_USERNAME_KEY = '@nard_bgg_username';

interface BGGGamePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (gameName: string) => void;
  playerCount?: number; // for auto-filtering
}

export function BGGGamePicker({ visible, onClose, onSelect, playerCount }: BGGGamePickerProps) {
  const { colors, shadows } = useTheme();
  const [games, setGames] = useState<BGGGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [bggUsername, setBggUsername] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSearch('');
      setError(null);
      AsyncStorage.getItem(BGG_USERNAME_KEY).then((val) => {
        setBggUsername(val);
        if (val && games.length === 0) {
          loadGames(val);
        }
      });
    }
  }, [visible]);

  const loadGames = async (username: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBGGCollection(username);
      setGames(data);
    } catch (e: any) {
      setError(e.message || 'فشل جلب الألعاب');
    } finally {
      setLoading(false);
    }
  };

  const filteredGames = useMemo(() => {
    let result = games;

    // Filter by player count if available and not showing all
    if (playerCount && !showAll) {
      result = filterByPlayerCount(result, playerCount);
    }

    // Filter by search text
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((g) => g.name.toLowerCase().includes(q));
    }

    return result;
  }, [games, playerCount, showAll, search]);

  const totalCount = games.length;
  const filteredCount = filteredGames.length;

  const renderGame = ({ item }: { item: BGGGame }) => (
    <Pressable
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: pressed ? colors.surfaceLight : colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.sm,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
      })}
      onPress={() => {
        onSelect(item.name);
        onClose();
      }}
    >
      {item.thumbnail ? (
        <Image
          source={{ uri: item.thumbnail }}
          style={{
            width: 50,
            height: 50,
            borderRadius: borderRadius.sm,
            backgroundColor: colors.surfaceLight,
          }}
        />
      ) : (
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: borderRadius.sm,
            backgroundColor: colors.surfaceLight,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <MaterialIcons name="casino" size={24} color={colors.textLight} />
        </View>
      )}

      <View style={{ flex: 1, marginStart: spacing.sm }}>
        <Text
          style={{
            fontSize: typography.sizes.md,
            fontWeight: typography.weights.semibold,
            color: colors.text,
          }}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <MaterialIcons name="people" size={14} color={colors.textSecondary} />
            <Text style={{ fontSize: typography.sizes.xs, color: colors.textSecondary }}>
              {item.minPlayers}-{item.maxPlayers}
            </Text>
          </View>
          {item.avgRating > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <MaterialIcons name="star" size={14} color={colors.secondary} />
              <Text style={{ fontSize: typography.sizes.xs, color: colors.textSecondary }}>
                {item.avgRating}
              </Text>
            </View>
          )}
        </View>
      </View>

      <MaterialIcons name="chevron-left" size={20} color={colors.textLight} />
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: borderRadius.xl,
            borderTopRightRadius: borderRadius.xl,
            maxHeight: '80%',
            paddingTop: spacing.md,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: spacing.md,
              marginBottom: spacing.md,
            }}
          >
            <Text
              style={{
                fontSize: typography.sizes.lg,
                fontWeight: typography.weights.bold,
                color: colors.text,
              }}
            >
              اختر لعبة من BGG
            </Text>
            <Pressable onPress={onClose} style={{ padding: spacing.xs }}>
              <MaterialIcons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {!bggUsername ? (
            // No BGG username saved
            <View
              style={{
                alignItems: 'center',
                paddingVertical: spacing.xxl,
                paddingHorizontal: spacing.md,
              }}
            >
              <MaterialIcons name="link-off" size={48} color={colors.textLight} />
              <Text
                style={{
                  fontSize: typography.sizes.md,
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginTop: spacing.md,
                }}
              >
                أضف حساب BGG من الملف الشخصي أولاً
              </Text>
            </View>
          ) : loading ? (
            <View style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={{
                  fontSize: typography.sizes.sm,
                  color: colors.textSecondary,
                  marginTop: spacing.md,
                }}
              >
                جاري جلب ألعاب {bggUsername}...
              </Text>
            </View>
          ) : error ? (
            <View
              style={{
                alignItems: 'center',
                paddingVertical: spacing.xxl,
                paddingHorizontal: spacing.md,
              }}
            >
              <MaterialIcons name="error-outline" size={48} color={colors.error} />
              <Text
                style={{
                  fontSize: typography.sizes.md,
                  color: colors.error,
                  textAlign: 'center',
                  marginTop: spacing.md,
                }}
              >
                {error}
              </Text>
              <Pressable
                style={{
                  marginTop: spacing.md,
                  backgroundColor: colors.primary,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.md,
                }}
                onPress={() => loadGames(bggUsername)}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: typography.weights.semibold }}>
                  إعادة المحاولة
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Search */}
              <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.sm }}>
                <TextInput
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: borderRadius.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    fontSize: typography.sizes.md,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                    textAlign: 'right',
                  }}
                  placeholder="ابحث عن لعبة..."
                  placeholderTextColor={colors.textLight}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              {/* Player count filter toggle */}
              {playerCount && (
                <Pressable
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: spacing.md,
                    marginBottom: spacing.sm,
                  }}
                  onPress={() => setShowAll(!showAll)}
                >
                  <Text style={{ fontSize: typography.sizes.sm, color: colors.textSecondary }}>
                    {showAll
                      ? `كل الألعاب (${totalCount})`
                      : `مناسبة لـ ${playerCount} لاعبين (${filteredCount}/${totalCount})`}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.xs,
                      backgroundColor: showAll ? colors.surfaceLight : colors.primary + '20',
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      borderRadius: borderRadius.round,
                    }}
                  >
                    <MaterialIcons
                      name={showAll ? 'filter-list-off' : 'filter-list'}
                      size={16}
                      color={showAll ? colors.textLight : colors.primary}
                    />
                    <Text
                      style={{
                        fontSize: typography.sizes.xs,
                        color: showAll ? colors.textLight : colors.primary,
                        fontWeight: typography.weights.medium,
                      }}
                    >
                      {showAll ? 'بدون فلتر' : 'مفلتر'}
                    </Text>
                  </View>
                </Pressable>
              )}

              {/* Games list */}
              <FlatList
                data={filteredGames}
                keyExtractor={(item) => item.id}
                renderItem={renderGame}
                contentContainerStyle={{
                  paddingHorizontal: spacing.md,
                  paddingBottom: spacing.xxl,
                }}
                ListEmptyComponent={
                  <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                    <Text style={{ fontSize: typography.sizes.md, color: colors.textSecondary }}>
                      لا توجد ألعاب مطابقة
                    </Text>
                  </View>
                }
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
