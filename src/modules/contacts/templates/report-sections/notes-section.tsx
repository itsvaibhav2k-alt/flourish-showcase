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
  notesList: {
    gap: 10,
  },
  noteCard: {
    padding: 10,
    backgroundColor: '#fafafa',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#22a558',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  noteType: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  noteDate: {
    fontSize: 8,
    color: '#9ca3af',
  },
  noteContent: {
    fontSize: 9,
    color: '#1a1a1a',
    lineHeight: 1.4,
  },
  noteTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  tag: {
    backgroundColor: '#e5e7eb',
    color: '#4b5563',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 7,
  },
  importanceBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 7,
    fontWeight: 'bold',
  },
  highImportance: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  urgentImportance: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
})

const NOTE_TYPE_COLORS: Record<string, string> = {
  meeting: '#3b82f6',
  phone_call: '#22c55e',
  email: '#22a558',
  personal_info: '#f59e0b',
  follow_up: '#f43f5e',
  donation: '#ec4899',
  volunteer: '#14b8a6',
  general: '#6b7280',
}

const NOTE_TYPE_LABELS: Record<string, string> = {
  meeting: 'Meeting',
  phone_call: 'Phone Call',
  email: 'Email',
  personal_info: 'Personal Info',
  follow_up: 'Follow-up',
  donation: 'Donation',
  volunteer: 'Volunteer',
  general: 'General',
}

interface NotesSectionProps {
  notes: Array<{
    id: string
    content: string
    note_type: string
    importance: string
    tags: string[] | null
    interaction_date: string | null
    created_at: string | null
  }>
}

export function NotesSection({ notes }: NotesSectionProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notes ({notes.length})</Text>

      <View style={styles.notesList}>
        {notes.slice(0, 15).map((note) => (
          <View
            key={note.id}
            style={[
              styles.noteCard,
              { borderLeftColor: NOTE_TYPE_COLORS[note.note_type] || NOTE_TYPE_COLORS.general },
            ]}
          >
            <View style={styles.noteHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.noteType}>
                  {NOTE_TYPE_LABELS[note.note_type] || note.note_type}
                </Text>
                {note.importance === 'high' && (
                  <Text style={[styles.importanceBadge, styles.highImportance]}>High</Text>
                )}
                {note.importance === 'urgent' && (
                  <Text style={[styles.importanceBadge, styles.urgentImportance]}>Urgent</Text>
                )}
              </View>
              <Text style={styles.noteDate}>
                {note.interaction_date
                  ? formatDate(note.interaction_date)
                  : formatDate(note.created_at)}
              </Text>
            </View>
            <Text style={styles.noteContent}>{note.content}</Text>
            {note.tags && note.tags.length > 0 && (
              <View style={styles.noteTags}>
                {note.tags.map((tag, index) => (
                  <Text key={index} style={styles.tag}>
                    {tag}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

      {notes.length > 15 && (
        <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 5, textAlign: 'center' }}>
          Showing 15 of {notes.length} notes
        </Text>
      )}
    </View>
  )
}
