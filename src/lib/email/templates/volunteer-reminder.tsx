import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Button,
} from '@react-email/components'

interface VolunteerReminderEmailProps {
  volunteerName: string
  orgName: string
  shiftTitle: string
  shiftDate: string
  shiftTime: string
  location?: string
  reminderType: '7day' | '1day' | 'morning'
  shiftDetailsUrl?: string
}

export function VolunteerReminderEmail({
  volunteerName,
  orgName,
  shiftTitle,
  shiftDate,
  shiftTime,
  location,
  reminderType,
  shiftDetailsUrl,
}: VolunteerReminderEmailProps) {
  const getReminderMessage = () => {
    switch (reminderType) {
      case '7day':
        return "Just a heads up — you have a volunteer shift coming up next week!"
      case '1day':
        return "Reminder: your volunteer shift is tomorrow!"
      case 'morning':
        return "See you today! Your shift starts in a few hours."
      default:
        return "This is a reminder about your upcoming volunteer shift."
    }
  }

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

            <Text style={paragraph}>{getReminderMessage()}</Text>

            <Section style={shiftDetails}>
              <Heading as="h2" style={shiftHeading}>
                {shiftTitle}
              </Heading>
              <Text style={detailItem}>
                <strong>Date:</strong> {shiftDate}
              </Text>
              <Text style={detailItem}>
                <strong>Time:</strong> {shiftTime}
              </Text>
              {location && (
                <Text style={detailItem}>
                  <strong>Location:</strong> {location}
                </Text>
              )}
            </Section>

            <Text style={paragraph}>
              We're looking forward to seeing you! If you have any questions or
              need to make changes to your signup, please contact us as soon as
              possible.
            </Text>

            {shiftDetailsUrl && (
              <Section style={buttonContainer}>
                <Button style={button} href={shiftDetailsUrl}>
                  View Shift Details
                </Button>
              </Section>
            )}

            <Text style={paragraph}>
              Thank you for volunteering your time and making a difference!
            </Text>

            <Text style={signature}>
              Best regards,
              <br />
              {orgName}
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              If you can no longer attend this shift, please let us know as soon
              as possible so we can find a replacement.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default VolunteerReminderEmail

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

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '32px',
}

const button = {
  backgroundColor: '#059669',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
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
