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
  Row,
  Column,
  Preview,
} from '@react-email/components'

interface ThankYouEmailProps {
  donorName: string
  amount: number
  orgName: string
  body: string
  giftDate?: string
  signerName?: string
  signerTitle?: string
  websiteUrl?: string
}

// Generate impact statements based on donation amount
function getImpactStatements(amount: number): string[] {
  if (amount >= 500) {
    return [
      `Fund a month of community programs`,
      `Provide resources for ${Math.floor(amount / 10)} families`,
      `Support staff training and development`,
    ]
  } else if (amount >= 100) {
    return [
      `Provide ${Math.floor(amount / 5)} meals for families in need`,
      `Supply educational materials for ${Math.floor(amount / 10)} students`,
      `Support local community initiatives`,
    ]
  } else if (amount >= 50) {
    return [
      `Provide ${Math.floor(amount / 5)} nutritious meals`,
      `Supply school essentials for ${Math.floor(amount / 10)} children`,
    ]
  } else {
    return [
      `Help provide essential supplies`,
      `Support families in our community`,
    ]
  }
}

export function ThankYouEmail({
  donorName,
  amount,
  orgName,
  body,
  giftDate,
  signerName = 'The Team',
  signerTitle = 'Development Team',
  websiteUrl,
}: ThankYouEmailProps) {
  const impactStatements = getImpactStatements(amount)
  const firstName = donorName.split(' ')[0]
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <Html>
      <Head />
      <Preview>
        Thank you for your ${formattedAmount} gift, {firstName}! Your generosity makes a difference.
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Combined Header + Hero Section */}
          <Section style={headerHero}>
            <Img
              src="https://flourishnpo.com/logo.png"
              alt="Flourish"
              width="150"
              height="auto"
              style={logoImage}
            />
            <Heading style={heroHeading}>
              Thank You, {firstName}!
            </Heading>
            <Text style={heroSubtext}>
              Your generosity is making a real difference
            </Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            {/* Gift Confirmation */}
            <div style={giftBox}>
              <Text style={giftLabel}>YOUR GIFT</Text>
              <Text style={giftAmount}>${formattedAmount}</Text>
              {giftDate && <Text style={giftDate_style}>Received on {giftDate}</Text>}
            </div>

            <Text style={greeting}>Dear {firstName},</Text>

            {/* Personalized Message */}
            <div dangerouslySetInnerHTML={{ __html: body }} style={paragraph} />

            {/* Impact Section */}
            <div style={impactBox}>
              <Text style={impactHeading}>💜 YOUR IMPACT</Text>
              <Text style={impactIntro}>
                Your ${formattedAmount} gift can help provide:
              </Text>
              <ul style={impactList}>
                {impactStatements.map((statement, index) => (
                  <li key={index} style={impactItem}>
                    {statement}
                  </li>
                ))}
              </ul>
            </div>

            <Text style={paragraph}>
              Because of generous supporters like you, we can continue our mission
              to make a meaningful impact in our community. Every gift, no matter
              the size, helps us move closer to our goals.
            </Text>

            <Text style={closingText}>
              Thank you for believing in our work and for being part of our community.
            </Text>

            {/* Signature */}
            <div style={signatureBlock}>
              <Text style={signatureText}>With heartfelt gratitude,</Text>
              <Text style={signerNameStyle}>{signerName}</Text>
              <Text style={signerTitleStyle}>{signerTitle}</Text>
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
              <span style={socialLink}>📘 Facebook</span>
              <span style={socialLink}>📸 Instagram</span>
            </div>

            <Text style={footerText}>
              <strong>Tax Deductible Donation</strong>
              <br />
              This email serves as your official receipt for tax purposes.
              {orgName} is a registered 501(c)(3) nonprofit organization.
              <br />
              Please keep this email for your records.
            </Text>

            <Text style={footerSmall}>
              © {new Date().getFullYear()} {orgName}. All rights reserved.
              <br />
              You received this email because you made a donation.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default ThankYouEmail

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

const headerHero = {
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
  fontSize: '32px',
  fontWeight: 'bold' as const,
  color: '#ffffff',
  margin: '0 0 8px 0',
}

const heroSubtext = {
  fontSize: '16px',
  color: '#e9d5ff', // purple-200
  margin: '0',
}

const content = {
  padding: '32px 40px',
}

const giftBox = {
  backgroundColor: '#faf5ff', // purple-50
  borderRadius: '12px',
  padding: '24px',
  textAlign: 'center' as const,
  marginBottom: '24px',
  border: '2px solid #e9d5ff', // purple-200
}

const giftLabel = {
  fontSize: '12px',
  fontWeight: 'bold' as const,
  color: '#16804d',
  letterSpacing: '1px',
  margin: '0 0 4px 0',
}

const giftAmount = {
  fontSize: '36px',
  fontWeight: 'bold' as const,
  color: '#16804d',
  margin: '0',
}

const giftDate_style = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '8px 0 0 0',
}

const greeting = {
  fontSize: '18px',
  lineHeight: '28px',
  marginTop: '24px',
  marginBottom: '16px',
  color: '#1f2937',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  marginBottom: '16px',
  color: '#374151',
}

const impactBox = {
  backgroundColor: '#faf5ff',
  borderLeft: '4px solid #16804d',
  borderRadius: '0 8px 8px 0',
  padding: '20px 24px',
  margin: '24px 0',
}

const impactHeading = {
  fontSize: '16px',
  fontWeight: 'bold' as const,
  color: '#16804d',
  margin: '0 0 12px 0',
}

const impactIntro = {
  fontSize: '15px',
  color: '#4b5563',
  margin: '0 0 12px 0',
}

const impactList = {
  margin: '0',
  paddingLeft: '20px',
}

const impactItem = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#374151',
  marginBottom: '8px',
}

const closingText = {
  fontSize: '16px',
  lineHeight: '26px',
  marginTop: '24px',
  marginBottom: '24px',
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
  marginBottom: '20px',
}

const socialLink = {
  display: 'inline-block' as const,
  margin: '0 12px',
  fontSize: '14px',
  color: '#16804d',
  textDecoration: 'none' as const,
}

const footerText = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#6b7280',
  textAlign: 'center' as const,
  marginBottom: '16px',
}

const footerSmall = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  margin: '0',
}
