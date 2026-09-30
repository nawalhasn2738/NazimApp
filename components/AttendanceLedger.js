import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radii } from "../constants/theme";
import PresencePill from "./PresencePill";

/**
 * Per-lecture attendance table with its own sort and month filter.
 * Simulated classes appear at the end with a dashed pill.
 *
 * @param {{ course: { attendanceRecords: Array<object> } }} props
 */
export default function AttendanceLedger({ course }) {
  const rows = course.attendanceRecords;

  return (
    <View>
      <View style={styles.table}>
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.cell, styles.headerCell, styles.numberCell]}>#</Text>
          <Text style={[styles.cell, styles.headerCell, styles.dateCell]}>Date</Text>
          <Text style={[styles.cell, styles.headerCell, styles.hoursCell]}>Hours</Text>
          <Text style={[styles.cell, styles.headerCell, styles.presenceCell]}>Presence</Text>
        </View>
        {rows.length > 0 ? (
          rows.map((record, index) => (
            <View key={record.id} style={[styles.row, index % 2 === 1 && styles.alternateRow]}>
              <Text style={[styles.cell, styles.numberCell]}>{record.lectureNo}</Text>
              <Text style={[styles.cell, styles.dateCell]}>{record.date}</Text>
              <Text style={[styles.cell, styles.hoursCell]}>{record.durationHours}</Text>
              <View style={[styles.cell, styles.presenceCell]}>
                <PresencePill status={record.presence} isSimulated={record.isSimulated} variant="wide" />
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No lectures match this filter.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderColor: colors.line,
    borderRadius: radii.card,
    borderWidth: 1,
    marginTop: 16,
    overflow: "hidden",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 46,
    paddingHorizontal: 12,
  },
  headerRow: {
    backgroundColor: colors.cardAlt,
  },
  alternateRow: {
    backgroundColor: colors.cardAlt,
  },
  cell: {
    color: colors.ink,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
  headerCell: {
    color: colors.inkMuted,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  numberCell: {
    width: 32,
  },
  dateCell: {
    flex: 1,
  },
  hoursCell: {
    width: 48,
  },
  presenceCell: {
    alignItems: "flex-end",
    width: 84,
  },
  empty: {
    color: colors.inkMuted,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    padding: 16,
    textAlign: "center",
  },
});
