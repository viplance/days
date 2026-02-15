import { Cycle } from '@/src/types/cycle.type';
import { differenceInDays, format, parseISO, startOfDay } from 'date-fns';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'; // Alert as fallback
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '../src/utils/storage';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [lastCycle, setLastCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);

    const cycles = await Storage.getCycles();
    const cycleLength = await Storage.getCycleLength();

    if (cycles.length > 0) {
      // Sort by startDate desc
      cycles.sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
      );
      setLastCycle(cycles[0]);
    } else {
      setLastCycle(null);
    }

    if (cycles.length === 0 && cycleLength === null) {
      setLoading(false);
      router.replace('/onboarding');
      return;
    }

    setLoading(false);

    // Handle redirect logic
    if (cycles.length > 0) {
      const startDate = cycles[0].startDate;
      const endDate = cycles[0].endDate;
      const today = format(new Date(), 'yyyy-MM-dd');
      const dayFromStart = differenceInDays(
        startOfDay(parseISO(today)),
        startOfDay(parseISO(startDate)),
      );

      if (endDate && dayFromStart < 20) {
        router.push({ pathname: '/history', params: {} });
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const handleYes = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');

    if (lastCycle && !lastCycle.endDate) {
      // Ending current cycle
      const updatedCycle = { ...lastCycle, endDate: today };
      await Storage.saveCycle(updatedCycle);
      loadData(); // Refresh state
      router.push('/history');
    } else {
      // Starting new cycle
      const newCycle: Cycle = { id: uuidv4(), startDate: today };
      await Storage.saveCycle(newCycle);
      loadData();
      router.push('/congrats');
    }
  };

  const handleEarlier = () => {
    if (lastCycle && !lastCycle.endDate) {
      // Ending current cycle earlier
      router.push({
        pathname: '/calendar',
        params: { mode: 'end', cycleId: lastCycle.id },
      });
    } else {
      // Starting new cycle earlier
      router.push({ pathname: '/calendar', params: { mode: 'start' } }); // Or 'start'
    }
  };

  const isPeriodActive = lastCycle && !lastCycle.endDate;

  if (loading) return <View className="flex-1 bg-background" />;

  return (
    <View className="flex-1 bg-background justify-between p-6">
      {/* Header handled by _layout but we can add title if needed? Designed as simple screen. */}

      <View className="flex-1 justify-center items-center">
        {height > 600 && (
          <Image
            source={require('../assets/images/enotix-logo.svg')}
            style={{ width: 150, height: 150 }}
            contentFit="contain"
            className="mb-8"
          />
        )}
        <Text className="text-3xl font-bold text-center text-text mb-10">
          {isPeriodActive ? t('end_question') : t('start_question')}
        </Text>

        <View className="w-full">
          <TouchableOpacity
            onPress={handleYes}
            className="w-full bg-primary py-4 rounded-xl mb-4 items-center shadow-md active:opacity-80"
          >
            <Text className="text-white text-xl font-semibold">{t('yes')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleEarlier}
            className="w-full border-2 border-primary py-4 rounded-xl items-center active:bg-gray-100"
          >
            <Text className="text-primary text-xl font-semibold">
              {t('earlier')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer / History Button */}
      <View className="items-center pb-8">
        <TouchableOpacity onPress={() => router.push('/history')}>
          <Text className="text-secondary text-lg underline">
            {t('history')}
          </Text>
        </TouchableOpacity>
        {/* <ScssExample /> */}
      </View>
    </View>
  );
}
