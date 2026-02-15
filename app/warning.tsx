import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';

export default function WarningScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View className="flex-1 bg-black/50 justify-center items-center p-6">
      <View className="bg-white p-8 rounded-2xl w-full shadow-lg">
        <Text className="text-xl font-bold text-secondary mb-4 text-center">
          {t('warning_missing_end')}
        </Text>

        <View className="flex-row justify-around mt-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-primary py-3 px-6 rounded-lg mr-2"
          >
            <Text className="text-white font-semibold">{t('check')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              router.back();
              router.push('/history');
            }}
            className="border border-secondary py-3 px-6 rounded-lg"
          >
            <Text className="text-secondary font-semibold">{t('history')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
