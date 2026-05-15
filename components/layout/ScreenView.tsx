import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenViewProps {
  children: React.ReactNode;
  className?: string;
}

const ScreenView = ({ children, className }: ScreenViewProps) => {
  const inset = useSafeAreaInsets();
  return (
    <View
      className={`flex-1 bg-white ${className}`}
      style={{ paddingTop: inset.top }}
    >
      {children}
    </View>
  );
};

export default ScreenView;
