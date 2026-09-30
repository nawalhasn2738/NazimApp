import { useWindowDimensions } from "react-native";

export const MAX_CONTENT_WIDTH = 480;
export const WIDE_BREAKPOINT = 9999;

/**
 * Responsive layout info shared by both views.
 * - `isWide`: retained for compatibility; the app now always uses its mobile layout.
 * - `contentWidth`: width of the centered content shell (never above 480).
 */
export default function useLayout() {
  const { width } = useWindowDimensions();

  return {
    contentWidth: Math.min(width, MAX_CONTENT_WIDTH),
    isWide: width >= WIDE_BREAKPOINT,
    windowWidth: width,
  };
}
