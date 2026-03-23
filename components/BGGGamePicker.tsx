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
  onSelect: (gameNames: string) => void;
  playerCount?: number;
}

export function BGGGamePicker({ visible, onClose, onSelect, playerCount }: BGGGamePickerProps) {
  const { colors } = useTheme();
  const [games, setGames] = useState<BGGGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      setSearch('');
      setSelected(new Set());
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

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const names = games
      .filter((g) => selected.has(g.id))
      .map((g) => g.name);
    onSelect(names.join('، '));
    onClose();
  };

  const renderGame = ({ item }: { item: BGGGame }) => {
    const isSelected = selected.has(item.id);
    return (
      <Pressable
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isSelected
            ? colors.primary + '15'
            : pressed
            ? colors.surfaceLight
            : colors.surface,
          borderRadius: borderRadius.md,
          padding: spacing.sm,
          marginBottom: spacing.sm,
          borderWidth: isSelected ? 1.5 : 1,
          borderColor: isSelected ? colors.primary : colors.border,
        })}
        onPress={() => toggleSelect(item.id)}
      >
        {/* Checkbox */}
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: isSelected ? colors.primary : colors.textLight,
            backgroundColor: isSelected ? colors.primary : 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
            marginEnd: spacing.sm,
          }}
        >
          {isSelected && (
            <MaterialIcons name="check" size={16} color="#FFFFFF" />
          )}
        </View>

        {item.thumbnail || item.image ? (
          <Image
            source={{ uri: item.thumbnail || item.image }}
            style={{
              width: 46,
              height: 46,
              borderRadius: borderRadius.sm,
              backgroundColor: colors.surfaceLight,
            }}
          />
        ) : (
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: borderRadius.sm,
              backgroundColor: colors.surfaceLight,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <MaterialIcons name="casino" size={22} color={colors.textLight} />
          </View>
        )}

        <View style={{ flex: 1, marginStart: spacing.sm }}>
          <Text
            style={{
              fontSize: typography.sizes.md,
              fontWeight: isSelected ? typography.weights.bold : typography.weights.semibold,
              color: isSelected ? colors.primary : colors.text,
            }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <MaterialIcons name="people" size={13} color={colors.textSecondary} />
              <Text style={{ fontSize: typography.sizes.xs, color: colors.textSecondary }}>
                {item.minPlayers}-{item.maxPlayers}
              </Text>
            </View>
            {item.rating > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <MaterialIcons name="star" size={13} color={colors.secondary} />
                <Text style={{ fontSize: typography.sizes.xs, color: colors.textSecondary }}>
                  {Math.round(item.rating * 10) / 10}
                </Text>
              </View>
            )}
            {item.playingTime ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <MaterialIcons name="schedule" size={13} color={colors.textSecondary} />
                <Text style={{ fontSize: typography.sizes.xs, color: colors.textSecondary }}>
                  {item.playingTime}د
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  };

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
            maxHeight: '85%',
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
              marginBottom: spacing.sm,
            }}
          >
            <Text
              style={{
                fontSize: typography.sizes.lg,
                fontWeight: typography.weights.bold,
                color: colors.text,
              }}
            >
              اختر ألعابك
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
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border }}>
                  <MaterialIcons name="search" size={20} color={colors.textLight} style={{ paddingStart: spacing.sm }} />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.sm,
                      fontSize: typography.sizes.md,
                      color: colors.text,
                      textAlign: 'right',
                    }}
                    placeholder="ابحث عن لعبة..."
                    placeholderTextColor={colors.textLight}
                    value={search}
                    onChangeText={setSearch}
                  />
                  {search ? (
                    <Pressable onPress={() => setSearch('')} style={{ paddingEnd: spacing.sm }}>
                      <MaterialIcons name="clear" size={18} color={colors.textLight} />
                    </Pressable>
                  ) : null}
                </View>
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
                  paddingBottom: 100,
                }}
                ListEmptyComponent={
                  <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                    <Text style={{ fontSize: typography.sizes.md, color: colors.textSecondary }}>
                      لا توجد ألعاب مطابقة
                    </Text>
                  </View>
                }
              />

              {/* Confirm button - fixed at bottom */}
              {selected.size > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: colors.background,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.md,
                    paddingBottom: spacing.lg,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <Pressable
                    style={({ pressed }) => ({
                      backgroundColor: colors.primary,
                      paddingVertical: spacing.md,
                      borderRadius: borderRadius.md,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: spacing.sm,
                      opacity: pressed ? 0.8 : 1,
                    })}
                    onPress={handleConfirm}
                  >
                    <MaterialIcons name="check" size={22} color="#FFFFFF" />
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontWeight: typography.weights.bold,
                        fontSize: typography.sizes.md,
                      }}
                    >
                      تأكيد ({selected.size} {selected.size === 1 ? 'لعبة' : 'ألعاب'})
                    </Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
