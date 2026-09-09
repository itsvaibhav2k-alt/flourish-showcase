'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { GrantWriterPage } from './grant-writer-page'
import { getGrantApplication, getGrantProposal } from '../queries/get-org-context'
import {
  FileText,
  Plus,
  Loader2,
  Search,
  Calendar,
  DollarSign,
  Sparkles,
  ChevronRight
} from 'lucide-react'

interface Grant {
  id: string
  funder_name: string
  grant_name: string | null
  amount_requested: number | null
  status: string
  deadline: string | null
}

interface GrantWriterPageWrapperProps {
  grants?: Grant[]
}

/**
 * Wrapper component that shows a grant picker before the full writer
 */
export function GrantWriterPageWrapper({ grants: initialGrants = [] }: GrantWriterPageWrapperProps) {
  const [grants, setGrants] = useState<Grant[]>(initialGrants)
  const [selectedGrant, setSelectedGrant] = useState<{
    id: string
    grantDetails: {
      funder_name: string
      grant_name: string | null
      amount_requested: number | null
    }
    existingProposal?: {
      id: string
      sections: any
    } | null
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingGrants, setLoadingGrants] = useState(initialGrants.length === 0)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch grants if not provided
  useEffect(() => {
    if (initialGrants.length === 0) {
      fetchGrants()
    }
  }, [])

  async function fetchGrants() {
    setLoadingGrants(true)
    try {
      // Use fetch to get grants from API or directly from Supabase
      const response = await fetch('/api/grants')
      if (response.ok) {
        const data = await response.json()
        setGrants(data.grants || [])
      }
    } catch (error) {
      console.error('Error fetching grants:', error)
    } finally {
      setLoadingGrants(false)
    }
  }

  const handleSelectGrant = async (grant: Grant) => {
    setIsLoading(true)
    try {
      // Check if there's an existing proposal
      const existingProposal = await getGrantProposal(grant.id)

      setSelectedGrant({
        id: grant.id,
        grantDetails: {
          funder_name: grant.funder_name,
          grant_name: grant.grant_name,
          amount_requested: grant.amount_requested,
        },
        existingProposal,
      })
    } catch (error) {
      console.error('Error loading grant details:', error)
      // Still select the grant, just without existing proposal
      setSelectedGrant({
        id: grant.id,
        grantDetails: {
          funder_name: grant.funder_name,
          grant_name: grant.grant_name,
          amount_requested: grant.amount_requested,
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  // If a grant is selected, show the full writer
  if (selectedGrant) {
    return (
      <GrantWriterPage
        grantId={selectedGrant.id}
        grantDetails={selectedGrant.grantDetails}
        existingProposal={selectedGrant.existingProposal}
      />
    )
  }

  // Filter grants by search query
  const filteredGrants = grants.filter(grant => {
    const query = searchQuery.toLowerCase()
    return (
      grant.funder_name.toLowerCase().includes(query) ||
      (grant.grant_name && grant.grant_name.toLowerCase().includes(query))
    )
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900">AI Grant Writer</h1>
          </div>
          <p className="text-neutral-600">
            Generate comprehensive grant proposals using AI with your organization's data
          </p>
        </div>
      </div>

      {/* Search & Instructions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search grants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/addon/grant-tracker/new'}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Grant Opportunity
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grants List */}
      {loadingGrants ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <p className="text-neutral-500">Loading grant opportunities...</p>
          </div>
        </div>
      ) : filteredGrants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              {searchQuery ? 'No matching grants found' : 'No grant opportunities yet'}
            </h3>
            <p className="text-neutral-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Add grant opportunities from the Grant Tracker to generate AI proposals'}
            </p>
            <Button onClick={() => window.location.href = '/addon/grant-tracker'}>
              Go to Grant Tracker
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            Select a Grant to Write Proposal
          </h2>
          {filteredGrants.map((grant) => (
            <Card
              key={grant.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleSelectGrant(grant)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-neutral-900">
                        {grant.funder_name}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={
                          grant.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : grant.status === 'submitted'
                            ? 'bg-blue-100 text-blue-800'
                            : grant.status === 'won'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-neutral-100'
                        }
                      >
                        {grant.status}
                      </Badge>
                    </div>
                    {grant.grant_name && (
                      <p className="text-neutral-600 mb-3">{grant.grant_name}</p>
                    )}
                    <div className="flex items-center gap-6 text-sm text-neutral-500">
                      {grant.amount_requested && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>${grant.amount_requested.toLocaleString()}</span>
                        </div>
                      )}
                      {grant.deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(grant.deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-neutral-400" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
