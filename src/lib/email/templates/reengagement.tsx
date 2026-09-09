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

interface ReengagementEmailProps {
  contactName: string
  orgName: string
  body: string
  lastInteractionDate?: string
  donationUrl?: string
  volunteerUrl?: string
}

export function ReengagementEmail({
  contactName,
  orgName,
  body,
  lastInteractionDate,
  donationUrl,
  volunteerUrl,
}: ReengagementEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={heading}>{orgName}</Heading>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Dear {contactName},</Text>

            {lastInteractionDate && (
              <Text style={paragraph}>
                We noticed it's been a while since we've heard from you, and we
                wanted to reach out. Your past support has meant so much to us.
              </Text>
            )}

            <div dangerouslySetInnerHTML={{ __html: body }} style={paragraph} />

            <Section style={highlightBox}>
              <Text style={highlightText}>
                We'd love to reconnect and share how your previous contributions
                have made a real impact in our community.
              </Text>
            </Section>

            <Text style={paragraph}>
              Whether through a donation, volunteering your time, or simply
              staying connected, there are many ways you can continue to make a
              difference with us.
            </Text>

            {(donationUrl || volunteerUrl) && (
              <Section style={buttonContainer}>
                {donationUrl && (
                  <Button style={button} href={donationUrl}>
                    Make a Donation
                  </Button>
                )}
                {volunteerUrl && (
                  <Button style={buttonSecondary} href={volunteerUrl}>
                    Volunteer With Us
                  </Button>
                )}
              </Section>
            )}

            <Text style={paragraph}>
              We understand that priorities change, and if you'd prefer not to
              receive these messages, please let us know. Otherwise, we hope to
              see you back in our community soon!
            </Text>

            <Text style={signature}>
              With warm regards,
              <br />
              {orgName}
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Your past support has been invaluable. We hope to continue working
              together toward our shared mission.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default ReengagementEmail

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
  backgroundColor: '#16804d',
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

const highlightBox = {
  backgroundColor: '#faf5ff',
  padding: '20px',
  borderRadius: '8px',
  marginTop: '24px',
  marginBottom: '24px',
  borderLeft: '4px solid #16804d',
}

const highlightText = {
  fontSize: '18px',
  lineHeight: '26px',
  color: '#6b21a8',
  fontWeight: '600',
  margin: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '32px',
}

const button = {
  backgroundColor: '#16804d',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  marginRight: '12px',
  marginBottom: '12px',
}

const buttonSecondary = {
  backgroundColor: '#ffffff',
  borderRadius: '6px',
  color: '#16804d',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  border: '2px solid #16804d',
  marginBottom: '12px',
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
