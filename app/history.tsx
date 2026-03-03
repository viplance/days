import { Cycle } from '@/src/types/cycle.type';
import { Ionicons } from '@expo/vector-icons';
import {
  addDays,
  differenceInDays,
  eachDayOfInterval,
  format,
  isBefore,
  parseISO,
  startOfDay,
} from 'date-fns';
import { be, enUS, es, ru, uk } from 'date-fns/locale';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { v4 as uuidv4 } from 'uuid';
import { Colors } from '../src/constants/colors';
import { Storage } from '../src/utils/storage';

const locales: Record<string, any> = { be, en: enUS, es, ru, uk };
const today = format(new Date(), 'yyyy-MM-dd');

type EditMode = 'start' | 'end' | 'start-end';

export default function HistoryScreen() {
  const { t, i18n } = useTranslation();
  const currentLocale = locales[i18n.language] || enUS;
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<Cycle | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [predictionDate, setPredictionDate] = useState<string | null>(null);
  const [averageCycleLength, setAverageCycleLength] = useState(28);

  // Editor state
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editMode, setEditMode] = useState<EditMode>('start-end');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const markedDates = useMemo(() => {
    if (!editStartDate) return {};
    const marks: Record<string, any> = {};

    marks[editStartDate] = { selected: true, color: Colors.secondary };

    if (editEndDate) {
      const start = parseISO(editStartDate);
      const end = parseISO(editEndDate);

      if (!isBefore(end, start)) {
        const days = eachDayOfInterval({ start, end });
        days.forEach((day: Date) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          marks[dateStr] = { selected: true, color: Colors.secondary };
        });
      } else {
        marks[editEndDate] = { selected: true, color: Colors.secondary };
      }
    }
    return marks;
  }, [editStartDate, editEndDate]);

  const loadCycles = async () => {
    const data = await Storage.getCycles();
    // Sort DESC
    data.sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );
    setCycles(data);

    let cycleLength = (await Storage.getCycleLength()) || 28;

    if (data.length >= 2) {
      const latestStart = parseISO(data[0].startDate);
      const prevStart = parseISO(data[1].startDate);
      const interval = Math.abs(differenceInDays(latestStart, prevStart));

      if (interval >= 24 && interval <= 38) {
        cycleLength = interval;
        await Storage.setCycleLength(interval);
      }
    }

    setAverageCycleLength(cycleLength);

    if (data.length > 0) {
      const nextDate = addDays(parseISO(data[0].startDate), cycleLength);
      setPredictionDate(format(nextDate, 'yyyy-MM-dd'));
    } else {
      setPredictionDate(null);
    }
  };

  useFocusEffect(() => {
    loadCycles();
  });

  const openEditor = (cycle: Cycle, mode: EditMode = 'start-end') => {
    setSelectedCycle(cycle);
    setEditStartDate(cycle.startDate);
    setEditEndDate(
      cycle.endDate && cycle.endDate > cycle.startDate ? cycle.endDate : '',
    );
    setEditMode(mode);
    setErrorMessage(null);
    setModalVisible(true);
  };

  const handleNewCycle = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const newCycle: Cycle = {
      id: uuidv4(),
      startDate: today,
    };
    openEditor(newCycle, 'start-end');
  };

  const handleDayPress = useCallback(
    (dateString: string) => {
      if (editMode === 'start') {
        // Start-only mode: just set the start date
        setEditStartDate(dateString);
        setEditEndDate('');
      } else if (editMode === 'end') {
        // End-only mode: can only set end date, start is fixed
        if (dateString <= editStartDate) {
          return; // End must be after start
        }
        setEditEndDate(dateString);
      } else {
        // start-end mode
        if (!editStartDate) {
          setEditStartDate(dateString);
          setEditEndDate('');
        } else if (!editEndDate) {
          // Start exists, end missing
          if (dateString < editStartDate) {
            setEditStartDate(dateString);
          } else if (dateString === editStartDate) {
            setEditStartDate('');
          } else {
            setEditEndDate(dateString);
          }
        } else {
          // Start and end both exist -> new start selection
          setEditStartDate(dateString);
          setEditEndDate('');
        }
      }
    },
    [editMode, editStartDate, editEndDate],
  );

  const saveEdit = async () => {
    if (!selectedCycle) return;

    // Validate overlaps before saving
    const start = editStartDate;
    const end = editEndDate || start; // Single day cycle if no end

    const isOverlap = cycles.some((c) => {
      // Skip the current cycle being edited
      if (c.id === selectedCycle.id) return false;

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
      setErrorMessage(t('already_selected_in_other_cycle'));
      return;
    }

    const updated = {
      ...selectedCycle,
      startDate: editStartDate,
      endDate:
        editEndDate && editEndDate > editStartDate ? editEndDate : undefined,
    };
    await Storage.saveCycle(updated);
    setModalVisible(false);
    loadCycles();
  };

  const deleteCycle = async () => {
    if (!selectedCycle) return;
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedCycle) return;
    await Storage.deleteCycle(selectedCycle.id);
    setDeleteModalVisible(false);
    setModalVisible(false);
    loadCycles();
  };

  const getCycleDay = (id: number) => {
    const startDate = cycles[id].startDate;
    const endDate = cycles[id - 1]?.startDate || new Date().toISOString();

    const day =
      differenceInDays(
        startOfDay(parseISO(endDate)),
        startOfDay(parseISO(startDate)),
      ) + 1;

    return cycles[id - 1]?.startDate
      ? t('days', { count: day })
      : t('cycle_day', { day });
  };

  return (
    <View className="flex-1 bg-background p-4">
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-2xl font-bold text-primary">
          {t('history_title')}
        </Text>
        <TouchableOpacity onPress={handleNewCycle}>
          <Ionicons name="add-circle" size={32} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {predictionDate && (
        <View className="bg-primary/10 p-4 mb-6 rounded-xl border border-primary/20">
          <Text className="text-primary font-medium text-center">
            {t('next_cycle_prediction', {
              date: format(parseISO(predictionDate), 'd MMM', {
                locale: currentLocale,
              }),
            })}
          </Text>
        </View>
      )}

      <FlatList
        data={cycles}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const startObj = parseISO(item.startDate);

          let totalLength = averageCycleLength;
          let endCycleObj = addDays(startObj, averageCycleLength);

          if (index > 0 && cycles[index - 1]) {
            endCycleObj = parseISO(cycles[index - 1].startDate);
            totalLength = Math.max(
              1,
              Math.abs(differenceInDays(endCycleObj, startObj)),
            );
          }

          let periodLength = 0;
          if (item.endDate) {
            periodLength = Math.max(
              1,
              Math.abs(differenceInDays(parseISO(item.endDate), startObj)) + 1,
            );
          }

          const periodPct = Math.min(100, (periodLength / totalLength) * 100);

          let todayPct = -1;
          if (index === 0 && item.endDate) {
            const daysSinceStart = differenceInDays(new Date(), startObj);
            // Only show if today is between end of period and end of cycle
            if (
              daysSinceStart > periodLength - 1 &&
              daysSinceStart < totalLength
            ) {
              todayPct = Math.min(100, (daysSinceStart / totalLength) * 100);
            }
          }

          return (
            <TouchableOpacity
              onPress={() => openEditor(item)}
              className="bg-white p-4 mb-3 rounded-xl border border-gray-100 shadow-sm"
            >
              <View className="flex-row justify-between mb-4">
                <Text className="text-lg font-bold text-gray-800">
                  {format(startObj, 'yyyy', { locale: currentLocale })}
                </Text>
                <Text
                  className={`${index === 0 ? 'text-secondary' : 'text-gray-400'} font-bold`}
                >
                  {getCycleDay(index)}
                </Text>
              </View>

              <View className="w-full h-10 relative justify-center">
                <Text className="absolute left-0 top-0 text-xs text-gray-400 font-medium">
                  {format(startObj, 'dd MMM', { locale: currentLocale })}
                </Text>

                {item.endDate && (
                  <Text
                    className="absolute top-0 text-xs text-secondary font-bold text-center w-16"
                    style={{
                      left: `${periodPct}%`,
                      marginLeft: -32,
                    }}
                  >
                    {format(parseISO(item.endDate), 'dd MMM', {
                      locale: currentLocale,
                    })}
                  </Text>
                )}

                {todayPct >= 0 && (
                  <Text
                    className="absolute top-0 text-xs text-primary font-bold text-center w-16"
                    style={{
                      left: `${todayPct}%`,
                      marginLeft: -32,
                    }}
                  ></Text>
                )}

                <Text className="absolute right-0 top-0 text-xs text-gray-400 font-medium">
                  {format(endCycleObj, 'dd MMM', { locale: currentLocale })}
                </Text>
              </View>

              <View className="w-full h-2 bg-gray-100 rounded-full my-2 flex-row items-center relative">
                <View
                  className="h-full bg-secondary rounded-full absolute left-0"
                  style={{ width: `${periodPct}%` }}
                />

                <View className="w-3 h-3 rounded-full bg-secondary absolute -left-1" />

                {item.endDate && (
                  <View
                    className="w-3 h-3 rounded-full bg-secondary absolute"
                    style={{ left: `${periodPct}%`, marginLeft: -6 }}
                  />
                )}

                {todayPct >= 0 && (
                  <View
                    className="w-1.5 h-4 bg-primary absolute rounded-full"
                    style={{ left: `${todayPct}%`, marginLeft: -3 }}
                  />
                )}

                <View className="w-3 h-3 rounded-full bg-gray-300 absolute -right-1" />
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-center p-4">
          <View className="bg-white rounded-xl p-4 shadow-lg h-5/6">
            <Text className="text-xl font-bold text-center mb-4">
              {t('edit_period')}
            </Text>

            <Calendar
              maxDate={today}
              current={editStartDate}
              onDayPress={(day) => handleDayPress(day.dateString)}
              markedDates={markedDates}
              theme={{
                selectedDayBackgroundColor: Colors.secondary,
                todayTextColor: Colors.primary,
              }}
            />

            {errorMessage && (
              <Text className="text-red-500 text-center mt-2 font-medium">
                {errorMessage}
              </Text>
            )}

            <View className="flex-row justify-between items-center mt-4">
              <TouchableOpacity onPress={deleteCycle} className="p-3">
                <Text className="text-red-500 font-medium">{t('delete')}</Text>
              </TouchableOpacity>
              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="mr-4 p-3"
                >
                  <Text className="text-gray-500">{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveEdit}
                  className="bg-primary p-3 px-6 rounded-lg"
                >
                  <Text className="text-white font-bold">{t('save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModalVisible} animationType="fade" transparent>
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <Text className="text-xl font-bold text-center mb-2 text-gray-900">
              {t('delete_confirmation_title')}
            </Text>
            <Text className="text-gray-600 text-center mb-6 text-base">
              {t('delete_confirmation_message')}
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setDeleteModalVisible(false)}
                className="flex-1 p-3 rounded-lg bg-gray-100 items-center active:bg-gray-200"
              >
                <Text className="text-gray-700 font-semibold text-base">
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDelete}
                className="flex-1 p-3 rounded-lg bg-red-500 items-center active:bg-red-600"
              >
                <Text className="text-white font-semibold text-base">
                  {t('delete')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
