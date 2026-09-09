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

interface VolunteerConfirmationEmailProps {
  volunteerName: string
  orgName: string
  shiftTitle: string
  shiftDate: string
  shiftTime: string
  location?: string
  body: string
  shiftDetailsUrl?: string
}

export function VolunteerConfirmationEmail({
  volunteerName,
  orgName,
  shiftTitle,
  shiftDate,
  shiftTime,
  location,
  body,
  shiftDetailsUrl,
}: VolunteerConfirmationEmailProps) {
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

            <Text style={confirmationMessage}>
              Thank you for signing up to volunteer with us! We're excited to
              have you join our team.
            </Text>

            <Section style={shiftDetails}>
              <Heading as="h2" style={shiftHeading}>
                Your Shift Details
              </Heading>
              <Text style={detailItem}>
                <strong>Role:</strong> {shiftTitle}
              </Text>
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

            <div dangerouslySetInnerHTML={{ __html: body }} style={paragraph} />

            <Text style={paragraph}>
              If you have any questions or need to make changes to your signup,
              please let us know as soon as possible.
            </Text>

            {shiftDetailsUrl && (
              <Section style={buttonContainer}>
                <Button style={button} href={shiftDetailsUrl}>
                  View Full Shift Details
                </Button>
              </Section>
            )}

            <Text style={paragraph}>
              We appreciate your commitment to making a difference in our
              community!
            </Text>

            <Text style={signature}>
              Looking forward to working with you,
              <br />
              {orgName}
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              This email confirms your volunteer signup. Please keep this for
              your records.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default VolunteerConfirmationEmail

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

const confirmationMessage = {
  fontSize: '18px',
  lineHeight: '26px',
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

const shiftDetails = {
  backgroundColor: '#f0fdf4',
  padding: '24px',
  borderRadius: '8px',
  marginTop: '24px',
  marginBottom: '24px',
  border: '2px solid #86efac',
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
