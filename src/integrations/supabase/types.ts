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
      favorites: {
        Row: {
          author: string | null
          created_at: string
          explanation: string | null
          id: string
          source_type: string | null
          text: string
          title: string | null
          user_id: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          source_type?: string | null
          text: string
          title?: string | null
          user_id: string
        }
        Update: {
          author?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          source_type?: string | null
          text?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      literary_works: {
        Row: {
          author: string
          created_at: string
          embedding: string | null
          emotions_tags: string[]
          external_id: string | null
          id: string
          language: string
          mood_intensity: number | null
          search_doc: string | null
          search_tsv: unknown
          source_type: string
          text: string
          theme: string | null
          title: string | null
          year: number | null
        }
        Insert: {
          author: string
          created_at?: string
          embedding?: string | null
          emotions_tags?: string[]
          external_id?: string | null
          id?: string
          language?: string
          mood_intensity?: number | null
          search_doc?: string | null
          search_tsv?: unknown
          source_type: string
          text: string
          theme?: string | null
          title?: string | null
          year?: number | null
        }
        Update: {
          author?: string
          created_at?: string
          embedding?: string | null
          emotions_tags?: string[]
          external_id?: string | null
          id?: string
          language?: string
          mood_intensity?: number | null
          search_doc?: string | null
          search_tsv?: unknown
          source_type?: string
          text?: string
          theme?: string | null
          title?: string | null
          year?: number | null
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          context: string | null
          created_at: string
          emotions: string[] | null
          id: string
          input_text: string
          intensity: number | null
          results: Json | null
          user_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          emotions?: string[] | null
          id?: string
          input_text: string
          intensity?: number | null
          results?: Json | null
          user_id: string
        }
        Update: {
          context?: string | null
          created_at?: string
          emotions?: string[] | null
          id?: string
          input_text?: string
          intensity?: number | null
          results?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          endpoint: string
          identifier: string
          window_start: string
        }
        Insert: {
          count?: number
          endpoint: string
          identifier: string
          window_start?: string
        }
        Update: {
          count?: number
          endpoint?: string
          identifier?: string
          window_start?: string
        }
        Relationships: []
      }
      user_memory: {
        Row: {
          agent_notes: string | null
          created_at: string
          dominant_emotions: string[]
          entries_analyzed: number
          recurring_themes: string[]
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_notes?: string | null
          created_at?: string
          dominant_emotions?: string[]
          entries_analyzed?: number
          recurring_themes?: string[]
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_notes?: string | null
          created_at?: string
          dominant_emotions?: string[]
          entries_analyzed?: number
          recurring_themes?: string[]
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      match_literary_lexical: {
        Args: {
          match_count?: number
          preferred_language?: string
          query_emotions?: string[]
          query_text: string
        }
        Returns: {
          author: string
          emotions_tags: string[]
          id: string
          language: string
          score: number
          source_type: string
          text: string
          title: string
          year: number
        }[]
      }
      match_literary_works: {
        Args: {
          filter_emotions?: string[]
          filter_language?: string
          match_count?: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          author: string
          emotions_tags: string[]
          id: string
          language: string
          similarity: number
          source_type: string
          text: string
          title: string
          year: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
