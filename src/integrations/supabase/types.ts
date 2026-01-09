export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      access_logs: {
        Row: {
          access_method: string | null
          check_in_at: string
          check_out_at: string | null
          id: string
          notes: string | null
          profile_id: string
          registered_by: string | null
        }
        Insert: {
          access_method?: string | null
          check_in_at?: string
          check_out_at?: string | null
          id?: string
          notes?: string | null
          profile_id: string
          registered_by?: string | null
        }
        Update: {
          access_method?: string | null
          check_in_at?: string
          check_out_at?: string | null
          id?: string
          notes?: string | null
          profile_id?: string
          registered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_registered_by_fkey"
            columns: ["registered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      active_sessions: {
        Row: {
          created_at: string
          device_info: string | null
          id: string
          ip_address: string | null
          is_valid: boolean
          last_activity: string
          profile_id: string
          session_token: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_valid?: boolean
          last_activity?: string
          profile_id: string
          session_token: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_valid?: boolean
          last_activity?: string
          profile_id?: string
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_alerts: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_shift_id: string | null
          related_swap_id: string | null
          title: string
          type: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_shift_id?: string | null
          related_swap_id?: string | null
          title: string
          type: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_shift_id?: string | null
          related_swap_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_alerts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_alerts_related_shift_id_fkey"
            columns: ["related_shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_alerts_related_swap_id_fkey"
            columns: ["related_swap_id"]
            isOneToOne: false
            referencedRelation: "shift_swaps"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_days_off: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          off_date: string
          off_type: string
          reason: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          off_date: string
          off_type?: string
          reason?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          off_date?: string
          off_type?: string
          reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_days_off_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_licenses: {
        Row: {
          activated_at: string | null
          agent_id: string
          created_at: string | null
          expires_at: string
          id: string
          is_trial: boolean | null
          last_payment_at: string | null
          license_key: string
          license_type: string
          monthly_fee: number
          next_reminder_at: string | null
          notes: string | null
          status: string
          trial_password_used: string | null
          trial_started_at: string | null
        }
        Insert: {
          activated_at?: string | null
          agent_id: string
          created_at?: string | null
          expires_at?: string
          id?: string
          is_trial?: boolean | null
          last_payment_at?: string | null
          license_key?: string
          license_type?: string
          monthly_fee?: number
          next_reminder_at?: string | null
          notes?: string | null
          status?: string
          trial_password_used?: string | null
          trial_started_at?: string | null
        }
        Update: {
          activated_at?: string | null
          agent_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          is_trial?: boolean | null
          last_payment_at?: string | null
          license_key?: string
          license_type?: string
          monthly_fee?: number
          next_reminder_at?: string | null
          notes?: string | null
          status?: string
          trial_password_used?: string | null
          trial_started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_licenses_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_broadcast: boolean | null
          message_type: string
          recipient_team: Database["public"]["Enums"]["team_type"] | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_broadcast?: boolean | null
          message_type?: string
          recipient_team?: Database["public"]["Enums"]["team_type"] | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_broadcast?: boolean | null
          message_type?: string
          recipient_team?: Database["public"]["Enums"]["team_type"] | null
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_presence: {
        Row: {
          agent_id: string
          device_info: string | null
          id: string
          is_online: boolean | null
          last_seen: string | null
        }
        Insert: {
          agent_id: string
          device_info?: string | null
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
        }
        Update: {
          agent_id?: string
          device_info?: string | null
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_presence_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          avatar_url: string | null
          city: string | null
          cpf: string
          created_at: string | null
          current_team: Database["public"]["Enums"]["team_type"] | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          is_first_login: boolean | null
          phone: string | null
          registration_number: string | null
          team_joined_at: string | null
          unit: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          cpf: string
          created_at?: string | null
          current_team?: Database["public"]["Enums"]["team_type"] | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          is_first_login?: boolean | null
          phone?: string | null
          registration_number?: string | null
          team_joined_at?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          cpf?: string
          created_at?: string | null
          current_team?: Database["public"]["Enums"]["team_type"] | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_first_login?: boolean | null
          phone?: string | null
          registration_number?: string | null
          team_joined_at?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_usage_logs: {
        Row: {
          action_details: Json | null
          action_type: string
          agent_id: string | null
          created_at: string | null
          device_info: string | null
          id: string
          ip_address: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          agent_id?: string | null
          created_at?: string | null
          device_info?: string | null
          id?: string
          ip_address?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          agent_id?: string | null
          created_at?: string | null
          device_info?: string | null
          id?: string
          ip_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_usage_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_notes: {
        Row: {
          agent_id: string
          color: string | null
          content: string | null
          created_at: string | null
          id: string
          is_reminder: boolean | null
          note_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          color?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_reminder?: boolean | null
          note_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          color?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_reminder?: boolean | null
          note_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_notes_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel_type: string
          content: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          reply_to: string | null
          sender_id: string
          team_channel: Database["public"]["Enums"]["team_type"] | null
          updated_at: string | null
        }
        Insert: {
          channel_type: string
          content: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          reply_to?: string | null
          sender_id: string
          team_channel?: Database["public"]["Enums"]["team_type"] | null
          updated_at?: string | null
        }
        Update: {
          channel_type?: string
          content?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          reply_to?: string | null
          sender_id?: string
          team_channel?: Database["public"]["Enums"]["team_type"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      deleted_items_trash: {
        Row: {
          auto_purge_at: string
          deleted_at: string
          deleted_by: string | null
          id: string
          item_data: Json
          original_id: string
          original_table: string
          permanently_deleted_at: string | null
          restore_attempted_at: string | null
        }
        Insert: {
          auto_purge_at?: string
          deleted_at?: string
          deleted_by?: string | null
          id?: string
          item_data: Json
          original_id: string
          original_table: string
          permanently_deleted_at?: string | null
          restore_attempted_at?: string | null
        }
        Update: {
          auto_purge_at?: string
          deleted_at?: string
          deleted_by?: string | null
          id?: string
          item_data?: Json
          original_id?: string
          original_table?: string
          permanently_deleted_at?: string | null
          restore_attempted_at?: string | null
        }
        Relationships: []
      }
      evolution_photos: {
        Row: {
          body_fat_percentage: number | null
          created_at: string | null
          id: string
          notes: string | null
          photo_date: string
          photo_type: string | null
          photo_url: string
          profile_id: string
          weight_kg: number | null
        }
        Insert: {
          body_fat_percentage?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          photo_date?: string
          photo_type?: string | null
          photo_url: string
          profile_id: string
          weight_kg?: number | null
        }
        Update: {
          body_fat_percentage?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          photo_date?: string
          photo_type?: string | null
          photo_url?: string
          profile_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evolution_photos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_favorites: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          profile_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_favorites_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty: string | null
          equipment: string | null
          id: string
          instructions: string | null
          is_system: boolean | null
          muscle_group: string | null
          name: string
          tenant_id: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          equipment?: string | null
          id?: string
          instructions?: string | null
          is_system?: boolean | null
          muscle_group?: string | null
          name: string
          tenant_id?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          equipment?: string | null
          id?: string
          instructions?: string | null
          is_system?: boolean | null
          muscle_group?: string | null
          name?: string
          tenant_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      freight_messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          receiver_id: string
          request_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          receiver_id: string
          request_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          receiver_id?: string
          request_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "freight_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "freight_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "freight_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "freight_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      freight_proposals: {
        Row: {
          created_at: string | null
          estimated_time_minutes: number | null
          id: string
          message: string | null
          proposed_value: number
          provider_id: string
          request_id: string
          responded_at: string | null
          status: string
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          estimated_time_minutes?: number | null
          id?: string
          message?: string | null
          proposed_value: number
          provider_id: string
          request_id: string
          responded_at?: string | null
          status?: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          estimated_time_minutes?: number | null
          id?: string
          message?: string | null
          proposed_value?: number
          provider_id?: string
          request_id?: string
          responded_at?: string | null
          status?: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "freight_proposals_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "freight_proposals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "freight_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "freight_proposals_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "provider_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      freight_requests: {
        Row: {
          accepted_proposal_id: string | null
          accepted_provider_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cargo_description: string
          cargo_weight_kg: number | null
          client_feedback: string | null
          client_id: string
          client_rating: number | null
          completed_at: string | null
          created_at: string | null
          destination_address: string
          destination_neighborhood_id: string | null
          destination_reference: string | null
          estimated_distance_km: number | null
          estimated_value: number | null
          final_value: number | null
          helpers_count: number | null
          id: string
          is_urgent: boolean | null
          notes: string | null
          origin_address: string
          origin_neighborhood_id: string | null
          origin_reference: string | null
          provider_feedback: string | null
          provider_rating: number | null
          requires_helpers: boolean | null
          scheduled_date: string
          scheduled_time_end: string | null
          scheduled_time_start: string | null
          service_type: string
          status: string
          updated_at: string | null
        }
        Insert: {
          accepted_proposal_id?: string | null
          accepted_provider_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cargo_description: string
          cargo_weight_kg?: number | null
          client_feedback?: string | null
          client_id: string
          client_rating?: number | null
          completed_at?: string | null
          created_at?: string | null
          destination_address: string
          destination_neighborhood_id?: string | null
          destination_reference?: string | null
          estimated_distance_km?: number | null
          estimated_value?: number | null
          final_value?: number | null
          helpers_count?: number | null
          id?: string
          is_urgent?: boolean | null
          notes?: string | null
          origin_address: string
          origin_neighborhood_id?: string | null
          origin_reference?: string | null
          provider_feedback?: string | null
          provider_rating?: number | null
          requires_helpers?: boolean | null
          scheduled_date: string
          scheduled_time_end?: string | null
          scheduled_time_start?: string | null
          service_type?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          accepted_proposal_id?: string | null
          accepted_provider_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cargo_description?: string
          cargo_weight_kg?: number | null
          client_feedback?: string | null
          client_id?: string
          client_rating?: number | null
          completed_at?: string | null
          created_at?: string | null
          destination_address?: string
          destination_neighborhood_id?: string | null
          destination_reference?: string | null
          estimated_distance_km?: number | null
          estimated_value?: number | null
          final_value?: number | null
          helpers_count?: number | null
          id?: string
          is_urgent?: boolean | null
          notes?: string | null
          origin_address?: string
          origin_neighborhood_id?: string | null
          origin_reference?: string | null
          provider_feedback?: string | null
          provider_rating?: number | null
          requires_helpers?: boolean | null
          scheduled_date?: string
          scheduled_time_end?: string | null
          scheduled_time_start?: string | null
          service_type?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "freight_requests_accepted_provider_id_fkey"
            columns: ["accepted_provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "freight_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "freight_requests_destination_neighborhood_id_fkey"
            columns: ["destination_neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "freight_requests_origin_neighborhood_id_fkey"
            columns: ["origin_neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      freight_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "freight_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hydration_records: {
        Row: {
          amount_ml: number
          id: string
          profile_id: string
          recorded_at: string | null
        }
        Insert: {
          amount_ml: number
          id?: string
          profile_id: string
          recorded_at?: string | null
        }
        Update: {
          amount_ml?: number
          id?: string
          profile_id?: string
          recorded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hydration_records_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hydration_settings: {
        Row: {
          daily_goal_ml: number | null
          end_hour: number | null
          id: string
          profile_id: string
          reminder_enabled: boolean | null
          reminder_interval_minutes: number | null
          start_hour: number | null
        }
        Insert: {
          daily_goal_ml?: number | null
          end_hour?: number | null
          id?: string
          profile_id: string
          reminder_enabled?: boolean | null
          reminder_interval_minutes?: number | null
          start_hour?: number | null
        }
        Update: {
          daily_goal_ml?: number | null
          end_hour?: number | null
          id?: string
          profile_id?: string
          reminder_enabled?: boolean | null
          reminder_interval_minutes?: number | null
          start_hour?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hydration_settings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_clients: {
        Row: {
          client_id: string
          fitness_level_by_instructor: string | null
          id: string
          instructor_id: string
          is_active: boolean | null
          link_status: string
          linked_at: string | null
          responded_at: string | null
          unlinked_at: string | null
        }
        Insert: {
          client_id: string
          fitness_level_by_instructor?: string | null
          id?: string
          instructor_id: string
          is_active?: boolean | null
          link_status?: string
          linked_at?: string | null
          responded_at?: string | null
          unlinked_at?: string | null
        }
        Update: {
          client_id?: string
          fitness_level_by_instructor?: string | null
          id?: string
          instructor_id?: string
          is_active?: boolean | null
          link_status?: string
          linked_at?: string | null
          responded_at?: string | null
          unlinked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_clients_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      license_payments: {
        Row: {
          agent_id: string
          amount: number
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          id: string
          license_id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          payment_month: string
          receipt_filename: string | null
          receipt_url: string | null
          status: string
        }
        Insert: {
          agent_id: string
          amount?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          id?: string
          license_id: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_month: string
          receipt_filename?: string | null
          receipt_url?: string | null
          status?: string
        }
        Update: {
          agent_id?: string
          amount?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          id?: string
          license_id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_month?: string
          receipt_filename?: string | null
          receipt_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_payments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_payments_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_payments_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "agent_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          created_at: string | null
          created_by: string | null
          demo_started_at: string | null
          expires_at: string | null
          id: string
          license_key: string
          license_type: Database["public"]["Enums"]["license_type"]
          profile_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["license_status"]
          tenant_id: string | null
          trial_started_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          demo_started_at?: string | null
          expires_at?: string | null
          id?: string
          license_key: string
          license_type?: Database["public"]["Enums"]["license_type"]
          profile_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["license_status"]
          tenant_id?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          demo_started_at?: string | null
          expires_at?: string | null
          id?: string
          license_key?: string
          license_type?: Database["public"]["Enums"]["license_type"]
          profile_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["license_status"]
          tenant_id?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "licenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      master_credentials: {
        Row: {
          created_at: string | null
          created_by: string | null
          full_name: string | null
          id: string
          is_active: boolean
          password_hash: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          password_hash: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          password_hash?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_credentials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          assigned_to: string | null
          carbs_grams: number | null
          created_at: string | null
          created_by: string
          description: string | null
          fat_grams: number | null
          id: string
          is_active: boolean | null
          is_instructor_plan: boolean | null
          name: string
          protein_grams: number | null
          total_calories: number | null
        }
        Insert: {
          assigned_to?: string | null
          carbs_grams?: number | null
          created_at?: string | null
          created_by: string
          description?: string | null
          fat_grams?: number | null
          id?: string
          is_active?: boolean | null
          is_instructor_plan?: boolean | null
          name: string
          protein_grams?: number | null
          total_calories?: number | null
        }
        Update: {
          assigned_to?: string | null
          carbs_grams?: number | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          fat_grams?: number | null
          id?: string
          is_active?: boolean | null
          is_instructor_plan?: boolean | null
          name?: string
          protein_grams?: number | null
          total_calories?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      neighborhoods: {
        Row: {
          city: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          state: string
          zip_code: string | null
        }
        Insert: {
          city?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          state?: string
          zip_code?: string | null
        }
        Update: {
          city?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          state?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          profile_id: string
          tenant_id: string | null
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          profile_id: string
          tenant_id?: string | null
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          profile_id?: string
          tenant_id?: string | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      overtime_bank: {
        Row: {
          agent_id: string
          alert_sent: boolean | null
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          hour_value: number | null
          hours_worked: number
          id: string
          month_year: string
          scheduled_time: string | null
          shift_type: string
          total_value: number | null
        }
        Insert: {
          agent_id: string
          alert_sent?: boolean | null
          created_at?: string | null
          created_by?: string | null
          date: string
          description?: string | null
          hour_value?: number | null
          hours_worked: number
          id?: string
          month_year: string
          scheduled_time?: string | null
          shift_type?: string
          total_value?: number | null
        }
        Update: {
          agent_id?: string
          alert_sent?: boolean | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          hour_value?: number | null
          hours_worked?: number
          id?: string
          month_year?: string
          scheduled_time?: string | null
          shift_type?: string
          total_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "overtime_bank_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overtime_bank_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_codes: {
        Row: {
          attempts: number
          code: string
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          used_at: string | null
          username: string
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: string | null
          used_at?: string | null
          username: string
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          used_at?: string | null
          username?: string
        }
        Relationships: []
      }
      payment_plans: {
        Row: {
          client_id: string
          created_at: string | null
          created_by: string
          description: string | null
          discount_percentage: number | null
          id: string
          installment_amount: number
          installments: number
          instructor_id: string | null
          start_date: string
          status: string | null
          tenant_id: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          installment_amount: number
          installments?: number
          instructor_id?: string | null
          start_date?: string
          status?: string | null
          tenant_id?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          installment_amount?: number
          installments?: number
          instructor_id?: string | null
          start_date?: string
          status?: string | null
          tenant_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string | null
          description: string | null
          discount_percentage: number | null
          due_date: string | null
          id: string
          installment_number: number | null
          instructor_id: string | null
          late_fee: number | null
          paid_at: string | null
          payment_method: string | null
          plan_id: string | null
          receipt_number: string | null
          status: string | null
          tenant_id: string | null
          total_installments: number | null
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          due_date?: string | null
          id?: string
          installment_number?: number | null
          instructor_id?: string | null
          late_fee?: number | null
          paid_at?: string | null
          payment_method?: string | null
          plan_id?: string | null
          receipt_number?: string | null
          status?: string | null
          tenant_id?: string | null
          total_installments?: number | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          due_date?: string | null
          id?: string
          installment_number?: number | null
          instructor_id?: string | null
          late_fee?: number | null
          paid_at?: string | null
          payment_method?: string | null
          plan_id?: string | null
          receipt_number?: string | null
          status?: string | null
          tenant_id?: string | null
          total_installments?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_payments_plan_id"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_records: {
        Row: {
          achieved_at: string
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          profile_id: string
          record_type: string
          unit: string
          value: number
          workout_log_id: string | null
        }
        Insert: {
          achieved_at?: string
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          profile_id: string
          record_type: string
          unit?: string
          value: number
          workout_log_id?: string | null
        }
        Update: {
          achieved_at?: string
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          profile_id?: string
          record_type?: string
          unit?: string
          value?: number
          workout_log_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_generated_accounts: {
        Row: {
          account_type: string
          created_at: string
          created_by: string | null
          id: string
          is_used: boolean
          license_duration_days: number
          license_key: string
          tenant_id: string | null
          used_at: string | null
          used_by_profile_id: string | null
          username: string
        }
        Insert: {
          account_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_used?: boolean
          license_duration_days: number
          license_key: string
          tenant_id?: string | null
          used_at?: string | null
          used_by_profile_id?: string | null
          username: string
        }
        Update: {
          account_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_used?: boolean
          license_duration_days?: number
          license_key?: string
          tenant_id?: string | null
          used_at?: string | null
          used_by_profile_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "pre_generated_accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_generated_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_generated_accounts_used_by_profile_id_fkey"
            columns: ["used_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          city: string | null
          cpf: string | null
          created_at: string | null
          created_by_admin: string | null
          cref: string | null
          email: string | null
          enrollment_date: string | null
          enrollment_status: string | null
          fitness_goal: Database["public"]["Enums"]["fitness_goal"] | null
          fitness_level: string | null
          freeze_end_date: string | null
          freeze_start_date: string | null
          full_name: string | null
          gender: string | null
          height_cm: number | null
          id: string
          monthly_fee: number | null
          notes: string | null
          phone: string | null
          student_id: string | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
          username: string
          weight_kg: number | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          created_by_admin?: string | null
          cref?: string | null
          email?: string | null
          enrollment_date?: string | null
          enrollment_status?: string | null
          fitness_goal?: Database["public"]["Enums"]["fitness_goal"] | null
          fitness_level?: string | null
          freeze_end_date?: string | null
          freeze_start_date?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          monthly_fee?: number | null
          notes?: string | null
          phone?: string | null
          student_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          username: string
          weight_kg?: number | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          created_by_admin?: string | null
          cref?: string | null
          email?: string | null
          enrollment_date?: string | null
          enrollment_status?: string | null
          fitness_goal?: Database["public"]["Enums"]["fitness_goal"] | null
          fitness_level?: string | null
          freeze_end_date?: string | null
          freeze_start_date?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          monthly_fee?: number | null
          notes?: string | null
          phone?: string | null
          student_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_created_by_admin_fkey"
            columns: ["created_by_admin"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_vehicles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          availability_days: number[] | null
          availability_end_hour: number | null
          availability_start_hour: number | null
          base_rate_per_km: number
          capacity_description: string | null
          capacity_kg: number | null
          created_at: string | null
          fuel_consumption_km_per_liter: number | null
          id: string
          is_approved: boolean | null
          is_available: boolean | null
          min_rate: number | null
          notes: string | null
          photo_url: string | null
          plate: string | null
          profile_id: string
          updated_at: string | null
          vehicle_name: string
          vehicle_type: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          availability_days?: number[] | null
          availability_end_hour?: number | null
          availability_start_hour?: number | null
          base_rate_per_km?: number
          capacity_description?: string | null
          capacity_kg?: number | null
          created_at?: string | null
          fuel_consumption_km_per_liter?: number | null
          id?: string
          is_approved?: boolean | null
          is_available?: boolean | null
          min_rate?: number | null
          notes?: string | null
          photo_url?: string | null
          plate?: string | null
          profile_id: string
          updated_at?: string | null
          vehicle_name: string
          vehicle_type: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          availability_days?: number[] | null
          availability_end_hour?: number | null
          availability_start_hour?: number | null
          base_rate_per_km?: number
          capacity_description?: string | null
          capacity_kg?: number | null
          created_at?: string | null
          fuel_consumption_km_per_liter?: number | null
          id?: string
          is_approved?: boolean | null
          is_available?: boolean | null
          min_rate?: number | null
          notes?: string | null
          photo_url?: string | null
          plate?: string | null
          profile_id?: string
          updated_at?: string | null
          vehicle_name?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_vehicles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_vehicles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_schedules: {
        Row: {
          agent_id: string
          created_at: string | null
          first_shift_date: string
          id: string
          is_locked: boolean | null
          shift_pattern: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          first_shift_date: string
          id?: string
          is_locked?: boolean | null
          shift_pattern?: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          first_shift_date?: string
          id?: string
          is_locked?: boolean | null
          shift_pattern?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_schedules_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_swaps: {
        Row: {
          compensation_date: string
          completed_at: string | null
          created_at: string | null
          id: string
          original_shift_date: string
          requested_at: string | null
          requested_id: string
          requester_id: string
          requester_notes: string | null
          responded_at: string | null
          response_notes: string | null
          status: Database["public"]["Enums"]["swap_status"] | null
        }
        Insert: {
          compensation_date: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          original_shift_date: string
          requested_at?: string | null
          requested_id: string
          requester_id: string
          requester_notes?: string | null
          responded_at?: string | null
          response_notes?: string | null
          status?: Database["public"]["Enums"]["swap_status"] | null
        }
        Update: {
          compensation_date?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          original_shift_date?: string
          requested_at?: string | null
          requested_id?: string
          requester_id?: string
          requester_notes?: string | null
          responded_at?: string | null
          response_notes?: string | null
          status?: Database["public"]["Enums"]["swap_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_swaps_requested_id_fkey"
            columns: ["requested_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swaps_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          is_completed: boolean | null
          notes: string | null
          rest_end: string
          shift_end: string
          shift_start: string
          team: Database["public"]["Enums"]["team_type"]
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          rest_end: string
          shift_end: string
          shift_start: string
          team: Database["public"]["Enums"]["team_type"]
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          rest_end?: string
          shift_end?: string
          shift_start?: string
          team?: Database["public"]["Enums"]["team_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      team_history: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          joined_at: string | null
          left_at: string | null
          team: Database["public"]["Enums"]["team_type"]
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          team: Database["public"]["Enums"]["team_type"]
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          team?: Database["public"]["Enums"]["team_type"]
        }
        Relationships: [
          {
            foreignKeyName: "team_history_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          primary_color: string | null
          settings: Json | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          settings?: Json | null
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          settings?: Json | null
          slug?: string
        }
        Relationships: []
      }
      unit_leadership: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          phone: string | null
          position_type: string
          unit_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          phone?: string | null
          position_type: string
          unit_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          phone?: string | null
          position_type?: string
          unit_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      unit_transfer_requests: {
        Row: {
          agent_id: string
          created_at: string | null
          current_unit: string
          id: string
          reason: string | null
          requested_unit: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          current_unit: string
          id?: string
          reason?: string | null
          requested_unit: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          current_unit?: string
          id?: string
          reason?: string | null
          requested_unit?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unit_transfer_requests_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_transfer_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          city: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          state: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          state?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          state?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_theme_preferences: {
        Row: {
          created_at: string | null
          custom_accent_hsl: string | null
          custom_primary_hsl: string | null
          id: string
          profile_id: string
          theme: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_accent_hsl?: string | null
          custom_primary_hsl?: string | null
          id?: string
          profile_id: string
          theme?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_accent_hsl?: string | null
          custom_primary_hsl?: string | null
          id?: string
          profile_id?: string
          theme?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_theme_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_records: {
        Row: {
          body_fat_percentage: number | null
          id: string
          muscle_mass_kg: number | null
          notes: string | null
          profile_id: string
          recorded_at: string | null
          weight_kg: number
        }
        Insert: {
          body_fat_percentage?: number | null
          id?: string
          muscle_mass_kg?: number | null
          notes?: string | null
          profile_id: string
          recorded_at?: string | null
          weight_kg: number
        }
        Update: {
          body_fat_percentage?: number | null
          id?: string
          muscle_mass_kg?: number | null
          notes?: string | null
          profile_id?: string
          recorded_at?: string | null
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_records_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercise_logs: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          notes: string | null
          reps_completed: number | null
          sets_completed: number
          weight_used_kg: number | null
          workout_log_id: string
          workout_plan_exercise_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          reps_completed?: number | null
          sets_completed?: number
          weight_used_kg?: number | null
          workout_log_id: string
          workout_plan_exercise_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          reps_completed?: number | null
          sets_completed?: number
          weight_used_kg?: number | null
          workout_log_id?: string
          workout_plan_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercise_logs_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercise_logs_workout_plan_exercise_id_fkey"
            columns: ["workout_plan_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_plan_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          profile_id: string
          started_at: string | null
          workout_date: string
          workout_plan_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          profile_id: string
          started_at?: string | null
          workout_date: string
          workout_plan_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          profile_id?: string
          started_at?: string | null
          workout_date?: string
          workout_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plan_exercises: {
        Row: {
          day_of_week: number | null
          exercise_id: string
          id: string
          notes: string | null
          order_index: number | null
          reps: number | null
          rest_seconds: number | null
          sets: number | null
          weight_kg: number | null
          workout_plan_id: string
        }
        Insert: {
          day_of_week?: number | null
          exercise_id: string
          id?: string
          notes?: string | null
          order_index?: number | null
          reps?: number | null
          rest_seconds?: number | null
          sets?: number | null
          weight_kg?: number | null
          workout_plan_id: string
        }
        Update: {
          day_of_week?: number | null
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number | null
          reps?: number | null
          rest_seconds?: number | null
          sets?: number | null
          weight_kg?: number | null
          workout_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_plan_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plan_exercises_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          is_instructor_plan: boolean | null
          name: string
          scheduled_date: string | null
          scheduled_time: string | null
          start_date: string | null
          updated_at: string | null
          weekdays: number[] | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_instructor_plan?: boolean | null
          name: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          start_date?: string | null
          updated_at?: string | null
          weekdays?: number[] | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_instructor_plan?: boolean | null
          name?: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          start_date?: string | null
          updated_at?: string | null
          weekdays?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_plans_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      belongs_to_tenant: { Args: { check_tenant_id: string }; Returns: boolean }
      can_insert_profile: { Args: { _user_id: string }; Returns: boolean }
      check_expired_licenses: { Args: never; Returns: undefined }
      create_master_credential: {
        Args: {
          p_full_name?: string
          p_is_active?: boolean
          p_password: string
          p_username: string
        }
        Returns: string
      }
      extend_license: {
        Args: { p_license_id: string; p_months?: number }
        Returns: undefined
      }
      generate_license_key: { Args: { prefix?: string }; Returns: string }
      generate_shift_dates: {
        Args: {
          p_first_date: string
          p_months_ahead?: number
          p_pattern?: string
        }
        Returns: {
          is_working: boolean
          shift_date: string
        }[]
      }
      generate_student_id: { Args: never; Returns: string }
      get_current_agent_id: { Args: never; Returns: string }
      get_current_profile_id: { Args: never; Returns: string }
      get_current_tenant_id: { Args: never; Returns: string }
      get_license_stats: {
        Args: never
        Returns: {
          active_licenses: number
          expired_licenses: number
          monthly_revenue: number
          pending_payments: number
          total_agents: number
          trial_licenses: number
        }[]
      }
      get_monthly_overtime: {
        Args: { p_agent_id: string; p_month_year: string }
        Returns: {
          remaining_hours: number
          total_hours: number
          total_value: number
        }[]
      }
      get_student_basic_info: {
        Args: { p_student_id: string }
        Returns: {
          avatar_url: string
          enrollment_status: string
          full_name: string
          student_id: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_higher: { Args: { _user_id: string }; Returns: boolean }
      is_master: { Args: { _user_id: string }; Returns: boolean }
      purge_expired_trash_items: { Args: never; Returns: number }
      transfer_agent_team: {
        Args: {
          p_agent_id: string
          p_new_team: Database["public"]["Enums"]["team_type"]
        }
        Returns: boolean
      }
      update_master_password: {
        Args: { p_credential_id: string; p_new_password: string }
        Returns: boolean
      }
      validate_master_credentials: {
        Args: { p_password: string; p_username: string }
        Returns: {
          full_name: string
          id: string
          is_valid: boolean
          username: string
        }[]
      }
    }
    Enums: {
      app_role: "master" | "admin" | "instructor" | "client"
      fitness_goal:
        | "muscle_gain"
        | "weight_loss"
        | "hypertrophy"
        | "conditioning"
        | "maintenance"
      license_status: "active" | "expired" | "blocked"
      license_type: "demo" | "trial" | "full" | "master"
      swap_status: "pending" | "accepted" | "rejected" | "completed"
      team_type: "alfa" | "bravo" | "charlie" | "delta"
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
  public: {
    Enums: {
      app_role: ["master", "admin", "instructor", "client"],
      fitness_goal: [
        "muscle_gain",
        "weight_loss",
        "hypertrophy",
        "conditioning",
        "maintenance",
      ],
      license_status: ["active", "expired", "blocked"],
      license_type: ["demo", "trial", "full", "master"],
      swap_status: ["pending", "accepted", "rejected", "completed"],
      team_type: ["alfa", "bravo", "charlie", "delta"],
    },
  },
} as const
