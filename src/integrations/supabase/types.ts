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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ads: {
        Row: {
          created_at: string
          description: string
          id: string
          marketplace: string
          product_id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          marketplace: string
          product_id: string
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          marketplace?: string
          product_id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      creatives: {
        Row: {
          approved: boolean
          created_at: string
          feedback: string | null
          id: string
          image_url: string | null
          overlay_elements: Json | null
          overlay_url: string | null
          product_id: string
          prompt: string
          role: string | null
          sort_order: number
          user_id: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          feedback?: string | null
          id?: string
          image_url?: string | null
          overlay_elements?: Json | null
          overlay_url?: string | null
          product_id: string
          prompt?: string
          role?: string | null
          sort_order?: number
          user_id: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          feedback?: string | null
          id?: string
          image_url?: string | null
          overlay_elements?: Json | null
          overlay_url?: string | null
          product_id?: string
          prompt?: string
          role?: string | null
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creatives_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      listings: {
        Row: {
          ad_mercadolivre_description: string | null
          ad_mercadolivre_title: string | null
          ad_shopee_description: string | null
          ad_shopee_title: string | null
          category: string
          characteristics: string[] | null
          created_at: string
          extras: string | null
          id: string
          photo_urls: string[] | null
          product_name: string
          prompts: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_mercadolivre_description?: string | null
          ad_mercadolivre_title?: string | null
          ad_shopee_description?: string | null
          ad_shopee_title?: string | null
          category?: string
          characteristics?: string[] | null
          created_at?: string
          extras?: string | null
          id?: string
          photo_urls?: string[] | null
          product_name?: string
          prompts?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_mercadolivre_description?: string | null
          ad_mercadolivre_title?: string | null
          ad_shopee_description?: string | null
          ad_shopee_title?: string | null
          category?: string
          characteristics?: string[] | null
          created_at?: string
          extras?: string | null
          id?: string
          photo_urls?: string[] | null
          product_name?: string
          prompts?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          characteristics: string[] | null
          created_at: string
          ean: string | null
          extras: string | null
          id: string
          internal_sku: string | null
          name: string
          original_sku: string | null
          photo_urls: string[] | null
          sku_mapping_note: string | null
          status: string
          updated_at: string
          user_id: string
          visual_dna: Json | null
        }
        Insert: {
          category?: string
          characteristics?: string[] | null
          created_at?: string
          ean?: string | null
          extras?: string | null
          id?: string
          internal_sku?: string | null
          name?: string
          original_sku?: string | null
          photo_urls?: string[] | null
          sku_mapping_note?: string | null
          status?: string
          updated_at?: string
          user_id: string
          visual_dna?: Json | null
        }
        Update: {
          category?: string
          characteristics?: string[] | null
          created_at?: string
          ean?: string | null
          extras?: string | null
          id?: string
          internal_sku?: string | null
          name?: string
          original_sku?: string | null
          photo_urls?: string[] | null
          sku_mapping_note?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          visual_dna?: Json | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          function_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          user_id?: string
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
