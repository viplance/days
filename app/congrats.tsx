import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { Storage } from "../src/utils/storage";

export default function CongratsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const handleDismiss = async () => {
    await Storage.setSeenCongrats();
    router.back();
  };

  return (
    <View className="flex-1 bg-background p-6 justify-center items-center">
      {/* Decorative background lines could be SVG or Images, skipping for minimalism */}

      <View className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
        <Text className="text-2xl font-bold text-primary mb-6 text-center">
          {t("congrats_title")}
        </Text>

        <Text className="text-text text-lg leading-relaxed mb-8 text-center">
          {t("congrats_body")}
        </Text>

        <TouchableOpacity
          onPress={handleDismiss}
          className="bg-primary py-3 px-6 rounded-full self-center"
        >
          <Text className="text-white font-semibold text-lg">
            {t("understand_button")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
