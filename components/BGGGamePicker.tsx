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
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, borderRadius, typography } from '@/constants/theme';
import { loadBGGCollection, filterByPlayerCount } from '@/services/bggService';
import { BGGGame } from '@/types';

interface BGGGamePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (gameName: string) => void;
  playerCount?: number;
}

export function BGGGamePicker({ visible, onClose, onSelect, playerCount }: BGGGamePickerProps) {
  const { colors } = useTheme();
  const [games, setGames] = useState<BGGGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (visible) {
      setSearch('');
      setLoading(true);
      loadBGGCollection()
        .then(setGames)
        .finally(() => setLoading(false));
    }
  }, [visible]);

  const filteredGames = useMemo(() => {
    let result = games;

    if (playerCount && !showAll) {
      result = filterByPlayerCount(result, playerCount);
    }

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
      {item.thumbnail || item.image ? (
        <Image
          source={{ uri: item.thumbnail || item.image }}
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
          {item.rating > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <MaterialIcons name="star" size={14} color={colors.secondary} />
              <Text style={{ fontSize: typography.sizes.xs, color: colors.textSecondary }}>
                {Math.round(item.rating * 10) / 10}
              </Text>
            </View>
          )}
          {item.playingTime ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <MaterialIcons name="schedule" size={14} color={colors.textSecondary} />
              <Text style={{ fontSize: typography.sizes.xs, color: colors.textSecondary }}>
                {item.playingTime}م
              </Text>
            </View>
          ) : null}
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
              اختر لعبة من مجموعتك
            </Text>
            <Pressable onPress={onClose} style={{ padding: spacing.xs }}>
              <MaterialIcons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : totalCount === 0 ? (
            <View
              style={{
                alignItems: 'center',
                paddingVertical: spacing.xxl,
                paddingHorizontal: spacing.md,
              }}
            >
              <MaterialIcons name="cloud-off" size={48} color={colors.textLight} />
              <Text
                style={{
                  fontSize: typography.sizes.md,
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginTop: spacing.md,
                }}
              >
                لا توجد بيانات ألعاب{'\n'}استورد مجموعتك من الملف الشخصي
              </Text>
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
