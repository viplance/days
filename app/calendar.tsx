import { eachDayOfInterval, format, isBefore, parseISO } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { v4 as uuidv4 } from 'uuid';
import { Colors } from '../src/constants/colors';
import { Cycle, Storage } from '../src/utils/storage';

export default function CalendarScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mode, cycleId } = useLocalSearchParams();

  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(
    null,
  );
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);

  const onDayPress = (day: DateData) => {
    if (mode === 'end') {
      setSelectedStartDate(day.dateString); // Only need one date
      return;
    }

    // Range selection
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(day.dateString);
      setSelectedEndDate(null);
    } else if (selectedStartDate && !selectedEndDate) {
      if (isBefore(parseISO(day.dateString), parseISO(selectedStartDate))) {
        setSelectedStartDate(day.dateString);
      } else if (day.dateString !== selectedStartDate) {
        setSelectedEndDate(day.dateString);
      }
    }
  };

  const getMarkedDates = () => {
    const marks: any = {};
    if (selectedStartDate) {
      marks[selectedStartDate] = {
        startingDay: true,
        color: Colors.secondary,
        textColor: 'white',
      };
    }
    if (selectedEndDate) {
      marks[selectedEndDate] = {
        endingDay: true,
        color: Colors.secondary,
        textColor: 'white',
      };
      // Fill in between
      if (selectedStartDate) {
        const start = parseISO(selectedStartDate);
        const end = parseISO(selectedEndDate);
        const days = eachDayOfInterval({ start, end });
        days.forEach((d) => {
          const str = format(d, 'yyyy-MM-dd');
          if (str !== selectedStartDate && str !== selectedEndDate) {
            marks[str] = { color: Colors.secondary, textColor: 'white' };
          }
        });
      }
    }
    return marks;
  };

  const handleSave = async () => {
    if (mode === 'end') {
      if (!selectedStartDate) return;
      // Update existing cycle
      const cId = Array.isArray(cycleId) ? cycleId[0] : cycleId;
      const cycles = await Storage.getCycles();
      const cycle = cycles.find((c) => c.id === cId);
      if (cycle) {
        cycle.endDate = selectedStartDate;
        await Storage.saveCycle(cycle);
      }
      router.push('/');
    } else {
      // New cycle
      if (!selectedStartDate) return;
      const newCycle: Cycle = {
        id: uuidv4(),
        startDate: selectedStartDate,
        endDate: selectedEndDate || undefined,
      };

      // Check if open cycle exists? Warning?
      // Assuming simplified flow for now or user checks Warning manually.
      await Storage.saveCycle(newCycle);

      if (mode === 'start') {
        router.push('/congrats');
      } else {
        router.push('/');
      }
    }
  };

  return (
    <View className="flex-1 bg-background p-4 pt-10">
      <Text className="text-2xl font-bold text-center text-primary mb-2">
        {t('check_days')}
      </Text>

      <Calendar
        onDayPress={onDayPress}
        markedDates={getMarkedDates()}
        markingType={'period'}
        theme={{
          calendarBackground: Colors.background,
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: Colors.secondary,
          selectedDayTextColor: '#ffffff',
          todayTextColor: Colors.primary,
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: Colors.secondary,
          selectedDotColor: '#ffffff',
          arrowColor: Colors.primary,
          monthTextColor: Colors.text,
          indicatorColor: Colors.primary,
        }}
      />

      <TouchableOpacity
        onPress={handleSave}
        className="bg-primary py-4 rounded-xl mt-8 mx-4"
      >
        <Text className="text-white text-center font-bold text-lg">
          {t('save')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
