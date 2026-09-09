'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, TrendingUp, Users, Heart, UserCheck } from 'lucide-react'

// Define suggested queries inline to avoid importing from server-only module
const getSuggestedQueries = () => [
  // Donor queries
  {
    question: 'Who are my top 10 donors this year?',
    category: 'Donors',
  },
  {
    question: 'Show me lapsed major donors',
    category: 'Donors',
  },
  {
    question: 'How many new donors did we get this month?',
    category: 'Donors',
  },
  {
    question: 'What is the average gift amount for recurring donors?',
    category: 'Donors',
  },
  {
    question: 'Show me at-risk donors with lifetime giving over $1000',
    category: 'Donors',
  },

  // Giving queries
  {
    question: 'How much did we raise last month vs this month?',
    category: 'Giving',
  },
  {
    question: 'What was our total revenue in Q4?',
    category: 'Giving',
  },
  {
    question: 'Show me all gifts over $500 this year',
    category: 'Giving',
  },
  {
    question: 'How many recurring donors do we have?',
    category: 'Giving',
  },

  // Volunteer queries
  {
    question: 'Show me volunteers who haven\'t signed up in 30 days',
    category: 'Volunteers',
  },
  {
    question: 'Who are my most reliable volunteers?',
    category: 'Volunteers',
  },
  {
    question: 'How many volunteer hours were logged this month?',
    category: 'Volunteers',
  },
  {
    question: 'Which shifts need more volunteers?',
    category: 'Volunteers',
  },

  // General queries
  {
    question: 'Show me contacts tagged with "board member"',
    category: 'Contacts',
  },
  {
    question: 'Who did we add to the database this week?',
    category: 'Contacts',
  },
]

interface SuggestedQueriesProps {
  onSelectQuery: (query: string) => void
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Donors: Heart,
  Giving: TrendingUp,
  Volunteers: UserCheck,
  Contacts: Users,
}

export function SuggestedQueries({ onSelectQuery }: SuggestedQueriesProps) {
  const queries = getSuggestedQueries()

  // Group queries by category
  const groupedQueries = queries.reduce((acc, query) => {
    if (!acc[query.category]) {
      acc[query.category] = []
    }
    acc[query.category].push(query)
    return acc
  }, {} as Record<string, typeof queries>)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <Sparkles className="h-4 w-4" />
        <span>Try asking Flora a question</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.entries(groupedQueries).map(([category, categoryQueries]) => {
          const Icon = categoryIcons[category] || Users
          return (
            <Card key={category}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="h-4 w-4 text-primary-600" />
                  <h3 className="font-medium text-sm text-neutral-900">{category}</h3>
                </div>
                <div className="space-y-2">
                  {categoryQueries.slice(0, 3).map((query, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto py-2 px-3 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                      onClick={() => onSelectQuery(query.question)}
                    >
                      <span className="line-clamp-2">{query.question}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
