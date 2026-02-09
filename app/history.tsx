import { format, parseISO } from "date-fns";
import { useFocusEffect } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Modal, Text, TouchableOpacity, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { Colors } from "../src/constants/colors";
import { Cycle, Storage } from "../src/utils/storage";

export default function HistoryScreen() {
  const { t } = useTranslation();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<Cycle | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Editor state
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editingStart, setEditingStart] = useState(false); // Toggle which date to edit on calendar

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
    setEditEndDate(cycle.endDate || "");
    setModalVisible(true);
    setEditingStart(true);
  };

  const saveEdit = async () => {
    if (!selectedCycle) return;
    const updated = {
      ...selectedCycle,
      startDate: editStartDate,
      endDate: editEndDate || undefined,
    };
    await Storage.saveCycle(updated);
    setModalVisible(false);
    loadCycles();
  };

  const deleteCycle = async () => {
    // Implement delete if needed, skipping for minimalism
  };

  return (
    <View className="flex-1 bg-background p-4">
      <Text className="text-2xl font-bold text-primary mb-6 text-center">
        {t("history_title")}
      </Text>

      <FlatList
        data={cycles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => openEditor(item)}
            className="bg-white p-4 mb-2 rounded-lg flex-row items-center shadow-sm"
          >
            <View className="w-3 h-3 rounded-full bg-secondary mr-4" />
            <View>
              <Text className="text-lg text-text font-medium">
                {format(parseISO(item.startDate), "MMM dd")} -{" "}
                {item.endDate
                  ? format(parseISO(item.endDate), "MMM dd")
                  : "..."}
              </Text>
              <Text className="text-gray-400 text-sm">
                {format(parseISO(item.startDate), "yyyy")}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-center p-4">
          <View className="bg-white rounded-xl p-4 shadow-lg h-5/6">
            <Text className="text-xl font-bold text-center mb-4">
              Edit Cycle
            </Text>

            <View className="flex-row justify-between mb-4">
              <TouchableOpacity
                onPress={() => setEditingStart(true)}
                className={`p-2 border-b-2 ${editingStart ? "border-primary" : "border-transparent"}`}
              >
                <Text className="text-gray-600">
                  {t("period_start")}: {editStartDate}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditingStart(false)}
                className={`p-2 border-b-2 ${!editingStart ? "border-primary" : "border-transparent"}`}
              >
                <Text className="text-gray-600">
                  {t("period_end")}: {editEndDate || "..."}
                </Text>
              </TouchableOpacity>
            </View>

            <Calendar
              current={
                editingStart ? editStartDate : editEndDate || editStartDate
              }
              onDayPress={(day) => {
                if (editingStart) setEditStartDate(day.dateString);
                else setEditEndDate(day.dateString);
              }}
              markedDates={{
                [editStartDate]: { selected: true, color: Colors.secondary },
                [editEndDate]: { selected: true, color: Colors.secondary },
              }}
              theme={{
                selectedDayBackgroundColor: Colors.secondary,
                todayTextColor: Colors.primary,
              }}
            />

            <View className="flex-row justify-end mt-4">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="mr-4 p-3"
              >
                <Text className="text-gray-500">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveEdit}
                className="bg-primary p-3 px-6 rounded-lg"
              >
                <Text className="text-white font-bold">{t("save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
