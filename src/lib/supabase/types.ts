WARN: no SMS provider is enabled. Disabling phone login
Connecting to db 5432
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      action_dismissals: {
        Row: {
          action_key: string
          dismissed_at: string | null
          dismissed_by: string | null
          id: string
          organization_id: string
        }
        Insert: {
          action_key: string
          dismissed_at?: string | null
          dismissed_by?: string | null
          id?: string
          organization_id: string
        }
        Update: {
          action_key?: string
          dismissed_at?: string | null
          dismissed_by?: string | null
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_dismissals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          activity_type: string
          contact_id: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          organization_id: string
        }
        Insert: {
          activity_type: string
          contact_id: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          organization_id: string
        }
        Update: {
          activity_type?: string
          contact_id?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tile_cache: {
        Row: {
          created_at: string
          data: Json
          expires_at: string
          id: string
          organization_id: string
          tile_id: string | null
          tile_type: string
        }
        Insert: {
          created_at?: string
          data: Json
          expires_at: string
          id?: string
          organization_id: string
          tile_id?: string | null
          tile_type: string
        }
        Update: {
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
          organization_id?: string
          tile_id?: string | null
          tile_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tile_cache_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          cache_creation_tokens: number | null
          cache_read_tokens: number | null
          contact_id: string | null
          created_at: string
          draft_id: string | null
          email_type: string | null
          estimated_cost: number
          id: string
          input_tokens: number
          model: string
          organization_id: string
          output_tokens: number
        }
        Insert: {
          cache_creation_tokens?: number | null
          cache_read_tokens?: number | null
          contact_id?: string | null
          created_at?: string
          draft_id?: string | null
          email_type?: string | null
          estimated_cost: number
          id?: string
          input_tokens: number
          model: string
          organization_id: string
          output_tokens: number
        }
        Update: {
          cache_creation_tokens?: number | null
          cache_read_tokens?: number | null
          contact_id?: string | null
          created_at?: string
          draft_id?: string | null
          email_type?: string | null
          estimated_cost?: number
          id?: string
          input_tokens?: number
          model?: string
          organization_id?: string
          output_tokens?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "email_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          organization_id: string
          permissions: Json | null
          rate_limit_per_minute: number | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          organization_id: string
          permissions?: Json | null
          rate_limit_per_minute?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          organization_id?: string
          permissions?: Json | null
          rate_limit_per_minute?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_webhook_logs: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          ip_address: string | null
          organization_id: string
          request_body: Json | null
          request_method: string
          request_path: string | null
          response_body: Json | null
          response_status: number | null
          webhook_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          organization_id: string
          request_body?: Json | null
          request_method: string
          request_path?: string | null
          response_body?: Json | null
          response_status?: number | null
          webhook_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          organization_id?: string
          request_body?: Json | null
          request_method?: string
          request_path?: string | null
          response_body?: Json | null
          response_status?: number | null
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_webhook_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "automation_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_webhooks: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          name: string
          organization_id: string
          rate_limit_per_minute: number | null
          updated_at: string | null
          usage_count: number | null
          webhook_token: string
          webhook_type: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name: string
          organization_id: string
          rate_limit_per_minute?: number | null
          updated_at?: string | null
          usage_count?: number | null
          webhook_token: string
          webhook_type: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string
          organization_id?: string
          rate_limit_per_minute?: number | null
          updated_at?: string | null
          usage_count?: number | null
          webhook_token?: string
          webhook_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      call_queue_items: {
        Row: {
          attempts: number | null
          contact_id: string
          created_at: string
          id: string
          last_attempt_at: string | null
          last_outcome: string | null
          queue_id: string
          sort_order: number
          status: string
          voice_call_id: string | null
        }
        Insert: {
          attempts?: number | null
          contact_id: string
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          last_outcome?: string | null
          queue_id: string
          sort_order?: number
          status?: string
          voice_call_id?: string | null
        }
        Update: {
          attempts?: number | null
          contact_id?: string
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          last_outcome?: string | null
          queue_id?: string
          sort_order?: number
          status?: string
          voice_call_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_queue_items_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_queue_items_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "call_queues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_queue_items_voice_call_id_fkey"
            columns: ["voice_call_id"]
            isOneToOne: false
            referencedRelation: "voice_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      call_queues: {
        Row: {
          call_type: string
          calls_completed: number | null
          calls_connected: number | null
          context: Json | null
          created_at: string
          created_by: string | null
          current_index: number | null
          id: string
          max_retries: number | null
          name: string
          organization_id: string
          retry_delay_hours: number | null
          status: string
          stop_condition: Json | null
          total_contacts: number | null
          updated_at: string
        }
        Insert: {
          call_type: string
          calls_completed?: number | null
          calls_connected?: number | null
          context?: Json | null
          created_at?: string
          created_by?: string | null
          current_index?: number | null
          id?: string
          max_retries?: number | null
          name: string
          organization_id: string
          retry_delay_hours?: number | null
          status?: string
          stop_condition?: Json | null
          total_contacts?: number | null
          updated_at?: string
        }
        Update: {
          call_type?: string
          calls_completed?: number | null
          calls_connected?: number | null
          context?: Json | null
          created_at?: string
          created_by?: string | null
          current_index?: number | null
          id?: string
          max_retries?: number | null
          name?: string
          organization_id?: string
          retry_delay_hours?: number | null
          status?: string
          stop_condition?: Json | null
          total_contacts?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_queues_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      call_transcripts: {
        Row: {
          action_items: string[] | null
          call_id: string
          created_at: string
          id: string
          key_topics: string[] | null
          organization_id: string
          sentiment_analysis: Json | null
          summary: string | null
          transcript: Json | null
          updated_at: string
        }
        Insert: {
          action_items?: string[] | null
          call_id: string
          created_at?: string
          id?: string
          key_topics?: string[] | null
          organization_id: string
          sentiment_analysis?: Json | null
          summary?: string | null
          transcript?: Json | null
          updated_at?: string
        }
        Update: {
          action_items?: string[] | null
          call_id?: string
          created_at?: string
          id?: string
          key_topics?: string[] | null
          organization_id?: string
          sentiment_analysis?: Json | null
          summary?: string | null
          transcript?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_transcripts_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "voice_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_transcripts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_gifts: {
        Row: {
          campaign_id: string
          created_at: string
          gift_id: string
          id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          gift_id: string
          id?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          gift_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_gifts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_gifts_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          campaign_type: string
          created_at: string
          created_by: string | null
          description: string | null
          donor_count: number | null
          end_date: string | null
          goal_amount: number | null
          id: string
          name: string
          organization_id: string
          raised_amount: number | null
          start_date: string | null
          status: string
          target_audience: Json | null
          updated_at: string
        }
        Insert: {
          campaign_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          donor_count?: number | null
          end_date?: string | null
          goal_amount?: number | null
          id?: string
          name: string
          organization_id: string
          raised_amount?: number | null
          start_date?: string | null
          status?: string
          target_audience?: Json | null
          updated_at?: string
        }
        Update: {
          campaign_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          donor_count?: number | null
          end_date?: string | null
          goal_amount?: number | null
          id?: string
          name?: string
          organization_id?: string
          raised_amount?: number | null
          start_date?: string | null
          status?: string
          target_audience?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_notes: {
        Row: {
          contact_id: string
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          organization_id: string
        }
        Insert: {
          contact_id: string
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          organization_id: string
        }
        Update: {
          contact_id?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          contact_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          organization_id: string
          status: string | null
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          contact_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id: string
          status?: string | null
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          contact_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: Json | null
          archived_at: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string
          id: string
          is_donor: boolean | null
          is_volunteer: boolean | null
          lapse_risk: string | null
          last_gift_date: string | null
          last_name: string
          lifetime_giving: number | null
          merged_into_id: string | null
          organization_id: string
          phone: string | null
          phone_call_opt_out: boolean | null
          portal_token: string | null
          reliability_score: number | null
          tags: string[] | null
          total_gifts: number | null
          total_volunteer_hours: number | null
          updated_at: string
          version: number
        }
        Insert: {
          address?: Json | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          id?: string
          is_donor?: boolean | null
          is_volunteer?: boolean | null
          lapse_risk?: string | null
          last_gift_date?: string | null
          last_name: string
          lifetime_giving?: number | null
          merged_into_id?: string | null
          organization_id: string
          phone?: string | null
          phone_call_opt_out?: boolean | null
          portal_token?: string | null
          reliability_score?: number | null
          tags?: string[] | null
          total_gifts?: number | null
          total_volunteer_hours?: number | null
          updated_at?: string
          version?: number
        }
        Update: {
          address?: Json | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_donor?: boolean | null
          is_volunteer?: boolean | null
          lapse_risk?: string | null
          last_gift_date?: string | null
          last_name?: string
          lifetime_giving?: number | null
          merged_into_id?: string | null
          organization_id?: string
          phone?: string | null
          phone_call_opt_out?: boolean | null
          portal_token?: string | null
          reliability_score?: number | null
          tags?: string[] | null
          total_gifts?: number | null
          total_volunteer_hours?: number | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "contacts_merged_into_id_fkey"
            columns: ["merged_into_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_actions: {
        Row: {
          action_type: string
          completed_at: string | null
          contact_id: string
          context_snapshot: Json | null
          created_at: string
          description: string
          dismissed_at: string | null
          donor_score: number | null
          donor_score_reasoning: string | null
          generated_at: string
          id: string
          optimal_timing: string | null
          organization_id: string
          outcome: string | null
          predicted_gift_amount: number | null
          predicted_success_rate: number | null
          preferred_channel: string | null
          priority: number
          reasoning: string
          status: string
          suggested_at: string
          title: string
        }
        Insert: {
          action_type: string
          completed_at?: string | null
          contact_id: string
          context_snapshot?: Json | null
          created_at?: string
          description: string
          dismissed_at?: string | null
          donor_score?: number | null
          donor_score_reasoning?: string | null
          generated_at?: string
          id?: string
          optimal_timing?: string | null
          organization_id: string
          outcome?: string | null
          predicted_gift_amount?: number | null
          predicted_success_rate?: number | null
          preferred_channel?: string | null
          priority: number
          reasoning: string
          status?: string
          suggested_at?: string
          title: string
        }
        Update: {
          action_type?: string
          completed_at?: string | null
          contact_id?: string
          context_snapshot?: Json | null
          created_at?: string
          description?: string
          dismissed_at?: string | null
          donor_score?: number | null
          donor_score_reasoning?: string | null
          generated_at?: string
          id?: string
          optimal_timing?: string | null
          organization_id?: string
          outcome?: string | null
          predicted_gift_amount?: number | null
          predicted_success_rate?: number | null
          preferred_channel?: string | null
          priority?: number
          reasoning?: string
          status?: string
          suggested_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "copilot_actions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copilot_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cultivation_moves: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          logged_by: string | null
          move_date: string
          move_type: string
          next_step: string | null
          organization_id: string
          outcome: string | null
          prospect_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          logged_by?: string | null
          move_date: string
          move_type: string
          next_step?: string | null
          organization_id: string
          outcome?: string | null
          prospect_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          logged_by?: string | null
          move_date?: string
          move_type?: string
          next_step?: string | null
          organization_id?: string
          outcome?: string | null
          prospect_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cultivation_moves_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cultivation_moves_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cultivation_moves_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "major_gift_prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_ai_tiles: {
        Row: {
          created_at: string
          created_by: string | null
          data_sources: string[] | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          prompt: string
          refresh_schedule: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_sources?: string[] | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          prompt: string
          refresh_schedule?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_sources?: string[] | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          prompt?: string
          refresh_schedule?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_ai_tiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_ai_tiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_forms: {
        Row: {
          allow_custom_amount: boolean
          allow_recurring: boolean
          button_text: string
          created_at: string
          default_amount: number | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          slug: string
          suggested_amounts: Json | null
          thank_you_message: string | null
          updated_at: string
        }
        Insert: {
          allow_custom_amount?: boolean
          allow_recurring?: boolean
          button_text?: string
          created_at?: string
          default_amount?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          slug: string
          suggested_amounts?: Json | null
          thank_you_message?: string | null
          updated_at?: string
        }
        Update: {
          allow_custom_amount?: boolean
          allow_recurring?: boolean
          button_text?: string
          created_at?: string
          default_amount?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          slug?: string
          suggested_amounts?: Json | null
          thank_you_message?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_forms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          contact_id: string | null
          created_at: string
          currency: string
          donation_form_id: string | null
          donor_email: string
          donor_name: string | null
          donor_phone: string | null
          employer_name: string | null
          id: string
          is_recurring: boolean
          matching_gift_amount: number | null
          matching_gift_company_id: string | null
          matching_gift_eligible: boolean | null
          matching_gift_ratio: number | null
          matching_gift_received_at: string | null
          matching_gift_reminder_sent_at: string | null
          matching_gift_status: string | null
          metadata: Json | null
          notes: string | null
          organization_id: string
          receipt_sent_at: string | null
          status: string
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          tribute_message: string | null
          tribute_name: string | null
          tribute_notification_sent_at: string | null
          tribute_notify_email: string | null
          tribute_notify_name: string | null
          tribute_type: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          contact_id?: string | null
          created_at?: string
          currency?: string
          donation_form_id?: string | null
          donor_email: string
          donor_name?: string | null
          donor_phone?: string | null
          employer_name?: string | null
          id?: string
          is_recurring?: boolean
          matching_gift_amount?: number | null
          matching_gift_company_id?: string | null
          matching_gift_eligible?: boolean | null
          matching_gift_ratio?: number | null
          matching_gift_received_at?: string | null
          matching_gift_reminder_sent_at?: string | null
          matching_gift_status?: string | null
          metadata?: Json | null
          notes?: string | null
          organization_id: string
          receipt_sent_at?: string | null
          status: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          tribute_message?: string | null
          tribute_name?: string | null
          tribute_notification_sent_at?: string | null
          tribute_notify_email?: string | null
          tribute_notify_name?: string | null
          tribute_type?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          contact_id?: string | null
          created_at?: string
          currency?: string
          donation_form_id?: string | null
          donor_email?: string
          donor_name?: string | null
          donor_phone?: string | null
          employer_name?: string | null
          id?: string
          is_recurring?: boolean
          matching_gift_amount?: number | null
          matching_gift_company_id?: string | null
          matching_gift_eligible?: boolean | null
          matching_gift_ratio?: number | null
          matching_gift_received_at?: string | null
          matching_gift_reminder_sent_at?: string | null
          matching_gift_status?: string | null
          metadata?: Json | null
          notes?: string | null
          organization_id?: string
          receipt_sent_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          tribute_message?: string | null
          tribute_name?: string | null
          tribute_notification_sent_at?: string | null
          tribute_notify_email?: string | null
          tribute_notify_name?: string | null
          tribute_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_donation_form_id_fkey"
            columns: ["donation_form_id"]
            isOneToOne: false
            referencedRelation: "donation_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_scores: {
        Row: {
          contact_id: string
          created_at: string
          giving_likelihood: number
          id: string
          last_calculated_at: string
          optimal_ask_date: string | null
          organization_id: string
          predicted_amount: number | null
          preferred_channel: string | null
          score_reasoning: string
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          giving_likelihood: number
          id?: string
          last_calculated_at?: string
          optimal_ask_date?: string | null
          organization_id: string
          predicted_amount?: number | null
          preferred_channel?: string | null
          score_reasoning: string
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          giving_likelihood?: number
          id?: string
          last_calculated_at?: string
          optimal_ask_date?: string | null
          organization_id?: string
          predicted_amount?: number | null
          preferred_channel?: string | null
          score_reasoning?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donor_scores_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_drafts: {
        Row: {
          body: string
          bounced_at: string | null
          click_count: number | null
          clicked_at: string | null
          contact_id: string
          context_snapshot: Json | null
          created_at: string
          created_by: string | null
          delivered_at: string | null
          email_type: string
          id: string
          model_used: string | null
          open_count: number | null
          opened_at: string | null
          organization_id: string
          prompt_version: string | null
          resend_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sent_at: string | null
          sent_by: string | null
          status: string
          subject: string
          trigger_event: string | null
          trigger_event_id: string | null
          unique_clicks: number | null
          unique_opens: number | null
          updated_at: string | null
        }
        Insert: {
          body: string
          bounced_at?: string | null
          click_count?: number | null
          clicked_at?: string | null
          contact_id: string
          context_snapshot?: Json | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          email_type: string
          id?: string
          model_used?: string | null
          open_count?: number | null
          opened_at?: string | null
          organization_id: string
          prompt_version?: string | null
          resend_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject: string
          trigger_event?: string | null
          trigger_event_id?: string | null
          unique_clicks?: number | null
          unique_opens?: number | null
          updated_at?: string | null
        }
        Update: {
          body?: string
          bounced_at?: string | null
          click_count?: number | null
          clicked_at?: string | null
          contact_id?: string
          context_snapshot?: Json | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          email_type?: string
          id?: string
          model_used?: string | null
          open_count?: number | null
          opened_at?: string | null
          organization_id?: string
          prompt_version?: string | null
          resend_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject?: string
          trigger_event?: string | null
          trigger_event_id?: string | null
          unique_clicks?: number | null
          unique_opens?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_drafts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_drafts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          contact_id: string | null
          created_at: string
          draft_id: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          occurred_at: string
          organization_id: string
          resend_id: string | null
          user_agent: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          draft_id?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          occurred_at?: string
          organization_id: string
          resend_id?: string | null
          user_agent?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          draft_id?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          occurred_at?: string
          organization_id?: string
          resend_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "email_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequence_steps: {
        Row: {
          conditions: Json | null
          created_at: string | null
          custom_instructions: string | null
          delay_days: number | null
          delay_hours: number | null
          id: string
          name: string
          sequence_id: string
          step_order: number
          subject_template: string | null
          template_type: string
          updated_at: string | null
        }
        Insert: {
          conditions?: Json | null
          created_at?: string | null
          custom_instructions?: string | null
          delay_days?: number | null
          delay_hours?: number | null
          id?: string
          name: string
          sequence_id: string
          step_order: number
          subject_template?: string | null
          template_type: string
          updated_at?: string | null
        }
        Update: {
          conditions?: Json | null
          created_at?: string | null
          custom_instructions?: string | null
          delay_days?: number | null
          delay_hours?: number | null
          id?: string
          name?: string
          sequence_id?: string
          step_order?: number
          subject_template?: string | null
          template_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_template: boolean | null
          name: string
          organization_id: string
          trigger_config: Json | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          name: string
          organization_id: string
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          name?: string
          organization_id?: string
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sequences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      external_form_webhooks: {
        Row: {
          created_at: string | null
          field_mapping: Json | null
          id: string
          is_active: boolean | null
          last_submission_at: string | null
          name: string
          organization_id: string
          submission_count: number | null
          updated_at: string | null
          webhook_token: string
        }
        Insert: {
          created_at?: string | null
          field_mapping?: Json | null
          id?: string
          is_active?: boolean | null
          last_submission_at?: string | null
          name: string
          organization_id: string
          submission_count?: number | null
          updated_at?: string | null
          webhook_token?: string
        }
        Update: {
          created_at?: string | null
          field_mapping?: Json | null
          id?: string
          is_active?: boolean | null
          last_submission_at?: string | null
          name?: string
          organization_id?: string
          submission_count?: number | null
          updated_at?: string | null
          webhook_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_form_webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      funders: {
        Row: {
          average_grant_size: number | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          focus_areas: string[] | null
          geographic_focus: string[] | null
          id: string
          last_contact_date: string | null
          name: string
          notes: string | null
          organization_id: string
          relationship_status: string | null
          total_awarded: number | null
          type: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          average_grant_size?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          focus_areas?: string[] | null
          geographic_focus?: string[] | null
          id?: string
          last_contact_date?: string | null
          name: string
          notes?: string | null
          organization_id: string
          relationship_status?: string | null
          total_awarded?: number | null
          type?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          average_grant_size?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          focus_areas?: string[] | null
          geographic_focus?: string[] | null
          id?: string
          last_contact_date?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          relationship_status?: string | null
          total_awarded?: number | null
          type?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          amount: number
          archived_at: string | null
          archived_by: string | null
          campaign: string | null
          contact_id: string
          created_at: string
          employer_name: string | null
          gift_date: string
          gift_type: string | null
          id: string
          matching_gift_amount: number | null
          matching_gift_company_id: string | null
          matching_gift_eligible: boolean | null
          matching_gift_ratio: number | null
          matching_gift_received_at: string | null
          matching_gift_reminder_sent_at: string | null
          matching_gift_status: string | null
          notes: string | null
          organization_id: string
          payment_method: string | null
          recorded_by: string | null
          thanked_at: string | null
          tribute_message: string | null
          tribute_name: string | null
          tribute_notification_sent_at: string | null
          tribute_notify_email: string | null
          tribute_notify_name: string | null
          tribute_type: string | null
          version: number
        }
        Insert: {
          amount: number
          archived_at?: string | null
          archived_by?: string | null
          campaign?: string | null
          contact_id: string
          created_at?: string
          employer_name?: string | null
          gift_date: string
          gift_type?: string | null
          id?: string
          matching_gift_amount?: number | null
          matching_gift_company_id?: string | null
          matching_gift_eligible?: boolean | null
          matching_gift_ratio?: number | null
          matching_gift_received_at?: string | null
          matching_gift_reminder_sent_at?: string | null
          matching_gift_status?: string | null
          notes?: string | null
          organization_id: string
          payment_method?: string | null
          recorded_by?: string | null
          thanked_at?: string | null
          tribute_message?: string | null
          tribute_name?: string | null
          tribute_notification_sent_at?: string | null
          tribute_notify_email?: string | null
          tribute_notify_name?: string | null
          tribute_type?: string | null
          version?: number
        }
        Update: {
          amount?: number
          archived_at?: string | null
          archived_by?: string | null
          campaign?: string | null
          contact_id?: string
          created_at?: string
          employer_name?: string | null
          gift_date?: string
          gift_type?: string | null
          id?: string
          matching_gift_amount?: number | null
          matching_gift_company_id?: string | null
          matching_gift_eligible?: boolean | null
          matching_gift_ratio?: number | null
          matching_gift_received_at?: string | null
          matching_gift_reminder_sent_at?: string | null
          matching_gift_status?: string | null
          notes?: string | null
          organization_id?: string
          payment_method?: string | null
          recorded_by?: string | null
          thanked_at?: string | null
          tribute_message?: string | null
          tribute_name?: string | null
          tribute_notification_sent_at?: string | null
          tribute_notify_email?: string | null
          tribute_notify_name?: string | null
          tribute_type?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "gifts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gifts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      giving_potential: {
        Row: {
          affinity_score: number | null
          capacity_score: number | null
          contact_id: string
          created_at: string | null
          data_sources: Json | null
          employer: string | null
          estimated_net_worth: number | null
          giving_gap_ratio: number | null
          id: string
          job_title: string | null
          last_enriched_at: string | null
          nonprofit_board_count: number | null
          notes: string | null
          organization_id: string
          overall_score: number | null
          political_donations: number | null
          propensity_score: number | null
          real_estate_value: number | null
          stock_holdings: number | null
          updated_at: string | null
        }
        Insert: {
          affinity_score?: number | null
          capacity_score?: number | null
          contact_id: string
          created_at?: string | null
          data_sources?: Json | null
          employer?: string | null
          estimated_net_worth?: number | null
          giving_gap_ratio?: number | null
          id?: string
          job_title?: string | null
          last_enriched_at?: string | null
          nonprofit_board_count?: number | null
          notes?: string | null
          organization_id: string
          overall_score?: number | null
          political_donations?: number | null
          propensity_score?: number | null
          real_estate_value?: number | null
          stock_holdings?: number | null
          updated_at?: string | null
        }
        Update: {
          affinity_score?: number | null
          capacity_score?: number | null
          contact_id?: string
          created_at?: string | null
          data_sources?: Json | null
          employer?: string | null
          estimated_net_worth?: number | null
          giving_gap_ratio?: number | null
          id?: string
          job_title?: string | null
          last_enriched_at?: string | null
          nonprofit_board_count?: number | null
          notes?: string | null
          organization_id?: string
          overall_score?: number | null
          political_donations?: number | null
          propensity_score?: number | null
          real_estate_value?: number | null
          stock_holdings?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "giving_potential_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giving_potential_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      grant_applications: {
        Row: {
          amount_awarded: number | null
          amount_requested: number | null
          attachments: Json | null
          created_at: string
          created_by: string | null
          deadline: string | null
          decision_at: string | null
          end_date: string | null
          funder_contact_id: string | null
          funder_id: string | null
          funder_name: string
          grant_name: string | null
          id: string
          notes: string | null
          organization_id: string
          program_area: string | null
          reporting_due: string | null
          requirements: string | null
          start_date: string | null
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          amount_awarded?: number | null
          amount_requested?: number | null
          attachments?: Json | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          decision_at?: string | null
          end_date?: string | null
          funder_contact_id?: string | null
          funder_id?: string | null
          funder_name: string
          grant_name?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          program_area?: string | null
          reporting_due?: string | null
          requirements?: string | null
          start_date?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          amount_awarded?: number | null
          amount_requested?: number | null
          attachments?: Json | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          decision_at?: string | null
          end_date?: string | null
          funder_contact_id?: string | null
          funder_id?: string | null
          funder_name?: string
          grant_name?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          program_area?: string | null
          reporting_due?: string | null
          requirements?: string | null
          start_date?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grant_applications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grant_applications_funder_contact_id_fkey"
            columns: ["funder_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grant_applications_funder_id_fkey"
            columns: ["funder_id"]
            isOneToOne: false
            referencedRelation: "funders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grant_applications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      grant_proposals: {
        Row: {
          ai_cost_usd: number | null
          ai_model: string | null
          ai_tokens_used: number | null
          created_at: string
          created_by: string | null
          generated_at: string | null
          grant_id: string
          id: string
          org_context_snapshot: Json | null
          organization_id: string
          sections: Json
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          ai_cost_usd?: number | null
          ai_model?: string | null
          ai_tokens_used?: number | null
          created_at?: string
          created_by?: string | null
          generated_at?: string | null
          grant_id: string
          id?: string
          org_context_snapshot?: Json | null
          organization_id: string
          sections?: Json
          status?: string
          updated_at?: string
          version?: number
        }
        Update: {
          ai_cost_usd?: number | null
          ai_model?: string | null
          ai_tokens_used?: number | null
          created_at?: string
          created_by?: string | null
          generated_at?: string | null
          grant_id?: string
          id?: string
          org_context_snapshot?: Json | null
          organization_id?: string
          sections?: Json
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "grant_proposals_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "grant_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grant_proposals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      impact_metrics: {
        Row: {
          cost_per_unit: number
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          metric_name: string
          organization_id: string
          unit_label: string
          unit_label_plural: string | null
          updated_at: string | null
        }
        Insert: {
          cost_per_unit: number
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          metric_name: string
          organization_id: string
          unit_label: string
          unit_label_plural?: string | null
          updated_at?: string | null
        }
        Update: {
          cost_per_unit?: number
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          metric_name?: string
          organization_id?: string
          unit_label?: string
          unit_label_plural?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "impact_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      impact_stories: {
        Row: {
          card_image_url: string | null
          contact_id: string
          created_at: string | null
          generated_at: string | null
          headline: string | null
          id: string
          impact_breakdown: Json | null
          is_public: boolean | null
          metrics: Json | null
          narrative: string | null
          opened_at: string | null
          organization_id: string
          period_end: string | null
          period_start: string | null
          sent_at: string | null
          share_token: string | null
          story_content: string | null
          time_period: string
          title: string | null
          total_giving: number
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          card_image_url?: string | null
          contact_id: string
          created_at?: string | null
          generated_at?: string | null
          headline?: string | null
          id?: string
          impact_breakdown?: Json | null
          is_public?: boolean | null
          metrics?: Json | null
          narrative?: string | null
          opened_at?: string | null
          organization_id: string
          period_end?: string | null
          period_start?: string | null
          sent_at?: string | null
          share_token?: string | null
          story_content?: string | null
          time_period: string
          title?: string | null
          total_giving: number
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          card_image_url?: string | null
          contact_id?: string
          created_at?: string | null
          generated_at?: string | null
          headline?: string | null
          id?: string
          impact_breakdown?: Json | null
          is_public?: boolean | null
          metrics?: Json | null
          narrative?: string | null
          opened_at?: string | null
          organization_id?: string
          period_end?: string | null
          period_start?: string | null
          sent_at?: string | null
          share_token?: string | null
          story_content?: string | null
          time_period?: string
          title?: string | null
          total_giving?: number
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "impact_stories_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impact_stories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      major_gift_prospects: {
        Row: {
          actual_gift_amount: number | null
          assigned_to: string | null
          contact_id: string
          created_at: string | null
          id: string
          next_move: string | null
          next_move_date: string | null
          notes: string | null
          optimal_ask_timing: string | null
          organization_id: string
          outcome: string | null
          predicted_gift_amount: number | null
          readiness_score: number | null
          recommended_ask_amount: number | null
          stage: string
          stage_entered_at: string | null
          target_ask_amount: number | null
          target_ask_date: string | null
          updated_at: string | null
        }
        Insert: {
          actual_gift_amount?: number | null
          assigned_to?: string | null
          contact_id: string
          created_at?: string | null
          id?: string
          next_move?: string | null
          next_move_date?: string | null
          notes?: string | null
          optimal_ask_timing?: string | null
          organization_id: string
          outcome?: string | null
          predicted_gift_amount?: number | null
          readiness_score?: number | null
          recommended_ask_amount?: number | null
          stage: string
          stage_entered_at?: string | null
          target_ask_amount?: number | null
          target_ask_date?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_gift_amount?: number | null
          assigned_to?: string | null
          contact_id?: string
          created_at?: string | null
          id?: string
          next_move?: string | null
          next_move_date?: string | null
          notes?: string | null
          optimal_ask_timing?: string | null
          organization_id?: string
          outcome?: string | null
          predicted_gift_amount?: number | null
          readiness_score?: number | null
          recommended_ask_amount?: number | null
          stage?: string
          stage_entered_at?: string | null
          target_ask_amount?: number | null
          target_ask_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "major_gift_prospects_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "major_gift_prospects_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "major_gift_prospects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          ai_email_generation: boolean | null
          ai_next_step_suggestions: boolean | null
          auto_reengagement_calls: boolean | null
          auto_thank_you_calls: boolean | null
          auto_thank_you_emails: boolean | null
          auto_volunteer_confirmations: boolean | null
          auto_volunteer_reminders: boolean | null
          created_at: string
          double_the_donation_public_key: string | null
          ein: string | null
          id: string
          matching_gifts_enabled: boolean | null
          name: string
          public_slug: string | null
          reminder_hours_before: number | null
          retell_phone_number: string | null
          settings: Json | null
          slug: string
          snippets: Json | null
          stripe_mode: string | null
          stripe_publishable_key: string | null
          stripe_secret_key_encrypted: string | null
          stripe_webhook_secret_encrypted: string | null
          tax_exempt_status: string | null
          tax_receipt_footer: string | null
          tone_preset: string | null
          updated_at: string | null
          voice_call_config: Json | null
          voice_call_hours_end: number | null
          voice_call_hours_start: number | null
          voice_calls_enabled: boolean | null
          voice_closing_style: string | null
          voice_formality: string | null
          voice_greeting_style: string | null
          voice_monthly_budget: number | null
          voice_samples: string[] | null
          voice_shift_reminders: boolean | null
          voice_signature_phrases: string[] | null
          voice_summary: string | null
          voice_thank_you_threshold: number | null
          voice_tone_characteristics: string[] | null
          voice_trained_at: string | null
          voice_trained_by: string | null
          voice_warmth: number | null
        }
        Insert: {
          ai_email_generation?: boolean | null
          ai_next_step_suggestions?: boolean | null
          auto_reengagement_calls?: boolean | null
          auto_thank_you_calls?: boolean | null
          auto_thank_you_emails?: boolean | null
          auto_volunteer_confirmations?: boolean | null
          auto_volunteer_reminders?: boolean | null
          created_at?: string
          double_the_donation_public_key?: string | null
          ein?: string | null
          id?: string
          matching_gifts_enabled?: boolean | null
          name: string
          public_slug?: string | null
          reminder_hours_before?: number | null
          retell_phone_number?: string | null
          settings?: Json | null
          slug: string
          snippets?: Json | null
          stripe_mode?: string | null
          stripe_publishable_key?: string | null
          stripe_secret_key_encrypted?: string | null
          stripe_webhook_secret_encrypted?: string | null
          tax_exempt_status?: string | null
          tax_receipt_footer?: string | null
          tone_preset?: string | null
          updated_at?: string | null
          voice_call_config?: Json | null
          voice_call_hours_end?: number | null
          voice_call_hours_start?: number | null
          voice_calls_enabled?: boolean | null
          voice_closing_style?: string | null
          voice_formality?: string | null
          voice_greeting_style?: string | null
          voice_monthly_budget?: number | null
          voice_samples?: string[] | null
          voice_shift_reminders?: boolean | null
          voice_signature_phrases?: string[] | null
          voice_summary?: string | null
          voice_thank_you_threshold?: number | null
          voice_tone_characteristics?: string[] | null
          voice_trained_at?: string | null
          voice_trained_by?: string | null
          voice_warmth?: number | null
        }
        Update: {
          ai_email_generation?: boolean | null
          ai_next_step_suggestions?: boolean | null
          auto_reengagement_calls?: boolean | null
          auto_thank_you_calls?: boolean | null
          auto_thank_you_emails?: boolean | null
          auto_volunteer_confirmations?: boolean | null
          auto_volunteer_reminders?: boolean | null
          created_at?: string
          double_the_donation_public_key?: string | null
          ein?: string | null
          id?: string
          matching_gifts_enabled?: boolean | null
          name?: string
          public_slug?: string | null
          reminder_hours_before?: number | null
          retell_phone_number?: string | null
          settings?: Json | null
          slug?: string
          snippets?: Json | null
          stripe_mode?: string | null
          stripe_publishable_key?: string | null
          stripe_secret_key_encrypted?: string | null
          stripe_webhook_secret_encrypted?: string | null
          tax_exempt_status?: string | null
          tax_receipt_footer?: string | null
          tone_preset?: string | null
          updated_at?: string | null
          voice_call_config?: Json | null
          voice_call_hours_end?: number | null
          voice_call_hours_start?: number | null
          voice_calls_enabled?: boolean | null
          voice_closing_style?: string | null
          voice_formality?: string | null
          voice_greeting_style?: string | null
          voice_monthly_budget?: number | null
          voice_samples?: string[] | null
          voice_shift_reminders?: boolean | null
          voice_signature_phrases?: string[] | null
          voice_summary?: string | null
          voice_thank_you_threshold?: number | null
          voice_tone_characteristics?: string[] | null
          voice_trained_at?: string | null
          voice_trained_by?: string | null
          voice_warmth?: number | null
        }
        Relationships: []
      }
      program_metrics: {
        Row: {
          cost_per_unit: number
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          metric_name: string
          metric_value: number
          organization_id: string
          program_name: string
          time_period: string
          updated_at: string | null
        }
        Insert: {
          cost_per_unit: number
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          metric_name: string
          metric_value?: number
          organization_id: string
          program_name: string
          time_period: string
          updated_at?: string | null
        }
        Update: {
          cost_per_unit?: number
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          metric_name?: string
          metric_value?: number
          organization_id?: string
          program_name?: string
          time_period?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_entries: {
        Row: {
          bucket_start: string
          created_at: string | null
          id: string
          key: string
          request_count: number | null
        }
        Insert: {
          bucket_start: string
          created_at?: string | null
          id?: string
          key: string
          request_count?: number | null
        }
        Update: {
          bucket_start?: string
          created_at?: string | null
          id?: string
          key?: string
          request_count?: number | null
        }
        Relationships: []
      }
      retell_agents: {
        Row: {
          agent_name: string | null
          agent_type: string
          config_snapshot: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          organization_id: string
          retell_agent_id: string
          retell_voice_id: string | null
          updated_at: string
          voice_profile_hash: string | null
          voice_speed: number | null
          voice_temperature: number | null
        }
        Insert: {
          agent_name?: string | null
          agent_type?: string
          config_snapshot?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          organization_id: string
          retell_agent_id: string
          retell_voice_id?: string | null
          updated_at?: string
          voice_profile_hash?: string | null
          voice_speed?: number | null
          voice_temperature?: number | null
        }
        Update: {
          agent_name?: string | null
          agent_type?: string
          config_snapshot?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          organization_id?: string
          retell_agent_id?: string
          retell_voice_id?: string | null
          updated_at?: string
          voice_profile_hash?: string | null
          voice_speed?: number | null
          voice_temperature?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "retell_agents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_segments: {
        Row: {
          created_at: string | null
          created_by: string | null
          entity_type: string
          filters: Json
          id: string
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          entity_type: string
          filters?: Json
          id?: string
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          entity_type?: string
          filters?: Json
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_segments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_emails: {
        Row: {
          created_at: string | null
          created_by: string | null
          cron_expression: string | null
          custom_params: Json | null
          description: string | null
          email_type: string
          id: string
          is_active: boolean | null
          last_run_at: string | null
          last_run_result: Json | null
          name: string
          next_run_at: string | null
          organization_id: string
          recipient_filter: Json | null
          schedule_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          cron_expression?: string | null
          custom_params?: Json | null
          description?: string | null
          email_type: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          last_run_result?: Json | null
          name: string
          next_run_at?: string | null
          organization_id: string
          recipient_filter?: Json | null
          schedule_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          cron_expression?: string | null
          custom_params?: Json | null
          description?: string | null
          email_type?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          last_run_result?: Json | null
          name?: string
          next_run_at?: string | null
          organization_id?: string
          recipient_filter?: Json | null
          schedule_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_emails_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sequence_enrollments: {
        Row: {
          cancelled_at: string | null
          cancelled_reason: string | null
          completed_at: string | null
          contact_id: string
          created_at: string | null
          current_step: number | null
          enrolled_at: string | null
          id: string
          next_step_at: string | null
          organization_id: string
          sequence_id: string
          status: string | null
          trigger_event_id: string | null
          trigger_event_type: string | null
          updated_at: string | null
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_reason?: string | null
          completed_at?: string | null
          contact_id: string
          created_at?: string | null
          current_step?: number | null
          enrolled_at?: string | null
          id?: string
          next_step_at?: string | null
          organization_id: string
          sequence_id: string
          status?: string | null
          trigger_event_id?: string | null
          trigger_event_type?: string | null
          updated_at?: string | null
        }
        Update: {
          cancelled_at?: string | null
          cancelled_reason?: string | null
          completed_at?: string | null
          contact_id?: string
          created_at?: string | null
          current_step?: number | null
          enrolled_at?: string | null
          id?: string
          next_step_at?: string | null
          organization_id?: string
          sequence_id?: string
          status?: string | null
          trigger_event_id?: string | null
          trigger_event_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sequence_enrollments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_enrollments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      sequence_step_executions: {
        Row: {
          created_at: string | null
          draft_id: string | null
          enrollment_id: string
          error_message: string | null
          executed_at: string | null
          id: string
          scheduled_at: string
          skip_reason: string | null
          status: string | null
          step_id: string
        }
        Insert: {
          created_at?: string | null
          draft_id?: string | null
          enrollment_id: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          scheduled_at: string
          skip_reason?: string | null
          status?: string | null
          step_id: string
        }
        Update: {
          created_at?: string | null
          draft_id?: string | null
          enrollment_id?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          scheduled_at?: string
          skip_reason?: string | null
          status?: string | null
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequence_step_executions_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "email_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_step_executions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "sequence_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_step_executions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "email_sequence_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_signups: {
        Row: {
          checked_in_at: string | null
          confirmation_sent: boolean | null
          contact_id: string
          created_at: string
          hours_logged: number | null
          id: string
          morning_reminder_sent: boolean | null
          no_show: boolean | null
          reminder_1_sent: boolean | null
          reminder_2_sent: boolean | null
          shift_id: string
          status: string
          thank_you_sent: boolean | null
        }
        Insert: {
          checked_in_at?: string | null
          confirmation_sent?: boolean | null
          contact_id: string
          created_at?: string
          hours_logged?: number | null
          id?: string
          morning_reminder_sent?: boolean | null
          no_show?: boolean | null
          reminder_1_sent?: boolean | null
          reminder_2_sent?: boolean | null
          shift_id: string
          status?: string
          thank_you_sent?: boolean | null
        }
        Update: {
          checked_in_at?: string | null
          confirmation_sent?: boolean | null
          contact_id?: string
          created_at?: string
          hours_logged?: number | null
          id?: string
          morning_reminder_sent?: boolean | null
          no_show?: boolean | null
          reminder_1_sent?: boolean | null
          reminder_2_sent?: boolean | null
          shift_id?: string
          status?: string
          thank_you_sent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_signups_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_signups_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          capacity: number | null
          created_at: string
          description: string | null
          end_time: string
          id: string
          is_public: boolean | null
          location: string | null
          organization_id: string
          recurrence_parent_id: string | null
          recurrence_rule: Json | null
          start_time: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          is_public?: boolean | null
          location?: string | null
          organization_id: string
          recurrence_parent_id?: string | null
          recurrence_rule?: Json | null
          start_time: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          is_public?: boolean | null
          location?: string | null
          organization_id?: string
          recurrence_parent_id?: string | null
          recurrence_rule?: Json | null
          start_time?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_recurrence_parent_id_fkey"
            columns: ["recurrence_parent_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsorship_benefits: {
        Row: {
          benefit_name: string
          created_at: string
          delivered: boolean | null
          delivered_at: string | null
          delivered_by: string | null
          description: string | null
          id: string
          notes: string | null
          organization_id: string
          sponsorship_id: string
        }
        Insert: {
          benefit_name: string
          created_at?: string
          delivered?: boolean | null
          delivered_at?: string | null
          delivered_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          sponsorship_id: string
        }
        Update: {
          benefit_name?: string
          created_at?: string
          delivered?: boolean | null
          delivered_at?: string | null
          delivered_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          sponsorship_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsorship_benefits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorship_benefits_sponsorship_id_fkey"
            columns: ["sponsorship_id"]
            isOneToOne: false
            referencedRelation: "sponsorships"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsorship_tiers: {
        Row: {
          amount: number
          color: string | null
          created_at: string
          default_benefits: Json | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          amount: number
          color?: string | null
          created_at?: string
          default_benefits?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          color?: string | null
          created_at?: string
          default_benefits?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsorship_tiers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsorships: {
        Row: {
          amount: number | null
          assigned_to: string | null
          contact_id: string
          created_at: string
          end_date: string | null
          id: string
          last_contact_date: string | null
          next_follow_up: string | null
          notes: string | null
          organization_id: string
          payment_received: boolean | null
          renewal_date: string | null
          season: string | null
          start_date: string | null
          status: string
          tier_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          assigned_to?: string | null
          contact_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          last_contact_date?: string | null
          next_follow_up?: string | null
          notes?: string | null
          organization_id: string
          payment_received?: boolean | null
          renewal_date?: string | null
          season?: string | null
          start_date?: string | null
          status?: string
          tier_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          assigned_to?: string | null
          contact_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          last_contact_date?: string | null
          next_follow_up?: string | null
          notes?: string | null
          organization_id?: string
          payment_received?: boolean | null
          renewal_date?: string | null
          season?: string | null
          start_date?: string | null
          status?: string
          tier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsorships_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorships_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "sponsorship_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      voice_calls: {
        Row: {
          call_script: Json | null
          call_type: string
          contact_id: string | null
          context_snapshot: Json | null
          created_at: string
          direction: string
          duration_seconds: number | null
          ended_at: string | null
          estimated_cost: number | null
          follow_up_needed: boolean | null
          follow_up_notes: string | null
          from_phone: string | null
          id: string
          initiated_by: string | null
          organization_id: string
          outcome: string | null
          retell_agent_id: string | null
          retell_call_id: string | null
          sentiment: string | null
          started_at: string | null
          status: string
          to_phone: string | null
          trigger_event: string | null
          trigger_event_id: string | null
          updated_at: string
        }
        Insert: {
          call_script?: Json | null
          call_type: string
          contact_id?: string | null
          context_snapshot?: Json | null
          created_at?: string
          direction?: string
          duration_seconds?: number | null
          ended_at?: string | null
          estimated_cost?: number | null
          follow_up_needed?: boolean | null
          follow_up_notes?: string | null
          from_phone?: string | null
          id?: string
          initiated_by?: string | null
          organization_id: string
          outcome?: string | null
          retell_agent_id?: string | null
          retell_call_id?: string | null
          sentiment?: string | null
          started_at?: string | null
          status?: string
          to_phone?: string | null
          trigger_event?: string | null
          trigger_event_id?: string | null
          updated_at?: string
        }
        Update: {
          call_script?: Json | null
          call_type?: string
          contact_id?: string | null
          context_snapshot?: Json | null
          created_at?: string
          direction?: string
          duration_seconds?: number | null
          ended_at?: string | null
          estimated_cost?: number | null
          follow_up_needed?: boolean | null
          follow_up_notes?: string | null
          from_phone?: string | null
          id?: string
          initiated_by?: string | null
          organization_id?: string
          outcome?: string | null
          retell_agent_id?: string | null
          retell_call_id?: string | null
          sentiment?: string | null
          started_at?: string | null
          status?: string
          to_phone?: string | null
          trigger_event?: string | null
          trigger_event_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_calls_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_calls_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      email_tracking_stats: {
        Row: {
          click_rate: number | null
          open_rate: number | null
          organization_id: string | null
          total_bounced: number | null
          total_clicked: number | null
          total_delivered: number | null
          total_opened: number | null
          total_sent: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_drafts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      grant_statistics: {
        Row: {
          approved_count: number | null
          declined_count: number | null
          draft_count: number | null
          organization_id: string | null
          pending_count: number | null
          reporting_count: number | null
          researching_count: number | null
          submitted_count: number | null
          success_rate: number | null
          total_applications: number | null
          total_awarded: number | null
          total_requested: number | null
          upcoming_deadlines_count: number | null
          writing_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grant_applications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_activity_stats: {
        Row: {
          avatar_url: string | null
          contacts_added_30d: number | null
          contacts_added_7d: number | null
          contacts_added_90d: number | null
          contacts_added_all: number | null
          email: string | null
          emails_sent_30d: number | null
          emails_sent_7d: number | null
          emails_sent_90d: number | null
          emails_sent_all: number | null
          full_name: string | null
          gift_amount_30d: number | null
          gift_amount_all: number | null
          gifts_recorded_30d: number | null
          gifts_recorded_7d: number | null
          gifts_recorded_90d: number | null
          gifts_recorded_all: number | null
          last_refreshed: string | null
          member_since: string | null
          notes_added_30d: number | null
          notes_added_7d: number | null
          notes_added_90d: number | null
          notes_added_all: number | null
          organization_id: string | null
          role: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      atomic_shift_signup: {
        Args: { p_contact_id: string; p_org_id: string; p_shift_id: string }
        Returns: Json
      }
      calculate_next_run_at: {
        Args: {
          cron_expression: string
          last_run_at?: string
          schedule_type: string
        }
        Returns: string
      }
      calculate_next_step_time: {
        Args: { p_enrollment_id: string }
        Returns: string
      }
      cleanup_rate_limit_entries: { Args: never; Returns: undefined }
      get_current_organization_id: { Args: never; Returns: string }
      get_monthly_ai_cost: {
        Args: { month_date?: string; org_id: string }
        Returns: {
          email_count: number
          total_cost: number
          total_tokens: number
        }[]
      }
      increment_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds?: number }
        Returns: {
          allowed: boolean
          remaining: number
          reset_at: string
        }[]
      }
      increment_story_view_count: {
        Args: { story_token: string }
        Returns: undefined
      }
      is_org_admin: { Args: { org_id: string }; Returns: boolean }
      merge_contacts: {
        Args: {
          p_organization_id: string
          source_contact_id: string
          target_contact_id: string
        }
        Returns: boolean
      }
      refresh_team_activity_stats: { Args: never; Returns: undefined }
      safe_merge_contacts: {
        Args: { p_org_id: string; p_source_id: string; p_target_id: string }
        Returns: Json
      }
      user_org_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          remote_table_id: string | null
          shard_id: string | null
          shard_key: string | null
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            isOneToOne: false
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const

A new version of Supabase CLI is available: v2.75.0 (currently installed v2.74.5)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
