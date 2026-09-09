import { View, Text, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 30,
    marginBottom: 15,
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 6,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },
  table: {
    marginTop: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  colDate: {
    width: '20%',
    fontSize: 9,
  },
  colTitle: {
    width: '35%',
    fontSize: 9,
  },
  colLocation: {
    width: '25%',
    fontSize: 9,
  },
  colHours: {
    width: '10%',
    fontSize: 9,
    fontWeight: 'bold',
  },
  colStatus: {
    width: '10%',
    fontSize: 8,
  },
  headerText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#4b5563',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 7,
  },
  completedStatus: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  pendingStatus: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
})

interface VolunteerSectionProps {
  shifts: Array<{
    id: string
    status: string
    hours_logged: number | null
    shift: {
      title: string
      shift_date: string
      location: string | null
    } | null
  }>
}

export function VolunteerSection({ shifts }: VolunteerSectionProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const totalHours = shifts.reduce((sum, s) => sum + (s.hours_logged || 0), 0)
  const completedShifts = shifts.filter((s) => s.status === 'completed').length

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Volunteer History</Text>

      {/* Summary Stats */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalHours.toFixed(1)}</Text>
          <Text style={styles.summaryLabel}>Total Hours</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{completedShifts}</Text>
          <Text style={styles.summaryLabel}>Shifts Completed</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{shifts.length}</Text>
          <Text style={styles.summaryLabel}>Total Signups</Text>
        </View>
      </View>

      {/* Shifts Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.colDate, styles.headerText]}>Date</Text>
          <Text style={[styles.colTitle, styles.headerText]}>Shift</Text>
          <Text style={[styles.colLocation, styles.headerText]}>Location</Text>
          <Text style={[styles.colHours, styles.headerText]}>Hours</Text>
          <Text style={[styles.colStatus, styles.headerText]}>Status</Text>
        </View>
        {shifts.slice(0, 15).map((signup) => (
          <View key={signup.id} style={styles.tableRow}>
            <Text style={styles.colDate}>
              {signup.shift?.shift_date ? formatDate(signup.shift.shift_date) : '-'}
            </Text>
            <Text style={styles.colTitle}>{signup.shift?.title || '-'}</Text>
            <Text style={styles.colLocation}>{signup.shift?.location || '-'}</Text>
            <Text style={styles.colHours}>{signup.hours_logged || '-'}</Text>
            <Text
              style={[
                styles.colStatus,
                styles.statusBadge,
                signup.status === 'completed' ? styles.completedStatus : styles.pendingStatus,
              ]}
            >
              {signup.status}
            </Text>
          </View>
        ))}
      </View>

      {shifts.length > 15 && (
        <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 5, textAlign: 'center' }}>
          Showing 15 of {shifts.length} shifts
        </Text>
      )}
    </View>
  )
}
