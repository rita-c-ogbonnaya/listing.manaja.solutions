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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_password_resets: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used_at?: string | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          id: number
          password_hash: string | null
          recovery_email: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          password_hash?: string | null
          recovery_email?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          password_hash?: string | null
          recovery_email?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          body_html: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          body_html?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          body_html?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          escalated: boolean
          id: string
          last_message_at: string
          message_count: number
          session_id: string
          updated_at: string
          visitor_email: string | null
          visitor_name: string | null
        }
        Insert: {
          created_at?: string
          escalated?: boolean
          id?: string
          last_message_at?: string
          message_count?: number
          session_id: string
          updated_at?: string
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Update: {
          created_at?: string
          escalated?: boolean
          id?: string
          last_message_at?: string
          message_count?: number
          session_id?: string
          updated_at?: string
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_features: {
        Row: {
          created_at: string
          detail: string
          icon_name: string
          id: string
          label: string
          milestone_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          detail?: string
          icon_name?: string
          id?: string
          label: string
          milestone_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          detail?: string
          icon_name?: string
          id?: string
          label?: string
          milestone_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_features_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          created_at: string
          icon_name: string
          id: string
          milestone_key: string
          outcome: string
          progress: number
          published: boolean
          quarter: string
          sort_order: number
          status: string
          story: string
          tagline: string
          title: string
          updated_at: string
          year: string
        }
        Insert: {
          created_at?: string
          icon_name?: string
          id?: string
          milestone_key: string
          outcome?: string
          progress?: number
          published?: boolean
          quarter?: string
          sort_order?: number
          status?: string
          story?: string
          tagline?: string
          title: string
          updated_at?: string
          year?: string
        }
        Update: {
          created_at?: string
          icon_name?: string
          id?: string
          milestone_key?: string
          outcome?: string
          progress?: number
          published?: boolean
          quarter?: string
          sort_order?: number
          status?: string
          story?: string
          tagline?: string
          title?: string
          updated_at?: string
          year?: string
        }
        Relationships: []
      }
      module_waitlist: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          module_slug: string
          module_title: string
          name: string | null
          source: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          module_slug: string
          module_title: string
          name?: string | null
          source?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          module_slug?: string
          module_title?: string
          name?: string | null
          source?: string | null
        }
        Relationships: []
      }
      modules: {
        Row: {
          color: string
          created_at: string
          description: string
          features: Json
          icon_name: string
          id: string
          image_url: string | null
          light_bg: string
          published: boolean
          slug: string
          sort_order: number
          status: string
          status_label: string | null
          title: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string
          features?: Json
          icon_name?: string
          id?: string
          image_url?: string | null
          light_bg?: string
          published?: boolean
          slug: string
          sort_order?: number
          status?: string
          status_label?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          features?: Json
          icon_name?: string
          id?: string
          image_url?: string | null
          light_bg?: string
          published?: boolean
          slug?: string
          sort_order?: number
          status?: string
          status_label?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      roadmap_overrides: {
        Row: {
          milestone_id: string
          progress: number | null
          status: string | null
          tagline: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          milestone_id: string
          progress?: number | null
          status?: string | null
          tagline?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          milestone_id?: string
          progress?: number | null
          status?: string | null
          tagline?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      roadmap_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          source: string | null
          status: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          source?: string | null
          status?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          source?: string | null
          status?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          hero_dashboard_image_url: string | null
          id: number
          popup_body: string
          popup_cta_label: string
          popup_cta_url: string
          popup_enabled: boolean
          popup_image_url: string | null
          popup_title: string
          popup_version: number
          updated_at: string
        }
        Insert: {
          hero_dashboard_image_url?: string | null
          id?: number
          popup_body?: string
          popup_cta_label?: string
          popup_cta_url?: string
          popup_enabled?: boolean
          popup_image_url?: string | null
          popup_title?: string
          popup_version?: number
          updated_at?: string
        }
        Update: {
          hero_dashboard_image_url?: string | null
          id?: number
          popup_body?: string
          popup_cta_label?: string
          popup_cta_url?: string
          popup_enabled?: boolean
          popup_image_url?: string | null
          popup_title?: string
          popup_version?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_requests: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          message: string
          meta: Json
          name: string
          status: string
          subject: string
          type: string
          user_agent: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          meta?: Json
          name: string
          status?: string
          subject: string
          type: string
          user_agent?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          meta?: Json
          name?: string
          status?: string
          subject?: string
          type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assignee: string | null
          company: string | null
          created_at: string
          email: string
          first_response_at: string | null
          id: string
          internal_notes: string | null
          message: string
          meta: Json
          name: string
          phone: string | null
          priority: string
          sla_due_at: string | null
          source: string | null
          status: string
          subject: string
          type: string
          updated_at: string
        }
        Insert: {
          assignee?: string | null
          company?: string | null
          created_at?: string
          email: string
          first_response_at?: string | null
          id?: string
          internal_notes?: string | null
          message: string
          meta?: Json
          name: string
          phone?: string | null
          priority?: string
          sla_due_at?: string | null
          source?: string | null
          status?: string
          subject: string
          type?: string
          updated_at?: string
        }
        Update: {
          assignee?: string | null
          company?: string | null
          created_at?: string
          email?: string
          first_response_at?: string | null
          id?: string
          internal_notes?: string | null
          message?: string
          meta?: Json
          name?: string
          phone?: string | null
          priority?: string
          sla_due_at?: string | null
          source?: string | null
          status?: string
          subject?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio: string
          created_at: string
          display_mode: string
          id: string
          image_url: string | null
          initials: string
          name: string
          published: boolean
          role: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          bio: string
          created_at?: string
          display_mode?: string
          id?: string
          image_url?: string | null
          initials: string
          name: string
          published?: boolean
          role: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bio?: string
          created_at?: string
          display_mode?: string
          id?: string
          image_url?: string | null
          initials?: string
          name?: string
          published?: boolean
          role?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ticket_drafts: {
        Row: {
          body: string
          ticket_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body?: string
          ticket_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          ticket_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_drafts_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_replies: {
        Row: {
          author: string | null
          body: string
          created_at: string
          direction: string
          email_message_id: string | null
          id: string
          is_internal: boolean
          ticket_id: string
        }
        Insert: {
          author?: string | null
          body: string
          created_at?: string
          direction?: string
          email_message_id?: string | null
          id?: string
          is_internal?: boolean
          ticket_id: string
        }
        Update: {
          author?: string | null
          body?: string
          created_at?: string
          direction?: string
          email_message_id?: string | null
          id?: string
          is_internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_send_attempts: {
        Row: {
          attempted_by: string | null
          body_preview: string | null
          created_at: string
          error: string | null
          id: string
          provider_message_id: string | null
          reply_id: string | null
          status: string
          ticket_id: string
        }
        Insert: {
          attempted_by?: string | null
          body_preview?: string | null
          created_at?: string
          error?: string | null
          id?: string
          provider_message_id?: string | null
          reply_id?: string | null
          status: string
          ticket_id: string
        }
        Update: {
          attempted_by?: string | null
          body_preview?: string | null
          created_at?: string
          error?: string | null
          id?: string
          provider_message_id?: string | null
          reply_id?: string | null
          status?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_send_attempts_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "ticket_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_send_attempts_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      vacancies: {
        Row: {
          created_at: string
          department: string
          description: string
          employment_type: string
          id: string
          location: string
          published: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string
          description: string
          employment_type?: string
          id?: string
          location?: string
          published?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string
          description?: string
          employment_type?: string
          id?: string
          location?: string
          published?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
