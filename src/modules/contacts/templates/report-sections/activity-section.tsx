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
  activityList: {
    gap: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
    marginTop: 3,
  },
  activityContent: {
    flex: 1,
  },
  activityType: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 9,
    color: '#4b5563',
  },
  activityDate: {
    fontSize: 8,
    color: '#9ca3af',
    marginTop: 2,
  },
})

const ACTIVITY_COLORS: Record<string, string> = {
  gift_received: '#22c55e',
  note_added: '#22a558',
  email_sent: '#3b82f6',
  task_completed: '#14b8a6',
  shift_completed: '#f59e0b',
  contact_created: '#6b7280',
  contact_updated: '#6b7280',
  default: '#9ca3af',
}

const ACTIVITY_LABELS: Record<string, string> = {
  gift_received: 'Gift Received',
  note_added: 'Note Added',
  email_sent: 'Email Sent',
  task_completed: 'Task Completed',
  shift_completed: 'Shift Completed',
  contact_created: 'Contact Created',
  contact_updated: 'Contact Updated',
}

interface ActivitySectionProps {
  activities: Array<{
    id: string
    activity_type: string
    description: string | null
    created_at: string
  }>
}

export function ActivitySection({ activities }: ActivitySectionProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Activity Timeline</Text>

      <View style={styles.activityList}>
        {activities.slice(0, 20).map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <View
              style={[
                styles.activityDot,
                {
                  backgroundColor:
                    ACTIVITY_COLORS[activity.activity_type] || ACTIVITY_COLORS.default,
                },
              ]}
            />
            <View style={styles.activityContent}>
              <Text style={styles.activityType}>
                {ACTIVITY_LABELS[activity.activity_type] || activity.activity_type}
              </Text>
              {activity.description && (
                <Text style={styles.activityDescription} numberOfLines={2}>
                  {activity.description}
                </Text>
              )}
              <Text style={styles.activityDate}>{formatDate(activity.created_at)}</Text>
            </View>
          </View>
        ))}
      </View>

      {activities.length > 20 && (
        <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 5, textAlign: 'center' }}>
          Showing 20 of {activities.length} activities
        </Text>
      )}
    </View>
  )
}
