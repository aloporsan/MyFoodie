import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

function useAuthGuard(isAuthenticated: boolean, ready: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, ready, router]);
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isReady } = useAuth();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  useAuthGuard(isAuthenticated, fontsLoaded && isReady);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="despensa/form"              options={{ headerShown: false }} />
        <Stack.Screen name="despensa/[id]"              options={{ headerShown: false }} />
        <Stack.Screen name="despensa/filtrada"          options={{ headerShown: false }} />
        <Stack.Screen name="perfil/editar"              options={{ headerShown: false }} />
        <Stack.Screen name="perfil/estadisticas"        options={{ headerShown: false }} />
        <Stack.Screen name="perfil/preferencias"        options={{ headerShown: false }} />
        <Stack.Screen name="perfil/privacidad"          options={{ headerShown: false }} />
        <Stack.Screen name="perfil/recetas-guardadas"   options={{ headerShown: false }} />
        <Stack.Screen name="perfil/recetas-publicadas"  options={{ headerShown: false }} />
        <Stack.Screen name="receta/editar"              options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
