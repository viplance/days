import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Colors } from '../src/constants/colors';
import { Storage } from '../src/utils/storage';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [selectedDays, setSelectedDays] = useState(28);
  const flatListRef = useRef<FlatList>(null);

  // Generate numbers from 20 to 45
  const numbers = Array.from({ length: 26 }, (_, i) => i + 20);

  // Calculate item width based on screen width
  const ITEM_WIDTH = width * 0.25;
  const SPACER_WIDTH = (width - ITEM_WIDTH) / 2;

  useEffect(() => {
    // Scroll to 28 (index 8: 20, 21, ..., 28)
    // 28 - 20 = 8
    const initialIndex = numbers.indexOf(28);
    if (initialIndex >= 0) {
      // We need to wait a bit for layout
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false,
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [numbers]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / ITEM_WIDTH);
    const value = numbers[index];
    if (value && value !== selectedDays) {
      setSelectedDays(value);
    }
  };

  const handleSave = async () => {
    await Storage.setCycleLength(selectedDays);
    if (router.canDismiss()) {
      router.dismiss();
    } else {
      router.replace('/');
    }
  };

  const renderItem = ({ item }: { item: number }) => {
    const isSelected = item === selectedDays;
    return (
      <View
        style={{
          width: ITEM_WIDTH,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: isSelected ? 48 : 28,
            fontWeight: isSelected ? 'bold' : 'normal',
            color: isSelected ? Colors.primary : '#e0e0e0',
            transform: [{ scale: isSelected ? 1.2 : 1 }],
          }}
        >
          {item}
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background pt-20 px-4 items-center justify-between pb-10">
      <View className="items-center">
        <Text className="text-2xl font-bold text-center text-text mb-4">
          {t('cycle_length_question')}
        </Text>
        <Text className="text-base text-gray-500 text-center px-4">
          {t('cycle_length_description')}
        </Text>
      </View>

      <View className="h-60 justify-center w-full">
        {/* Selection Indicator Background - optional, maybe just the text highlight is enough */}
        {/* <View
          className="absolute bg-gray-100 rounded-lg pointer-events-none"
          style={{
            width: ITEM_WIDTH,
            height: ITEM_WIDTH,
            left: (width - ITEM_WIDTH) / 2 - 16, 
          }}
        /> */}

        <FlatList
          ref={flatListRef}
          data={numbers}
          renderItem={renderItem}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_WIDTH}
          decelerationRate="fast"
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingHorizontal: SPACER_WIDTH,
            alignItems: 'center',
          }}
          getItemLayout={(_, index) => ({
            length: ITEM_WIDTH,
            offset: ITEM_WIDTH * index,
            index,
          })}
          extraData={selectedDays}
        />
      </View>

      <TouchableOpacity
        onPress={handleSave}
        className="w-full bg-primary py-4 rounded-xl shadow-md active:opacity-90 flex-row justify-center items-center"
      >
        <Text className="text-white text-xl font-bold mr-2">{t('save')}</Text>
        <Ionicons name="checkmark" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}
