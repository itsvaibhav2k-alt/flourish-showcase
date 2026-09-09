import { PageHeader } from '@/components/layouts/page-header'
export const dynamic = 'force-dynamic'
import { GiftImportWizard } from '@/modules/donors/components/gift-import-wizard'

export default function GiftsImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Gifts"
        description="Upload a CSV file to import gift records. Make sure contacts exist before importing."
      />

      <GiftImportWizard />
    </div>
  )
}
