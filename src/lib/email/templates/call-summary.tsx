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
  Preview,
} from '@react-email/components';

interface CallSummaryEmailProps {
  orgName: string;
  contactName: string;
  contactPhone: string;
  callType: string;
  callDuration: string;
  callDate: string;
  sentiment: string;
  summary: string;
  keyTopics: string[];
  actionItems: string[];
  followUpNeeded: boolean;
  followUpNotes: string | null;
  transcript: Array<{ role: string; content: string }>;
  dashboardUrl: string;
}

export function CallSummaryEmail({
  orgName,
  contactName,
  contactPhone,
  callType,
  callDuration,
  callDate,
  sentiment,
  summary,
  keyTopics,
  actionItems,
  followUpNeeded,
  followUpNotes,
  transcript,
  dashboardUrl,
}: CallSummaryEmailProps) {
  const sentimentEmoji =
    sentiment === 'very_positive' || sentiment === 'positive'
      ? '&#x1F7E2;'
      : sentiment === 'neutral'
        ? '&#x1F7E1;'
        : '&#x1F534;';

  const callTypeLabel = callType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Html>
      <Head />
      <Preview>
        Flora called {contactName} — {callTypeLabel} ({callDuration})
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={heroHeading}>
              Flora Call Summary
            </Heading>
            <Text style={heroSubtext}>
              {callTypeLabel} call with {contactName}
            </Text>
          </Section>

          {/* Call Details */}
          <Section style={content}>
            <table style={detailsTable}>
              <tbody>
                <tr>
                  <td style={detailLabel}>Contact</td>
                  <td style={detailValue}>
                    {contactName} ({contactPhone})
                  </td>
                </tr>
                <tr>
                  <td style={detailLabel}>Call Type</td>
                  <td style={detailValue}>{callTypeLabel}</td>
                </tr>
                <tr>
                  <td style={detailLabel}>Duration</td>
                  <td style={detailValue}>{callDuration}</td>
                </tr>
                <tr>
                  <td style={detailLabel}>Date</td>
                  <td style={detailValue}>{callDate}</td>
                </tr>
                <tr>
                  <td style={detailLabel}>Sentiment</td>
                  <td
                    style={detailValue}
                    dangerouslySetInnerHTML={{
                      __html: `${sentimentEmoji} ${sentiment.replace(/_/g, ' ')}`,
                    }}
                  />
                </tr>
              </tbody>
            </table>

            <Hr style={hr} />

            {/* Summary */}
            <Heading as="h3" style={sectionHeading}>
              Summary
            </Heading>
            <Text style={bodyText}>{summary}</Text>

            {/* Key Topics */}
            {keyTopics.length > 0 && (
              <>
                <Heading as="h3" style={sectionHeading}>
                  Key Topics
                </Heading>
                <Text style={bodyText}>{keyTopics.join(', ')}</Text>
              </>
            )}

            {/* Action Items */}
            {actionItems.length > 0 && (
              <>
                <Hr style={hr} />
                <Heading as="h3" style={actionHeading}>
                  Action Items Required
                </Heading>
                {actionItems.map((item, i) => (
                  <Text key={i} style={actionItem}>
                    {`\u2610`} {item}
                  </Text>
                ))}
              </>
            )}

            {/* Follow-up Alert */}
            {followUpNeeded && (
              <>
                <Hr style={hr} />
                <Section style={followUpBox}>
                  <Heading as="h3" style={followUpHeading}>
                    Follow-Up Needed
                  </Heading>
                  <Text style={followUpText}>
                    {followUpNotes ||
                      'Flora identified that this contact needs follow-up. Please review the transcript and take action.'}
                  </Text>
                </Section>
              </>
            )}

            {/* Transcript */}
            <Hr style={hr} />
            <Heading as="h3" style={sectionHeading}>
              Full Transcript
            </Heading>
            <Section style={transcriptBox}>
              {transcript.map((turn, i) => (
                <Text key={i} style={turn.role === 'agent' ? floraLine : callerLine}>
                  <strong>{turn.role === 'agent' ? 'Flora' : contactName}:</strong>{' '}
                  {turn.content}
                </Text>
              ))}
            </Section>

            {/* CTA */}
            <Section style={ctaSection}>
              <Link href={dashboardUrl} style={ctaButton}>
                View in Flourish
              </Link>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              This is an automated call summary from Flora, {orgName}&apos;s AI
              assistant.
              <br />
              Sent via Flourish
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default CallSummaryEmail;

// Styles
const main = {
  backgroundColor: '#f0fdf4',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  marginTop: '40px',
  marginBottom: '40px',
  borderRadius: '12px',
  overflow: 'hidden' as const,
  maxWidth: '640px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

const header = {
  background: 'linear-gradient(180deg, #16804d 0%, #14532d 100%)',
  padding: '28px 40px',
  textAlign: 'center' as const,
};

const heroHeading = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#ffffff',
  margin: '0 0 4px 0',
};

const heroSubtext = {
  fontSize: '15px',
  color: '#bbf7d0',
  margin: '0',
};

const content = {
  padding: '28px 40px',
};

const detailsTable = {
  width: '100%' as const,
  borderCollapse: 'collapse' as const,
  marginBottom: '8px',
};

const detailLabel = {
  fontSize: '13px',
  color: '#6b7280',
  fontWeight: '600' as const,
  padding: '4px 12px 4px 0',
  verticalAlign: 'top' as const,
  width: '100px',
};

const detailValue = {
  fontSize: '14px',
  color: '#1f2937',
  padding: '4px 0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
};

const sectionHeading = {
  fontSize: '16px',
  fontWeight: '600' as const,
  color: '#1f2937',
  margin: '0 0 8px 0',
};

const bodyText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#374151',
  margin: '0 0 12px 0',
};

const actionHeading = {
  fontSize: '16px',
  fontWeight: '600' as const,
  color: '#dc2626',
  margin: '0 0 8px 0',
};

const actionItem = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#1f2937',
  margin: '0 0 6px 0',
  paddingLeft: '4px',
};

const followUpBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #f59e0b',
  borderRadius: '8px',
  padding: '16px',
};

const followUpHeading = {
  fontSize: '15px',
  fontWeight: '600' as const,
  color: '#92400e',
  margin: '0 0 6px 0',
};

const followUpText = {
  fontSize: '14px',
  color: '#78350f',
  margin: '0',
  lineHeight: '20px',
};

const transcriptBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '16px',
  border: '1px solid #e5e7eb',
};

const floraLine = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#16804d',
  margin: '0 0 8px 0',
};

const callerLine = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#374151',
  margin: '0 0 8px 0',
};

const ctaSection = {
  textAlign: 'center' as const,
  marginTop: '24px',
};

const ctaButton = {
  display: 'inline-block' as const,
  backgroundColor: '#16804d',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  textDecoration: 'none' as const,
  padding: '10px 24px',
  borderRadius: '6px',
};

const footer = {
  padding: '20px 40px',
  backgroundColor: '#f0fdf4',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '0',
  lineHeight: '18px',
};
