'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganizationId } from '@/lib/auth/organization'
import type { SmartAskConfig } from '../schemas/smart-ask.schema'

/**
 * Get Smart Ask configuration for the current organization
 * Returns default values if no config exists
 */
export async function getSmartAskConfig(): Promise<SmartAskConfig | null> {
  try {
    const supabase = await createClient()

    // In BYPASS_AUTH mode, get org from cookie; otherwise from user membership
    let organizationId: string | null = null

    if (process.env.BYPASS_AUTH === 'true') {
      organizationId = await getCurrentOrganizationId()
    } else {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Unauthorized')
      }

      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (memberError || !memberData) {
        throw new Error('Organization not found')
      }

      organizationId = memberData.organization_id
    }

    if (!organizationId) {
      throw new Error('Organization not found')
    }

    // Get config from database
    const { data: config, error } = await supabase
      .from('smart_ask_config')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching smart ask config:', error)
      return null
    }

    return config as SmartAskConfig | null
  } catch (error) {
    console.error('Error in getSmartAskConfig:', error)
    return null
  }
}

/**
 * Get default Smart Ask configuration (when no config exists)
 */
export async function getDefaultSmartAskConfig(): Promise<Omit<
  SmartAskConfig,
  'id' | 'organization_id' | 'created_at' | 'updated_at'
>> {
  return {
    stretch_multiplier: 1.5,
    target_multiplier: 1.2,
    accessible_multiplier: 1.0,
    capacity_weight: 0.3,
    high_risk_reduction: 0.2,
    medium_risk_reduction: 0.1,
    min_confidence_score: 0.6,
    segment_rules: [],
    enabled: true,
  }
}
