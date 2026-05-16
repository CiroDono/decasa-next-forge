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
      direcciones: {
        Row: {
          calle: string
          ciudad: string
          codigo_postal: string
          created_at: string
          etiqueta: string | null
          id: string
          numero: string | null
          piso: string | null
          predeterminada: boolean
          provincia: string
          telefono: string | null
          user_id: string
        }
        Insert: {
          calle: string
          ciudad: string
          codigo_postal: string
          created_at?: string
          etiqueta?: string | null
          id?: string
          numero?: string | null
          piso?: string | null
          predeterminada?: boolean
          provincia: string
          telefono?: string | null
          user_id: string
        }
        Update: {
          calle?: string
          ciudad?: string
          codigo_postal?: string
          created_at?: string
          etiqueta?: string | null
          id?: string
          numero?: string | null
          piso?: string | null
          predeterminada?: boolean
          provincia?: string
          telefono?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pedido_items: {
        Row: {
          cantidad: number
          id: string
          nombre: string
          pedido_id: string
          precio_unitario: number
          producto_id: number | null
          sku: string | null
          subtotal: number
          variante_id: number | null
        }
        Insert: {
          cantidad: number
          id?: string
          nombre: string
          pedido_id: string
          precio_unitario: number
          producto_id?: number | null
          sku?: string | null
          subtotal: number
          variante_id?: number | null
        }
        Update: {
          cantidad?: number
          id?: string
          nombre?: string
          pedido_id?: string
          precio_unitario?: number
          producto_id?: number | null
          sku?: string | null
          subtotal?: number
          variante_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedido_items_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_items_variante_id_fkey"
            columns: ["variante_id"]
            isOneToOne: false
            referencedRelation: "variantes"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          created_at: string
          direccion: Json | null
          email: string | null
          estado: Database["public"]["Enums"]["pedido_estado"]
          id: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          nombre: string | null
          notas: string | null
          telefono: string | null
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          direccion?: Json | null
          email?: string | null
          estado?: Database["public"]["Enums"]["pedido_estado"]
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          nombre?: string | null
          notas?: string | null
          telefono?: string | null
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          direccion?: Json | null
          email?: string | null
          estado?: Database["public"]["Enums"]["pedido_estado"]
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          nombre?: string | null
          notas?: string | null
          telefono?: string | null
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          orden: number
          producto_id: number
          url: string | null
          url_webp: string | null
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          orden?: number
          producto_id: number
          url?: string | null
          url_webp?: string | null
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          orden?: number
          producto_id?: number
          url?: string | null
          url_webp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          activo: boolean
          categoria: string | null
          descripcion: string | null
          grupo: string | null
          id: number
          image_url: string | null
          image_webp: string | null
          nombre: string | null
          oferta_hasta: string | null
          precio: number | null
          precio_oferta: number | null
          sku: string | null
          stock: number | null
        }
        Insert: {
          activo?: boolean
          categoria?: string | null
          descripcion?: string | null
          grupo?: string | null
          id?: never
          image_url?: string | null
          image_webp?: string | null
          nombre?: string | null
          oferta_hasta?: string | null
          precio?: number | null
          precio_oferta?: number | null
          sku?: string | null
          stock?: number | null
        }
        Update: {
          activo?: boolean
          categoria?: string | null
          descripcion?: string | null
          grupo?: string | null
          id?: never
          image_url?: string | null
          image_webp?: string | null
          nombre?: string | null
          oferta_hasta?: string | null
          precio?: number | null
          precio_oferta?: number | null
          sku?: string | null
          stock?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          dni: string | null
          id: string
          nombre: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dni?: string | null
          id: string
          nombre?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dni?: string | null
          id?: string
          nombre?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      variantes: {
        Row: {
          descripcion_presentacion: string | null
          id: number
          nombre_presentacion: string | null
          precio: number | null
          producto_id: number | null
          sku: string | null
          stock: number | null
        }
        Insert: {
          descripcion_presentacion?: string | null
          id?: never
          nombre_presentacion?: string | null
          precio?: number | null
          producto_id?: number | null
          sku?: string | null
          stock?: number | null
        }
        Update: {
          descripcion_presentacion?: string | null
          id?: never
          nombre_presentacion?: string | null
          precio?: number | null
          producto_id?: number | null
          sku?: string | null
          stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "variantes_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
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
      app_role: "admin" | "user"
      pedido_estado:
        | "pendiente"
        | "pagado"
        | "enviado"
        | "entregado"
        | "cancelado"
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
      app_role: ["admin", "user"],
      pedido_estado: [
        "pendiente",
        "pagado",
        "enviado",
        "entregado",
        "cancelado",
      ],
    },
  },
} as const
