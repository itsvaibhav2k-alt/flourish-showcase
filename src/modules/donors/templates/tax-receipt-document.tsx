import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer';

export interface TaxReceiptProps {
  organization: {
    name: string;
    ein: string;
    taxExemptStatus: string;
    address?: string;
    receiptFooter?: string;
  };
  donor: {
    name: string;
    address?: { street?: string; city?: string; state?: string; zip?: string };
  };
  gifts: Array<{
    date: string;
    amount: number;
    campaign?: string;
    paymentMethod?: string;
  }>;
  year: number;
  totalAmount: number;
  receiptNumber: string;
  generatedAt: Date;
}

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#1a1a1a',
  },
  orgName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  orgAddress: {
    fontSize: 9,
    color: '#666666',
    marginTop: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  donorSection: {
    marginBottom: 20,
  },
  donorLabel: {
    fontSize: 8,
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  donorName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  donorAddress: {
    fontSize: 10,
    color: '#333333',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'column',
  },
  metaLabel: {
    fontSize: 8,
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    color: '#1a1a1a',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  tableCell: {
    fontSize: 10,
    color: '#1a1a1a',
  },
  colDate: {
    width: '20%',
  },
  colAmount: {
    width: '20%',
    textAlign: 'right',
  },
  colCampaign: {
    width: '35%',
  },
  colMethod: {
    width: '25%',
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderTopWidth: 2,
    borderTopColor: '#1a1a1a',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a1a',
    width: '80%',
    textAlign: 'right',
    paddingRight: 10,
  },
  totalAmount: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a1a',
    width: '20%',
    textAlign: 'right',
  },
  legalSection: {
    marginTop: 30,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  legalText: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.5,
  },
  customFooter: {
    marginTop: 16,
    fontSize: 9,
    color: '#666666',
    fontStyle: 'italic',
  },
  pageFooter: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: '#999999',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 10,
  },
});

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDonorAddress(
  address?: { street?: string; city?: string; state?: string; zip?: string },
): string | null {
  if (!address) return null;
  const parts: string[] = [];
  if (address.street) parts.push(address.street);
  const cityStateZip = [address.city, address.state, address.zip]
    .filter(Boolean)
    .join(', ');
  if (cityStateZip) parts.push(cityStateZip);
  return parts.length > 0 ? parts.join('\n') : null;
}

export function TaxReceiptDocument({
  organization,
  donor,
  gifts,
  year,
  totalAmount,
  receiptNumber,
  generatedAt,
}: TaxReceiptProps) {
  const donorAddr = formatDonorAddress(donor.address);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Organization Header */}
        <View style={styles.header}>
          <Text style={styles.orgName}>{organization.name}</Text>
          {organization.address && (
            <Text style={styles.orgAddress}>{organization.address}</Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>
          Donation Receipt — {year}
        </Text>

        {/* Donor Info */}
        <View style={styles.donorSection}>
          <Text style={styles.donorLabel}>Donor</Text>
          <Text style={styles.donorName}>{donor.name}</Text>
          {donorAddr && <Text style={styles.donorAddress}>{donorAddr}</Text>}
        </View>

        {/* Receipt Meta */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Receipt Number</Text>
            <Text style={styles.metaValue}>{receiptNumber}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Date Generated</Text>
            <Text style={styles.metaValue}>
              {generatedAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* Gifts Table */}
        <View>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
            <Text style={[styles.tableHeaderCell, styles.colCampaign]}>Campaign</Text>
            <Text style={[styles.tableHeaderCell, styles.colMethod]}>Payment Method</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
          </View>

          {/* Table Rows */}
          {gifts.map((gift, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colDate]}>
                {formatDate(gift.date)}
              </Text>
              <Text style={[styles.tableCell, styles.colCampaign]}>
                {gift.campaign || '—'}
              </Text>
              <Text style={[styles.tableCell, styles.colMethod]}>
                {gift.paymentMethod || '—'}
              </Text>
              <Text style={[styles.tableCell, styles.colAmount]}>
                {formatCurrency(gift.amount)}
              </Text>
            </View>
          ))}

          {/* Total Row */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
          </View>
        </View>

        {/* IRS Required Legal Language */}
        <View style={styles.legalSection}>
          <Text style={styles.legalText}>
            No goods or services were provided in exchange for this contribution.{' '}
            {organization.name} is a tax-exempt organization under Section{' '}
            {organization.taxExemptStatus} of the Internal Revenue Code. Federal Tax ID (EIN):{' '}
            {organization.ein}.
          </Text>
        </View>

        {/* Custom Footer */}
        {organization.receiptFooter && (
          <Text style={styles.customFooter}>{organization.receiptFooter}</Text>
        )}

        {/* Page Footer */}
        <Text style={styles.pageFooter}>
          {organization.name} — Tax Receipt #{receiptNumber}
        </Text>
      </Page>
    </Document>
  );
}
