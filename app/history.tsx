import {
  differenceInDays,
  eachDayOfInterval,
  format,
  isBefore,
  parseISO,
  startOfDay,
} from 'date-fns';
import { useFocusEffect } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Colors } from '../src/constants/colors';
import { Cycle, Storage } from '../src/utils/storage';

export default function HistoryScreen() {
  const { t } = useTranslation();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<Cycle | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Editor state
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editingStart, setEditingStart] = useState(false); // Toggle which date to edit on calendar

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

  const openEditor = (cycle: Cycle) => {
    setSelectedCycle(cycle);
    setEditStartDate(cycle.startDate);
    setEditEndDate(
      cycle.endDate && cycle.endDate > cycle.startDate ? cycle.endDate : '',
    );
    setModalVisible(true);
    setEditingStart(true);
  };

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

  return (
    <View className="flex-1 bg-background p-4">
      <Text className="text-2xl font-bold text-primary mb-6 text-center">
        {t('history_title')}
      </Text>

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
                {format(parseISO(item.startDate), 'MMM dd')} -{' '}
                {item.endDate
                  ? format(parseISO(item.endDate), 'MMM dd')
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

            <View className="flex-row justify-between mb-4">
              <TouchableOpacity
                onPress={() => setEditingStart(true)}
                className={`p-2 border-b-2 ${editingStart ? 'border-primary' : 'border-transparent'}`}
              >
                <Text className="text-gray-600">
                  {t('period_start')}: {editStartDate}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditingStart(false)}
                className={`p-2 border-b-2 ${!editingStart ? 'border-primary' : 'border-transparent'}`}
              >
                <Text className="text-gray-600">
                  {t('period_end')}: {editEndDate || '...'}
                </Text>
              </TouchableOpacity>
            </View>

            <Calendar
              current={
                editingStart ? editStartDate : editEndDate || editStartDate
              }
              onDayPress={(day) => {
                const date = day.dateString;
                if (editingStart) {
                  // Start cannot be >= end
                  if (editEndDate && date >= editEndDate) {
                    return;
                  }
                  setEditStartDate(date);
                } else {
                  // End cannot be <= start
                  if (date <= editStartDate) {
                    return;
                  }
                  setEditEndDate(date);
                }
              }}
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
