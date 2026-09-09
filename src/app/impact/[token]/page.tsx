/**
 * Public Impact Story Page
 *
 * Shareable public page for viewing impact stories (no auth required)
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getStoryByToken,
  incrementStoryViewCount,
} from '@/modules/impact-stories/queries/get-story-by-token'
import { PublicStoryView } from '@/modules/impact-stories/components/public-story-view'

interface PageProps {
  params: {
    token: string
  }
}

export const dynamic = 'force-dynamic'

/**
 * Generate metadata for social sharing
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const story = await getStoryByToken(params.token)

  if (!story) {
    return {
      title: 'Impact Story Not Found',
    }
  }

  const orgName = story.organization?.name || 'Our Organization'
  const contactName = story.contact?.first_name || 'Friend'

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const storyUrl = `${baseUrl}/impact/${params.token}`

  // Generate description from story content (first 160 characters)
  const description = story.story_content.substring(0, 157) + '...'

  return {
    title: `${story.title} | ${orgName}`,
    description,
    openGraph: {
      title: story.title,
      description,
      url: storyUrl,
      siteName: orgName,
      type: 'article',
      images: [
        {
          url: story.organization?.logo_url || `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: story.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: story.title,
      description,
      images: [story.organization?.logo_url || `${baseUrl}/og-image.png`],
    },
  }
}

export default async function PublicImpactStoryPage({ params }: PageProps) {
  const story = await getStoryByToken(params.token)

  if (!story) {
    notFound()
  }

  // Increment view count asynchronously (don't await to avoid blocking render)
  incrementStoryViewCount(params.token).catch((err) => {
    console.error('Failed to increment view count:', err)
  })

  return <PublicStoryView story={story} />
}
