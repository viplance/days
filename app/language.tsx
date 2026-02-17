import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../src/constants/colors';
import { LANGUAGES } from '../src/i18n';
import { updateCalendarLocale } from '../src/utils/calendar-i18n';
import { Storage } from '../src/utils/storage';

export default function LanguageScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const changeLanguage = async (langCode: string) => {
    await i18n.changeLanguage(langCode);
    updateCalendarLocale(langCode);
    await Storage.setLanguage(langCode);
    router.back();
  };

  return (
    <View className="flex-1 bg-background p-6">
      <Text className="text-xl font-bold text-text mb-6 text-center">
        {t('select_language')}
      </Text>
      <FlatList
        data={LANGUAGES}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => changeLanguage(item.code)}
            className="flex-row items-center justify-between p-4 mb-2 bg-white rounded-lg shadow-sm"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 mr-4 overflow-hidden rounded-full">
                <Image
                  source={item.flag}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              <Text className="text-lg text-text">{item.name}</Text>
            </View>
            {i18n.language === item.code && (
              <Ionicons name="checkmark" size={24} color={Colors.primary} />
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
