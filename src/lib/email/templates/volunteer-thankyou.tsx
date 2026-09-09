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
  hoursLogged?: number | null
}

export function VolunteerThankYouEmail({
  volunteerName,
  orgName,
  shiftTitle,
  shiftDate,
  hoursLogged,
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
            <Text style={greeting}>Hi {volunteerName},</Text>

            <Text style={paragraph}>
              Thank you so much for volunteering today! Your time and effort
              make a real difference, and we truly appreciate your dedication.
            </Text>

            <Section style={shiftDetails}>
              <Heading as="h2" style={shiftHeading}>
                {shiftTitle}
              </Heading>
              <Text style={detailItem}>
                <strong>Date:</strong> {shiftDate}
              </Text>
              {hoursLogged && (
                <Text style={detailItem}>
                  <strong>Hours logged:</strong> {hoursLogged}
                </Text>
              )}
            </Section>

            <Text style={paragraph}>
              We hope you had a great experience and would love to see you
              again at future events. Your contribution helps us serve our
              community better.
            </Text>

            <Text style={signature}>
              With gratitude,
              <br />
              {orgName}
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Thank you for being part of our volunteer community!
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

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '16px',
  color: '#374151',
}

const shiftDetails = {
  backgroundColor: '#f3f4f6',
  padding: '24px',
  borderRadius: '8px',
  marginTop: '24px',
  marginBottom: '24px',
}

const shiftHeading = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#111827',
  marginTop: '0',
  marginBottom: '16px',
}

const detailItem = {
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '8px',
  color: '#374151',
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
