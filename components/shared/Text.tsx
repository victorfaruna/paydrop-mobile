import { COLORS } from "@/config/colors";
import { Text as DefaultText, useColorScheme } from "react-native";

type TextProps = DefaultText["props"] & {
  lightColor?: string;
  darkColor?: string;
};

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const theme = useColorScheme() ?? "light";
  const color = theme === "light" ? lightColor : darkColor;

  const defaultColor = COLORS.black;

  return (
    <DefaultText
      style={[{ color: color || defaultColor }, style]}
      {...otherProps}
    />
  );
}
