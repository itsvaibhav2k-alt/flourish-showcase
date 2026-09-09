import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
} from '@react-email/components'

interface VolunteerThankYouEmailProps {
  volunteerName: string
  orgName: string
  shiftTitle: string
  shiftDate: string
  hoursVolunteered?: number
  body: string
  impactMessage?: string
}

export function VolunteerThankYouEmail({
  volunteerName,
  orgName,
  shiftTitle,
  shiftDate,
  hoursVolunteered,
  body,
  impactMessage,
}: VolunteerThankYouEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={heading}>{orgName}</Heading>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Dear {volunteerName},</Text>

            <Text style={thankYouMessage}>
              Thank you for volunteering with us!
            </Text>

            <Text style={paragraph}>
              We wanted to take a moment to express our sincere gratitude for
              your time and dedication. Your contribution on {shiftDate} as a{' '}
              {shiftTitle} made a real difference.
            </Text>

            {hoursVolunteered && (
              <Section style={statsBox}>
                <Text style={statsLabel}>Hours Volunteered</Text>
                <Text style={statsValue}>{hoursVolunteered}</Text>
              </Section>
            )}

            <div dangerouslySetInnerHTML={{ __html: body }} style={paragraph} />

            {impactMessage && (
              <Section style={impactBox}>
                <Heading as="h2" style={impactHeading}>
                  Your Impact
                </Heading>
                <Text style={impactText}>{impactMessage}</Text>
              </Section>
            )}

            <Text style={paragraph}>
              Volunteers like you are the heart of our organization. Your
              willingness to give your time and energy enables us to continue
              our important work in the community.
            </Text>

            <Text style={paragraph}>
              We hope to see you at future volunteer opportunities! Keep an eye
              out for upcoming shifts and events.
            </Text>

            <Text style={signature}>
              With heartfelt thanks,
              <br />
              {orgName}
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Your volunteer hours have been recorded for our records. Thank you
              for being part of our mission.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default VolunteerThankYouEmail

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  padding: '32px 40px',
  backgroundColor: '#059669',
}

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#ffffff',
  margin: '0',
}

const content = {
  padding: '0 40px',
}

const greeting = {
  fontSize: '16px',
  lineHeight: '24px',
  marginTop: '32px',
  marginBottom: '16px',
}

const thankYouMessage = {
  fontSize: '24px',
  lineHeight: '32px',
  marginBottom: '24px',
  color: '#059669',
  fontWeight: 'bold',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '16px',
  color: '#374151',
}

const statsBox = {
  backgroundColor: '#ecfdf5',
  padding: '24px',
  borderRadius: '8px',
  marginTop: '24px',
  marginBottom: '24px',
  textAlign: 'center' as const,
}

const statsLabel = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#047857',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  marginBottom: '8px',
}

const statsValue = {
  fontSize: '48px',
  lineHeight: '56px',
  color: '#059669',
  fontWeight: 'bold',
  margin: '0',
}

const impactBox = {
  backgroundColor: '#fffbeb',
  padding: '24px',
  borderRadius: '8px',
  marginTop: '24px',
  marginBottom: '24px',
  borderLeft: '4px solid #f59e0b',
}

const impactHeading = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#92400e',
  marginTop: '0',
  marginBottom: '12px',
}

const impactText = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#78350f',
  margin: '0',
}

const signature = {
  fontSize: '16px',
  lineHeight: '24px',
  marginTop: '32px',
  marginBottom: '0',
  color: '#374151',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
}

const footer = {
  padding: '0 40px',
}

const footerText = {
  fontSize: '12px',
  lineHeight: '16px',
  color: '#6b7280',
}
