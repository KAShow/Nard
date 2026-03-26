import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, View, Pressable, Text } from 'react-native';
import { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing } from '@/constants/theme';

const TAB_CONFIG: Record<string, { label: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  index: { label: 'الجلسات', icon: 'event' },
  profile: { label: 'الملف الشخصي', icon: 'person' },
};

const TAB_BAR_HEIGHT = 64;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();

  const tabBarBottom = useMemo(() => {
    return Platform.select({
      ios: Math.max(insets.bottom, 8) + 8,
      android: 16,
      default: 16,
    });
  }, [insets.bottom]);

  const sceneBottomPadding = useMemo(() => {
    return TAB_BAR_HEIGHT + tabBarBottom + 16;
  }, [tabBarBottom]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { paddingBottom: sceneBottomPadding, backgroundColor: colors.background },
      }}
      tabBar={({ state, navigation }) => {
        return (
          <View
            style={{
              position: 'absolute',
              bottom: tabBarBottom,
              left: 16,
              right: 16,
              backgroundColor: colors.surface,
              borderRadius: 24,
              flexDirection: 'row',
              height: TAB_BAR_HEIGHT,
              alignItems: 'center',
              ...shadows.lg,
            }}
          >
            {state.routes.map((route, index) => {
              const isActive = state.index === index;
              const config = TAB_CONFIG[route.name];

              if (!config) return null;

              return (
                <Pressable
                  key={route.key}
                  onPress={() => navigation.navigate(route.name)}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      ...(isActive
                        ? {
                            backgroundColor: colors.primary + '15',
                            borderRadius: 16,
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                          }
                        : {}),
                    }}
                  >
                    <MaterialIcons
                      name={config.icon}
                      size={24}
                      color={isActive ? colors.primary : colors.textLight}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '500',
                        color: isActive ? colors.primary : colors.textLight,
                        marginTop: 2,
                      }}
                    >
                      {config.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        );
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'الجلسات' }} />
      <Tabs.Screen name="profile" options={{ title: 'الملف الشخصي' }} />
    </Tabs>
  );
}
