import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { v4 as uuidv4 } from 'uuid';
import { Colors } from '../src/constants/colors';
import { Cycle } from '../src/types/cycle.type';
import { Storage } from '../src/utils/storage';

export default function CalendarScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mode, cycleId } = useLocalSearchParams();

  const today = format(new Date(), 'yyyy-MM-dd');

  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(
    null,
  );
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);

  // In 'end' mode, load the existing cycle's start date so we can show it
  useEffect(() => {
    if (mode === 'end' && cycleId) {
      const loadCycleStart = async () => {
        const cId = Array.isArray(cycleId) ? cycleId[0] : cycleId;
        const cycles = await Storage.getCycles();
        const cycle = cycles.find((c) => c.id === cId);
        if (cycle) {
          setSelectedStartDate(cycle.startDate);
        }
      };
      loadCycleStart();
    }
  }, [mode, cycleId]);

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
        // End-only mode: select end date, start is already loaded
        if (selectedStartDate && dateString <= selectedStartDate) {
          return; // End must be after start
        }
        setSelectedEndDate(dateString);
        return;
      }

      // start-end mode (or default)
      if (!selectedStartDate) {
        // First selection
        setSelectedStartDate(dateString);
        setSelectedEndDate(null);
      } else if (!selectedEndDate) {
        // Start exists, end missing
        if (dateString < selectedStartDate) {
          // Clicked before start -> shift start
          setSelectedStartDate(dateString);
        } else if (dateString === selectedStartDate) {
          // Clicked start again -> toggle off
          setSelectedStartDate(null);
        } else {
          // Clicked after start -> set end
          setSelectedEndDate(dateString);
        }
      } else {
        // Start and end both exist -> new start selection
        setSelectedStartDate(dateString);
        setSelectedEndDate(null);
      }
    },
    [mode, selectedStartDate, selectedEndDate],
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
    // 1. Validate overlaps before saving
    const cycles = await Storage.getCycles();
    const cId = Array.isArray(cycleId) ? cycleId[0] : cycleId;

    // Define the range we are trying to save
    let newStart = selectedStartDate;
    let newEnd = selectedEndDate;

    if (mode === 'end') {
      const current = cycles.find((c) => c.id === cId);
      if (current) {
        newStart = current.startDate;
        // newEnd is already selectedEndDate
      }
    }

    if (newStart) {
      const start = newStart;
      const end = newEnd || start; // Single day cycle if no end

      const isOverlap = cycles.some((c) => {
        // Skip the current cycle being edited
        if (cId && c.id === cId) return false;

        if (c.startDate) {
          const cStart = c.startDate;
          const cEnd = c.endDate || cStart;

          // KEY CHANGE: "Do not check the cycles where cycle.end before the selected period start day"
          if (cEnd < start) return false;

          // Check intersection:
          // (StartA <= EndB) and (EndA >= StartB)
          return start <= cEnd && end >= cStart;
        }
        return false;
      });

      if (isOverlap) {
        Alert.alert('', t('already_selected_in_other_cycle'));
        return;
      }
    }

    if (mode === 'end') {
      if (!selectedEndDate) return;
      // Update existing cycle with selected end date
      const cycle = cycles.find((c) => c.id === cId);
      if (cycle) {
        cycle.endDate = selectedEndDate;
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

  const isSaveDisabled = Boolean(!selectedStartDate);

  return (
    <View className="flex-1 bg-background p-4 pt-10">
      <Text className="text-2xl font-bold text-center text-primary mb-2">
        {t('check_days')}
      </Text>

      <Calendar
        maxDate={today}
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
        disabled={isSaveDisabled}
        className={`py-4 rounded-xl mt-8 mx-4 ${isSaveDisabled ? 'bg-gray-300' : 'bg-primary'}`}
      >
        <Text className="text-white text-center font-bold text-lg">
          {t('save')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
