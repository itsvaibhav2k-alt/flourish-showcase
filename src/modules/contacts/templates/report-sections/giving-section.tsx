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
    justifyContent: 'space-between',
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
  colAmount: {
    width: '20%',
    fontSize: 9,
    fontWeight: 'bold',
  },
  colType: {
    width: '20%',
    fontSize: 9,
  },
  colMethod: {
    width: '20%',
    fontSize: 9,
  },
  colNotes: {
    width: '20%',
    fontSize: 8,
    color: '#6b7280',
  },
  headerText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#4b5563',
    textTransform: 'uppercase',
  },
})

interface GivingSectionProps {
  gifts: Array<{
    id: string
    amount: number
    gift_date: string
    gift_type: string | null
    payment_method: string | null
    notes: string | null
  }>
  contact: {
    lifetime_giving: number | null
    total_gifts: number | null
    last_gift_date: string | null
  }
}

export function GivingSection({ gifts, contact }: GivingSectionProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }

  const totalGiving = contact.lifetime_giving || gifts.reduce((sum, g) => sum + g.amount, 0)
  const totalGifts = contact.total_gifts || gifts.length
  const averageGift = totalGifts > 0 ? totalGiving / totalGifts : 0

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Giving History</Text>

      {/* Summary Stats */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatCurrency(totalGiving)}</Text>
          <Text style={styles.summaryLabel}>Lifetime Giving</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalGifts}</Text>
          <Text style={styles.summaryLabel}>Total Gifts</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatCurrency(averageGift)}</Text>
          <Text style={styles.summaryLabel}>Average Gift</Text>
        </View>
        {contact.last_gift_date && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatDate(contact.last_gift_date)}</Text>
            <Text style={styles.summaryLabel}>Last Gift</Text>
          </View>
        )}
      </View>

      {/* Gifts Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.colDate, styles.headerText]}>Date</Text>
          <Text style={[styles.colAmount, styles.headerText]}>Amount</Text>
          <Text style={[styles.colType, styles.headerText]}>Type</Text>
          <Text style={[styles.colMethod, styles.headerText]}>Method</Text>
          <Text style={[styles.colNotes, styles.headerText]}>Notes</Text>
        </View>
        {gifts.slice(0, 20).map((gift) => (
          <View key={gift.id} style={styles.tableRow}>
            <Text style={styles.colDate}>{formatDate(gift.gift_date)}</Text>
            <Text style={styles.colAmount}>{formatCurrency(gift.amount)}</Text>
            <Text style={styles.colType}>{gift.gift_type || '-'}</Text>
            <Text style={styles.colMethod}>{gift.payment_method || '-'}</Text>
            <Text style={styles.colNotes} numberOfLines={1}>
              {gift.notes || '-'}
            </Text>
          </View>
        ))}
      </View>

      {gifts.length > 20 && (
        <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 5, textAlign: 'center' }}>
          Showing 20 of {gifts.length} gifts
        </Text>
      )}
    </View>
  )
}
