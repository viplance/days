import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import i18n from 'i18next';
import { useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import '../global.css';
import { Colors } from '../src/constants/colors';
import initI18n from '../src/i18n';
import { setCalendarLocale } from '../src/utils/calendar-i18n';

export default function RootLayout() {
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log('App mounting, init i18n...');
    initI18n().then(() => {
      setIsI18nInitialized(true);
      console.log('i18n initialized');
      setCalendarLocale(i18n.language);
    });
  }, []);

  if (!isI18nInitialized) {
    return <View />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.background },
          headerShadowVisible: false,
          headerTitleStyle: { color: Colors.text },
          headerTintColor: Colors.text,
          contentStyle: { backgroundColor: Colors.background },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/language')}
              className="mr-4"
            >
              <Ionicons name="globe-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      >
        <Stack.Screen name="index" options={{ title: '' }} />
        <Stack.Screen name="history" options={{ title: '' }} />
        <Stack.Screen name="calendar" options={{ title: '' }} />
        <Stack.Screen
          name="congrats"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="language"
          options={{ presentation: 'modal', title: '' }}
        />
        {/* Warning screen as modal or alert? User said "Screen". I'll use modal. */}
        <Stack.Screen
          name="warning"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="onboarding"
          options={{ presentation: 'modal', headerShown: false }}
        />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
