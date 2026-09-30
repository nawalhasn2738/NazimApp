import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "../constants/theme";

// One place that maps the app's semantic icon names to Ionicons glyphs, so the
// whole app shares a single icon set, weight and style.
const GLYPHS = {
  alert: "notifications-outline",
  announce: "megaphone-outline",
  attendance: "checkmark",
  back: "arrow-back",
  chevron: "chevron-forward",
  close: "close",
  log: "list-outline",
  miss: "close",
  more: "ellipsis-vertical",
  plus: "add",
  reset: "refresh",
  score: "ribbon-outline",
  search: "search",
  simulator: "flask-outline",
  statusDanger: "alert-circle",
  statusSafe: "checkmark-circle",
  statusWarn: "warning",
  touch: "hand-left-outline",
  trash: "trash-outline",
  trend: "trending-up-outline",
  tracking: "checkmark-done",
};

/**
 * App icon (Ionicons). Use the semantic `name`s above.
 *
 * @param {{ name: keyof typeof GLYPHS, color?: string, size?: number }} props
 */
export default function Icon({ name, color = colors.ink, size = 22 }) {
  return <Ionicons color={color} name={GLYPHS[name] ?? "help-circle-outline"} size={size} />;
}
