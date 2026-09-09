import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Link,
  Img,
  Preview,
} from '@react-email/components'

interface CustomEmailProps {
  recipientName: string
  subject: string
  body: string
  orgName: string
  signerName?: string
  signerTitle?: string
  websiteUrl?: string
}

export function CustomEmail({
  recipientName,
  subject,
  body,
  orgName,
  signerName = 'The Team',
  signerTitle,
  websiteUrl,
}: CustomEmailProps) {
  const firstName = recipientName.split(' ')[0]

  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <Img
              src="https://flourishnpo.com/logo.png"
              alt="Flourish"
              width="150"
              height="auto"
              style={logoImage}
            />
            <Heading style={heroHeading}>{subject}</Heading>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Dear {firstName},</Text>

            {/* Email Body - render as HTML */}
            <div
              dangerouslySetInnerHTML={{ __html: formatBody(body) }}
              style={bodyContent}
            />

            {/* Signature */}
            <div style={signatureBlock}>
              <Text style={signatureText}>Warm regards,</Text>
              <Text style={signerNameStyle}>{signerName}</Text>
              {signerTitle && <Text style={signerTitleStyle}>{signerTitle}</Text>}
              <Text style={signerOrgStyle}>{orgName}</Text>
            </div>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            {/* Social Links */}
            <div style={socialLinks}>
              {websiteUrl && (
                <Link href={websiteUrl} style={socialLink}>
                  🌐 Website
                </Link>
              )}
            </div>

            <Text style={footerSmall}>
              © {new Date().getFullYear()} {orgName}. All rights reserved.
              <br />
              Sent with 💜 from Flourish
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Format plain text body to HTML paragraphs
function formatBody(body: string): string {
  // If body already contains HTML tags, return as-is
  if (/<[a-z][\s\S]*>/i.test(body)) {
    return body
  }

  // Convert plain text to paragraphs
  return body
    .split('\n\n')
    .map(para => `<p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #374151;">${para.replace(/\n/g, '<br/>')}</p>`)
    .join('')
}

export default CustomEmail

// ============================================================================
// STYLES
// ============================================================================

const main = {
  backgroundColor: '#f5f3ff', // purple-50
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  marginTop: '40px',
  marginBottom: '40px',
  borderRadius: '12px',
  overflow: 'hidden' as const,
  maxWidth: '600px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
}

const header = {
  background: 'linear-gradient(180deg, #16804d 0%, #14532d 100%)',
  padding: '32px 40px 40px',
  textAlign: 'center' as const,
}

const logoImage = {
  maxWidth: '150px',
  height: 'auto',
  margin: '0 auto 24px',
}

const heroHeading = {
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#ffffff',
  margin: '0',
  lineHeight: '36px',
}

const content = {
  padding: '32px 40px',
}

const greeting = {
  fontSize: '18px',
  lineHeight: '28px',
  marginTop: '0',
  marginBottom: '24px',
  color: '#1f2937',
}

const bodyContent = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#374151',
}

const signatureBlock = {
  marginTop: '32px',
  paddingTop: '24px',
  borderTop: '1px solid #e5e7eb',
}

const signatureText = {
  fontSize: '16px',
  color: '#374151',
  margin: '0 0 16px 0',
  fontStyle: 'italic' as const,
}

const signerNameStyle = {
  fontSize: '18px',
  fontWeight: 'bold' as const,
  color: '#1f2937',
  margin: '0 0 4px 0',
}

const signerTitleStyle = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0 0 2px 0',
}

const signerOrgStyle = {
  fontSize: '14px',
  color: '#16804d',
  fontWeight: '500' as const,
  margin: '0',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '0',
}

const footer = {
  padding: '24px 40px',
  backgroundColor: '#faf5ff',
}

const socialLinks = {
  textAlign: 'center' as const,
  marginBottom: '16px',
}

const socialLink = {
  display: 'inline-block' as const,
  margin: '0 12px',
  fontSize: '14px',
  color: '#16804d',
  textDecoration: 'none' as const,
}

const footerSmall = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  margin: '0',
}
