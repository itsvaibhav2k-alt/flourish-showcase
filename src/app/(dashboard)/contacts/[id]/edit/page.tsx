import { notFound } from 'next/navigation'
export const dynamic = 'force-dynamic'
import { PageHeader } from '@/components/layouts/page-header'
import { ContactForm } from '@/modules/contacts/components/contact-form'
import { getContact } from '@/modules/contacts/queries/get-contact'
import { getContactFullName } from '@/modules/contacts/utils/contact-helpers'

interface EditContactPageProps {
  params: Promise<{ id: string }>
}

export default async function EditContactPage({ params }: EditContactPageProps) {
  const { id } = await params
  const contact = await getContact(id)

  if (!contact) {
    notFound()
  }

  const fullName = getContactFullName(contact)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${fullName}`}
        description="Update contact information"
      />

      <ContactForm contact={contact} mode="edit" />
    </div>
  )
}
