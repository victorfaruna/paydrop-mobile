import { Dimensions, PixelRatio } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Standard guideline sizes (based on iPhone 11/13/14 layout)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Scale width based on screen width
 */
const width = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

/**
 * Scale height based on screen height
 */
const height = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

/**
 * Scale font size based on screen width and pixel ratio
 */
const fontSize = (size: number) => {
  const newSize = (SCREEN_WIDTH / guidelineBaseWidth) * size;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const size = {
  width,
  height,
  fontSize,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
};

export default size;
