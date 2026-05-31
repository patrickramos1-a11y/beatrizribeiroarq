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
      briefings: {
        Row: {
          client_name: string
          completed_at: string | null
          created_at: string
          id: string
          intro: string | null
          project_type: string
          public_token: string
          status: string
          title: string
        }
        Insert: {
          client_name: string
          completed_at?: string | null
          created_at?: string
          id?: string
          intro?: string | null
          project_type: string
          public_token?: string
          status?: string
          title: string
        }
        Update: {
          client_name?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          intro?: string | null
          project_type?: string
          public_token?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      question_options: {
        Row: {
          id: string
          image_url: string | null
          interpretation: string | null
          label: string
          order_index: number
          question_id: string
          tag: string | null
        }
        Insert: {
          id?: string
          image_url?: string | null
          interpretation?: string | null
          label: string
          order_index?: number
          question_id: string
          tag?: string | null
        }
        Update: {
          id?: string
          image_url?: string | null
          interpretation?: string | null
          label?: string
          order_index?: number
          question_id?: string
          tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          allow_comment: boolean
          briefing_id: string
          description: string | null
          id: string
          kind: string
          order_index: number
          title: string
        }
        Insert: {
          allow_comment?: boolean
          briefing_id: string
          description?: string | null
          id?: string
          kind?: string
          order_index?: number
          title: string
        }
        Update: {
          allow_comment?: boolean
          briefing_id?: string
          description?: string | null
          id?: string
          kind?: string
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_briefing_id_fkey"
            columns: ["briefing_id"]
            isOneToOne: false
            referencedRelation: "briefings"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          ai_text: string | null
          briefing_id: string
          edited_text: string | null
          generated_at: string
          id: string
          style_profile: Json | null
        }
        Insert: {
          ai_text?: string | null
          briefing_id: string
          edited_text?: string | null
          generated_at?: string
          id?: string
          style_profile?: Json | null
        }
        Update: {
          ai_text?: string | null
          briefing_id?: string
          edited_text?: string | null
          generated_at?: string
          id?: string
          style_profile?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_briefing_id_fkey"
            columns: ["briefing_id"]
            isOneToOne: true
            referencedRelation: "briefings"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          briefing_id: string
          comment: string | null
          created_at: string
          id: string
          question_id: string
          selected_option_ids: Json
          text_answer: string | null
        }
        Insert: {
          briefing_id: string
          comment?: string | null
          created_at?: string
          id?: string
          question_id: string
          selected_option_ids?: Json
          text_answer?: string | null
        }
        Update: {
          briefing_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          question_id?: string
          selected_option_ids?: Json
          text_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "responses_briefing_id_fkey"
            columns: ["briefing_id"]
            isOneToOne: false
            referencedRelation: "briefings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
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
