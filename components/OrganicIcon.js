import Svg, { Circle, Path } from "react-native-svg";
import { colors } from "../constants/theme";

const iconPaths = {
  settings: <Path d="M12 8.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Zm0-5.3v2m0 12.9v2M4.5 6.6l1.4 1.4m12.2 8 1.4 1.4M3.5 12h2m13 0h2M4.5 17.4 5.9 16m12.2-8 1.4-1.4" />,
  trend: <Path d="M4 15.5c2.5-5 4.6-5.7 6.4-3.5 1.8 2.2 3.8 2.6 6.1-2.7L20 11" />,
  credits: <Path d="M6 7.5c0 1.3 2.7 2.4 6 2.4s6-1.1 6-2.4S15.3 5.1 12 5.1 6 6.2 6 7.5Zm0 0v8.8c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6V7.5M6 12c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6" />,
  attendance: <Path d="M5.2 12.4 9.6 17 19 7.5" />,
  alert: <Path d="M12 4.5c-3 0-5 2.3-5 5.6v2.8l-1.4 2.4h12.8L17 12.9v-2.8c0-3.3-2-5.6-5-5.6Zm-2.1 13.2c.5 1.1 1.2 1.7 2.1 1.7s1.6-.6 2.1-1.7" />,
  filter: <Path d="M5 7h14M8 12h8M10.5 17h3" />,
  sort: <Path d="M8 5v14m0 0-3-3m3 3 3-3m8-11v14m0-14-3 3m3-3 3 3" />,
  back: <Path d="M14.5 6.5 9 12l5.5 5.5M9.6 12H20" />,
  reset: <Path d="M18.6 8.2A7.4 7.4 0 1 0 19 15M18.6 8.2V4.8M18.6 8.2h-3.4" />,
  miss: <Path d="M8 8l8 8M16 8l-8 8" />,
  simulator: <Path d="M6 18.5 8.2 13 16.8 4.4a2.1 2.1 0 0 1 3 3L11 16l-5 2.5Zm2.2-5.5L11 16" />,
  chart: <Path d="M5 18V6m0 12h14M9 15v-4m4 4V8m4 7v-6" />,
};

/**
 * @param {{ name: keyof typeof iconPaths, color?: string, size?: number, strokeWidth?: number }} props
 */
export default function OrganicIcon({
  name,
  color = colors.primary,
  size = 22,
  strokeWidth = 2.2,
}) {
  const child = iconPaths[name] ?? iconPaths.chart;

  return (
    <Svg height={size} viewBox="0 0 24 24" width={size} fill="none">
      <Circle cx="12" cy="12" r="9.2" stroke={color} strokeOpacity={0.12} strokeWidth="2" />
      <Svg
        height="24"
        viewBox="0 0 24 24"
        width="24"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      >
        {child}
      </Svg>
    </Svg>
  );
}
