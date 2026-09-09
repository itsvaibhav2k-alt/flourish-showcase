import { PageHeader } from '@/components/layouts/page-header'
export const dynamic = 'force-dynamic'
import { ImportWizard } from '@/modules/contacts/components/import-wizard'

export default function ContactsImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Contacts"
        description="Upload a CSV file to import multiple contacts at once"
      />

      <ImportWizard />
    </div>
  )
}
