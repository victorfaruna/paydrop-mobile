import { COLORS } from "@/config/colors";
import { View as DefaultView, useColorScheme } from "react-native";

type ViewProps = DefaultView["props"] & {
  lightColor?: string;
  darkColor?: string;
};

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const theme = useColorScheme() ?? "light";
  const backgroundColor = theme === "light" ? lightColor : darkColor;

  const defaultBg = COLORS.white;

  return (
    <DefaultView
      style={[{ backgroundColor: backgroundColor || defaultBg }, style]}
      {...otherProps}
    />
  );
}
