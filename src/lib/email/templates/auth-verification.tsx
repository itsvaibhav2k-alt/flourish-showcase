import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Hr,
} from '@react-email/components'

interface AuthVerificationEmailProps {
  verificationUrl: string
  orgName?: string
}

export function AuthVerificationEmail({
  verificationUrl,
  orgName = 'Flourish',
}: AuthVerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={heading}>{orgName}</Heading>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Verify your email address</Text>

            <Text style={paragraph}>
              Thanks for signing up! Please verify your email address to get
              started with {orgName}.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={verificationUrl}>
                Verify Email Address
              </Button>
            </Section>

            <Text style={paragraph}>
              This link will expire in 24 hours. If you didn&apos;t create an
              account, you can safely ignore this email.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              If the button above doesn&apos;t work, copy and paste this URL
              into your browser:
            </Text>
            <Text style={linkText}>{verificationUrl}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default AuthVerificationEmail

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
  fontSize: '24px',
  fontWeight: 'bold',
  lineHeight: '32px',
  marginTop: '32px',
  marginBottom: '16px',
  color: '#111827',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '16px',
  color: '#374151',
}

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '32px',
}

const button = {
  backgroundColor: '#16804d',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
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
  marginBottom: '8px',
}

const linkText = {
  fontSize: '12px',
  lineHeight: '16px',
  color: '#16804d',
  wordBreak: 'break-all' as const,
}
