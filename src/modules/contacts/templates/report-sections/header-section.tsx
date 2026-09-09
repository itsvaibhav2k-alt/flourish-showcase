import { View, Text, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#16804d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  initials: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 8,
    fontWeight: 'bold',
  },
  donorBadge: {
    backgroundColor: '#fce7f3',
    color: '#be185d',
  },
  volunteerBadge: {
    backgroundColor: '#ede9fe',
    color: '#15663d',
  },
  contactInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginRight: 4,
  },
  infoValue: {
    fontSize: 9,
    color: '#1a1a1a',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 10,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 8,
  },
})

interface HeaderSectionProps {
  contact: {
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    address: {
      street?: string
      city?: string
      state?: string
      zip?: string
    } | null
    tags: string[] | null
    is_donor: boolean | null
    is_volunteer: boolean | null
    created_at: string
  }
}

export function HeaderSection({ contact }: HeaderSectionProps) {
  const fullName = `${contact.first_name} ${contact.last_name}`
  const initials = `${contact.first_name[0] || ''}${contact.last_name[0] || ''}`.toUpperCase()

  const formatAddress = () => {
    if (!contact.address) return null
    const { street, city, state, zip } = contact.address
    const parts = []
    if (street) parts.push(street)
    if (city || state || zip) {
      const cityStateZip = [city, state, zip].filter(Boolean).join(', ')
      parts.push(cityStateZip)
    }
    return parts.join(', ')
  }

  const memberSince = new Date(contact.created_at).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

  return (
    <View style={styles.section}>
      <View style={styles.nameRow}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{fullName}</Text>
          <View style={styles.badges}>
            {contact.is_donor && (
              <Text style={[styles.badge, styles.donorBadge]}>Donor</Text>
            )}
            {contact.is_volunteer && (
              <Text style={[styles.badge, styles.volunteerBadge]}>Volunteer</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.contactInfo}>
        {contact.email && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{contact.email}</Text>
          </View>
        )}
        {contact.phone && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{contact.phone}</Text>
          </View>
        )}
        {formatAddress() && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue}>{formatAddress()}</Text>
          </View>
        )}
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Member Since:</Text>
          <Text style={styles.infoValue}>{memberSince}</Text>
        </View>
      </View>

      {contact.tags && contact.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {contact.tags.map((tag, index) => (
            <Text key={index} style={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>
      )}
    </View>
  )
}
