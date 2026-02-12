import { Ionicons } from '@expo/vector-icons';
import {
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
import { Cycle, Storage } from '../src/utils/storage';

const locales: Record<string, any> = { be, en: enUS, es, ru, uk };

type EditMode = 'start' | 'end' | 'start-end';

export default function HistoryScreen() {
  const { t, i18n } = useTranslation();
  const currentLocale = locales[i18n.language] || enUS;
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<Cycle | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Editor state
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editMode, setEditMode] = useState<EditMode>('start-end');
  // For start-end mode: tracks how many clicks have been made
  // 0 = next click sets start, 1 = next click sets end, 2+ = alternates
  const [clickCount, setClickCount] = useState(0);

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
    setClickCount(0);
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
        // start-end mode: sequential click logic
        if (clickCount === 0) {
          // First click: set start date
          setEditStartDate(dateString);
          setEditEndDate('');
          setClickCount(1);
        } else if (clickCount === 1) {
          // Second click: set end date (must be after start)
          if (dateString <= editStartDate) {
            // If before or same as start, treat as new start
            setEditStartDate(dateString);
            setEditEndDate('');
            // Stay at clickCount 1, waiting for end
          } else {
            setEditEndDate(dateString);
            setClickCount(2);
          }
        } else {
          // Subsequent clicks: alternate between start and end
          if (clickCount % 2 === 0) {
            // Edit start
            if (editEndDate && dateString >= editEndDate) {
              return; // Start must be before end
            }
            setEditStartDate(dateString);
            setClickCount(clickCount + 1);
          } else {
            // Edit end
            if (dateString <= editStartDate) {
              return; // End must be after start
            }
            setEditEndDate(dateString);
            setClickCount(clickCount + 1);
          }
        }
      }
    },
    [editMode, editStartDate, editEndDate, clickCount],
  );

  const saveEdit = async () => {
    if (!selectedCycle) return;
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

  // Helper to get the label showing which field is being edited
  const getEditHint = () => {
    if (editMode === 'start') {
      return `${t('period_start')}: ${editStartDate}`;
    }
    if (editMode === 'end') {
      return `${t('period_start')}: ${editStartDate}  →  ${t('period_end')}: ${editEndDate || '...'}`;
    }
    // start-end mode
    return `${t('period_start')}: ${editStartDate}  →  ${t('period_end')}: ${editEndDate || '...'}`;
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

      <FlatList
        data={cycles}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => openEditor(item)}
            className="bg-white p-4 mb-2 rounded-lg flex-row items-center shadow-sm"
          >
            <View
              className={`w-3 h-3 rounded-full mr-4 ${index === 0 ? 'bg-secondary' : 'bg-gray-400'}`}
            />
            <View className="flex-1">
              <Text className="text-lg text-text font-medium">
                {format(parseISO(item.startDate), 'MMM dd', {
                  locale: currentLocale,
                })}{' '}
                -{' '}
                {item.endDate
                  ? format(parseISO(item.endDate), 'MMM dd', {
                      locale: currentLocale,
                    })
                  : '...'}
              </Text>
              <Text className="text-gray-400 text-sm">
                {format(parseISO(item.startDate), 'yyyy')}
              </Text>
            </View>
            <Text
              className={`${index === 0 ? 'text-secondary' : 'text-gray-400'} font-medium text-right`}
            >
              {getCycleDay(index)}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-center p-4">
          <View className="bg-white rounded-xl p-4 shadow-lg h-5/6">
            <Text className="text-xl font-bold text-center mb-4">
              {t('edit_cycle')}
            </Text>

            {/* Date summary (read-only, no toggle buttons) */}
            <View className="flex-row justify-center mb-4">
              <Text className="text-gray-600 text-center">{getEditHint()}</Text>
            </View>

            <Calendar
              current={editStartDate}
              onDayPress={(day) => handleDayPress(day.dateString)}
              markedDates={markedDates}
              theme={{
                selectedDayBackgroundColor: Colors.secondary,
                todayTextColor: Colors.primary,
              }}
            />

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
