import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nManager } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AlertProvider } from '@/template';
import { AuthProvider } from '@/contexts/AuthContext';
import { SessionProvider } from '@/contexts/SessionContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

// Force RTL for Arabic
if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
  I18nManager.allowRTL(true);
}

function ThemedStack() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="create-session"
        options={{
          headerShown: true,
          presentation: 'modal',
          title: 'إنشاء جلسة جديدة',
          headerTitleAlign: 'center',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="session/[id]"
        options={{
          headerShown: true,
          title: 'تفاصيل الجلسة',
          headerTitleAlign: 'center',
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AlertProvider>
          <SafeAreaProvider>
            <AuthProvider>
              <SessionProvider>
                <ThemedStack />
              </SessionProvider>
            </AuthProvider>
          </SafeAreaProvider>
        </AlertProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
