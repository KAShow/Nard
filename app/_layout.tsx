import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { AuthProvider } from '@/contexts/AuthContext';
import { SessionProvider } from '@/contexts/SessionContext';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <SessionProvider>
            <Stack screenOptions={{ headerShown: false }}>
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
                }} 
              />
              <Stack.Screen 
                name="session/[id]" 
                options={{ 
                  headerShown: true,
                  title: 'تفاصيل الجلسة',
                  headerTitleAlign: 'center',
                }} 
              />
            </Stack>
          </SessionProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
