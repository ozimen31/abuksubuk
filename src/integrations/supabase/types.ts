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
      balance_keys: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          description: string | null
          expires_at: string | null
          id: string
          key_code: string
          used: boolean
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          description?: string | null
          expires_at?: string | null
          id?: string
          key_code: string
          used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          key_code?: string
          used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          order_index: number | null
          slug: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          order_index?: number | null
          slug: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          order_index?: number | null
          slug?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          auto_delivery: boolean | null
          auto_delivery_content: string | null
          category_id: string | null
          created_at: string | null
          description: string
          featured: boolean | null
          id: string
          images: string[] | null
          platform: string | null
          price: number
          status: Database["public"]["Enums"]["listing_status"] | null
          stock: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          auto_delivery?: boolean | null
          auto_delivery_content?: string | null
          category_id?: string | null
          created_at?: string | null
          description: string
          featured?: boolean | null
          id?: string
          images?: string[] | null
          platform?: string | null
          price: number
          status?: Database["public"]["Enums"]["listing_status"] | null
          stock?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          auto_delivery?: boolean | null
          auto_delivery_content?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string
          featured?: boolean | null
          id?: string
          images?: string[] | null
          platform?: string | null
          price?: number
          status?: Database["public"]["Enums"]["listing_status"] | null
          stock?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: string[] | null
          body: string
          created_at: string | null
          from_user_id: string
          id: string
          order_id: string | null
          read: boolean | null
          to_user_id: string
        }
        Insert: {
          attachments?: string[] | null
          body: string
          created_at?: string | null
          from_user_id: string
          id?: string
          order_id?: string | null
          read?: boolean | null
          to_user_id: string
        }
        Update: {
          attachments?: string[] | null
          body?: string
          created_at?: string | null
          from_user_id?: string
          id?: string
          order_id?: string | null
          read?: boolean | null
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          commission: number
          completed_at: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_note: string | null
          escrow_until: string | null
          id: string
          listing_id: string
          payment_method: string | null
          payment_txn: string | null
          price: number
          seller_id: string
          status: Database["public"]["Enums"]["order_status"] | null
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          commission: number
          completed_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_note?: string | null
          escrow_until?: string | null
          id?: string
          listing_id: string
          payment_method?: string | null
          payment_txn?: string | null
          price: number
          seller_id: string
          status?: Database["public"]["Enums"]["order_status"] | null
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          commission?: number
          completed_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_note?: string | null
          escrow_until?: string | null
          id?: string
          listing_id?: string
          payment_method?: string | null
          payment_txn?: string | null
          price?: number
          seller_id?: string
          status?: Database["public"]["Enums"]["order_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance: number | null
          bank_account_holder: string | null
          bank_iban: string | null
          bank_name: string | null
          created_at: string | null
          description: string | null
          id: string
          phone: string | null
          seller_score: number | null
          total_sales: number | null
          updated_at: string | null
          user_id: string
          username: string | null
          verified: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          balance?: number | null
          bank_account_holder?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          phone?: string | null
          seller_score?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id: string
          username?: string | null
          verified?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          balance?: number | null
          bank_account_holder?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          phone?: string | null
          seller_score?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          details: string | null
          id: string
          listing_id: string | null
          order_id: string | null
          reason: string
          reported_user_id: string | null
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          listing_id?: string | null
          order_id?: string | null
          reason: string
          reported_user_id?: string | null
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          listing_id?: string | null
          order_id?: string | null
          reason?: string
          reported_user_id?: string | null
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          order_id: string
          rating: number
          reviewed_user_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          order_id: string
          rating: number
          reviewed_user_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          order_id?: string
          rating?: number
          reviewed_user_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      slider_images: {
        Row: {
          active: boolean | null
          button_link: string | null
          button_text: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string
          order_index: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          button_link?: string | null
          button_text?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url: string
          order_index?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          button_link?: string | null
          button_text?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string
          order_index?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string
          id: string
          is_admin_reply: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          message?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      withdrawals: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string | null
          id: string
          method: string | null
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["withdrawal_status"] | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"] | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      listing_status: "draft" | "active" | "sold" | "paused" | "rejected"
      order_status:
        | "pending"
        | "paid"
        | "delivered"
        | "completed"
        | "disputed"
        | "cancelled"
      ticket_priority: "low" | "normal" | "high"
      ticket_status: "open" | "answered" | "closed"
      withdrawal_status: "pending" | "approved" | "rejected" | "completed"
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
      app_role: ["admin", "moderator", "user"],
      listing_status: ["draft", "active", "sold", "paused", "rejected"],
      order_status: [
        "pending",
        "paid",
        "delivered",
        "completed",
        "disputed",
        "cancelled",
      ],
      ticket_priority: ["low", "normal", "high"],
      ticket_status: ["open", "answered", "closed"],
      withdrawal_status: ["pending", "approved", "rejected", "completed"],
    },
  },
} as const
