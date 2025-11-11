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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_skills: {
        Row: {
          agent_id: string
          certification_date: string | null
          certification_expiry: string | null
          created_at: string | null
          id: string
          is_certified: boolean | null
          organization_id: string
          proficiency_level: number | null
          skill_category: string | null
          skill_name: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          certification_date?: string | null
          certification_expiry?: string | null
          created_at?: string | null
          id?: string
          is_certified?: boolean | null
          organization_id: string
          proficiency_level?: number | null
          skill_category?: string | null
          skill_name: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          certification_date?: string | null
          certification_expiry?: string | null
          created_at?: string | null
          id?: string
          is_certified?: boolean | null
          organization_id?: string
          proficiency_level?: number | null
          skill_category?: string | null
          skill_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_skills_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "support_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      allowances: {
        Row: {
          allowance_name: string
          allowance_type: string
          approval_required: boolean | null
          approved_at: string | null
          approved_by: string | null
          base_amount_aed: number
          calculated_amount_aed: number
          calculation_method: string | null
          calculation_period_month: number
          calculation_period_year: number
          calculation_rate: number | null
          created_at: string | null
          created_by: string | null
          effective_date: string
          eligible_days: number | null
          eligible_hours: number | null
          employee_id: string
          expiry_date: string | null
          id: string
          is_recurring: boolean | null
          is_taxable: boolean | null
          notes: string | null
          organization_id: string
          percentage_base: number | null
          salary_calculation_id: string | null
          supporting_documents: Json | null
          updated_at: string | null
        }
        Insert: {
          allowance_name: string
          allowance_type: string
          approval_required?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          base_amount_aed: number
          calculated_amount_aed: number
          calculation_method?: string | null
          calculation_period_month: number
          calculation_period_year: number
          calculation_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          effective_date?: string
          eligible_days?: number | null
          eligible_hours?: number | null
          employee_id: string
          expiry_date?: string | null
          id?: string
          is_recurring?: boolean | null
          is_taxable?: boolean | null
          notes?: string | null
          organization_id: string
          percentage_base?: number | null
          salary_calculation_id?: string | null
          supporting_documents?: Json | null
          updated_at?: string | null
        }
        Update: {
          allowance_name?: string
          allowance_type?: string
          approval_required?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          base_amount_aed?: number
          calculated_amount_aed?: number
          calculation_method?: string | null
          calculation_period_month?: number
          calculation_period_year?: number
          calculation_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          effective_date?: string
          eligible_days?: number | null
          eligible_hours?: number | null
          employee_id?: string
          expiry_date?: string | null
          id?: string
          is_recurring?: boolean | null
          is_taxable?: boolean | null
          notes?: string | null
          organization_id?: string
          percentage_base?: number | null
          salary_calculation_id?: string | null
          supporting_documents?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "allowances_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allowances_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allowances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allowances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allowances_salary_calculation_id_fkey"
            columns: ["salary_calculation_id"]
            isOneToOne: false
            referencedRelation: "salary_calculations"
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