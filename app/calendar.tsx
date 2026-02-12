import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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
  // For start-end mode: tracks click sequence
  const [clickCount, setClickCount] = useState(0);

  const onDayPress = useCallback(
    (day: DateData) => {
      const dateString = day.dateString;

      if (mode === 'start') {
        // Start-only mode: select a single day
        setSelectedStartDate(dateString);
        setSelectedEndDate(null);
        return;
      }

      if (mode === 'end') {
        // End-only mode: select end date only
        setSelectedStartDate(dateString);
        return;
      }

      // start-end mode (or default): sequential click logic
      if (clickCount === 0) {
        // First click: set start date
        setSelectedStartDate(dateString);
        setSelectedEndDate(null);
        setClickCount(1);
      } else if (clickCount === 1) {
        // Second click: set end date (must be after start)
        if (selectedStartDate && dateString <= selectedStartDate) {
          // If before or same as start, treat as new start
          setSelectedStartDate(dateString);
          setSelectedEndDate(null);
          // Stay at clickCount 1
        } else {
          setSelectedEndDate(dateString);
          setClickCount(2);
        }
      } else {
        // Subsequent clicks: alternate between start and end
        if (clickCount % 2 === 0) {
          // Edit start
          if (selectedEndDate && dateString >= selectedEndDate) {
            return; // Start must be before end
          }
          setSelectedStartDate(dateString);
          setClickCount(clickCount + 1);
        } else {
          // Edit end
          if (selectedStartDate && dateString <= selectedStartDate) {
            return; // End must be after start
          }
          setSelectedEndDate(dateString);
          setClickCount(clickCount + 1);
        }
      }
    },
    [mode, selectedStartDate, selectedEndDate, clickCount],
  );

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
