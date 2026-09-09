import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer'
import type { ContactReportData, ReportConfig } from '../types/report.types'
import { HeaderSection } from './report-sections/header-section'
import { GivingSection } from './report-sections/giving-section'
import { VolunteerSection } from './report-sections/volunteer-section'
import { ActivitySection } from './report-sections/activity-section'
import { NotesSection } from './report-sections/notes-section'
import { GivingPotentialSection } from './report-sections/giving-potential-section'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  orgName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 9,
    color: '#666666',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999999',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 10,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 8,
    color: '#999999',
  },
})

interface ContactReportDocumentProps {
  data: ContactReportData
  config: ReportConfig
}

export function ContactReportDocument({ data, config }: ContactReportDocumentProps) {
  const enabledSections = config.sections.filter((s) => s.enabled)
  const isSectionEnabled = (id: string) => enabledSections.some((s) => s.id === id)

  const fullName = `${data.contact.first_name} ${data.contact.last_name}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Document Header */}
        <View style={styles.header}>
          <Text style={styles.orgName}>{data.organization.name}</Text>
          <Text style={styles.subtitle}>
            Contact Report - {fullName} - Generated{' '}
            {data.generatedAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Contact Summary - Always shown */}
        <HeaderSection contact={data.contact} />

        {/* Giving History */}
        {isSectionEnabled('giving') && data.gifts.length > 0 && (
          <GivingSection gifts={data.gifts} contact={data.contact} />
        )}

        {/* Volunteer History */}
        {isSectionEnabled('volunteer') && data.volunteerShifts.length > 0 && (
          <VolunteerSection shifts={data.volunteerShifts} />
        )}

        {/* Giving Potential */}
        {isSectionEnabled('giving_potential') && data.givingPotential && (
          <GivingPotentialSection givingPotential={data.givingPotential} />
        )}

        {/* Activity Timeline */}
        {isSectionEnabled('activities') && data.activities.length > 0 && (
          <ActivitySection activities={data.activities} />
        )}

        {/* Notes */}
        {isSectionEnabled('notes') && data.notes.length > 0 && (
          <NotesSection notes={data.notes} />
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Confidential - {data.organization.name}
        </Text>

        {/* Page Number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  )
}
