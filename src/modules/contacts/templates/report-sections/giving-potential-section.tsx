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
  scoresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 6,
  },
  scoreItem: {
    alignItems: 'center',
    flex: 1,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },
  overallScore: {
    color: '#16804d',
  },
  capacityScore: {
    color: '#22c55e',
  },
  affinityScore: {
    color: '#3b82f6',
  },
  propensityScore: {
    color: '#f59e0b',
  },
  wealthIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  wealthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  wealthLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginRight: 6,
  },
  wealthValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
})

interface GivingPotentialSectionProps {
  givingPotential: {
    overall_score: number | null
    capacity_score: number | null
    affinity_score: number | null
    propensity_score: number | null
    estimated_net_worth: number | null
    employer: string | null
  }
}

export function GivingPotentialSection({ givingPotential }: GivingPotentialSectionProps) {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return `$${amount.toLocaleString()}`
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Giving Potential Analysis</Text>

      {/* Scores */}
      <View style={styles.scoresRow}>
        {givingPotential.overall_score !== null && (
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreValue, styles.overallScore]}>
              {givingPotential.overall_score}
            </Text>
            <Text style={styles.scoreLabel}>Overall Score</Text>
          </View>
        )}
        {givingPotential.capacity_score !== null && (
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreValue, styles.capacityScore]}>
              {givingPotential.capacity_score}
            </Text>
            <Text style={styles.scoreLabel}>Capacity</Text>
          </View>
        )}
        {givingPotential.affinity_score !== null && (
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreValue, styles.affinityScore]}>
              {givingPotential.affinity_score}
            </Text>
            <Text style={styles.scoreLabel}>Affinity</Text>
          </View>
        )}
        {givingPotential.propensity_score !== null && (
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreValue, styles.propensityScore]}>
              {givingPotential.propensity_score}
            </Text>
            <Text style={styles.scoreLabel}>Propensity</Text>
          </View>
        )}
      </View>

      {/* Wealth Indicators */}
      {(givingPotential.estimated_net_worth || givingPotential.employer) && (
        <View style={styles.wealthIndicators}>
          {givingPotential.estimated_net_worth && (
            <View style={styles.wealthItem}>
              <Text style={styles.wealthLabel}>Est. Net Worth:</Text>
              <Text style={styles.wealthValue}>
                {formatCurrency(givingPotential.estimated_net_worth)}
              </Text>
            </View>
          )}
          {givingPotential.employer && (
            <View style={styles.wealthItem}>
              <Text style={styles.wealthLabel}>Employer:</Text>
              <Text style={styles.wealthValue}>{givingPotential.employer}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}
