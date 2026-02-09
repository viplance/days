import React from "react";
import { Text, View } from "react-native";
import styles from "./ScssExample.scss";

export default function ScssExample() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Powered by SCSS Modules</Text>
    </View>
  );
}
