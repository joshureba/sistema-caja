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
      arqueos: {
        Row: {
          caja: Database["public"]["Enums"]["tipo_caja"]
          conteo: Json
          diferencia: number
          estado: Database["public"]["Enums"]["estado_arqueo"]
          id: number
          jornada_id: number
          observacion: string | null
          realizado_en: string
          realizado_por: string | null
          total_contado: number
          total_teorico: number
        }
        Insert: {
          caja: Database["public"]["Enums"]["tipo_caja"]
          conteo?: Json
          diferencia: number
          estado: Database["public"]["Enums"]["estado_arqueo"]
          id?: number
          jornada_id: number
          observacion?: string | null
          realizado_en?: string
          realizado_por?: string | null
          total_contado: number
          total_teorico: number
        }
        Update: {
          caja?: Database["public"]["Enums"]["tipo_caja"]
          conteo?: Json
          diferencia?: number
          estado?: Database["public"]["Enums"]["estado_arqueo"]
          id?: number
          jornada_id?: number
          observacion?: string | null
          realizado_en?: string
          realizado_por?: string | null
          total_contado?: number
          total_teorico?: number
        }
        Relationships: [
          {
            foreignKeyName: "arqueos_jornada_id_fkey"
            columns: ["jornada_id"]
            isOneToOne: false
            referencedRelation: "jornadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqueos_realizado_por_fkey"
            columns: ["realizado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          accion: string
          antes: Json | null
          despues: Json | null
          fecha: string
          id: number
          registro_id: string
          tabla: string
          usuario_id: string | null
        }
        Insert: {
          accion: string
          antes?: Json | null
          despues?: Json | null
          fecha?: string
          id?: number
          registro_id: string
          tabla: string
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          antes?: Json | null
          despues?: Json | null
          fecha?: string
          id?: number
          registro_id?: string
          tabla?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      catalogos: {
        Row: {
          activo: boolean
          id: number
          orden: number
          tipo: string
          valor: string
        }
        Insert: {
          activo?: boolean
          id?: number
          orden?: number
          tipo: string
          valor: string
        }
        Update: {
          activo?: boolean
          id?: number
          orden?: number
          tipo?: string
          valor?: string
        }
        Relationships: []
      }
      jornadas: {
        Row: {
          actualizado_en: string | null
          actualizado_por: string | null
          apertura_en: string
          apertura_por: string | null
          base_caja_diaria: number
          cierre_en: string | null
          cierre_por: string | null
          estado: Database["public"]["Enums"]["estado_jornada"]
          fecha: string
          id: number
          importada: boolean
          observacion: string | null
          responsable_apertura: string | null
          responsable_cierre: string | null
        }
        Insert: {
          actualizado_en?: string | null
          actualizado_por?: string | null
          apertura_en?: string
          apertura_por?: string | null
          base_caja_diaria?: number
          cierre_en?: string | null
          cierre_por?: string | null
          estado?: Database["public"]["Enums"]["estado_jornada"]
          fecha: string
          id?: number
          importada?: boolean
          observacion?: string | null
          responsable_apertura?: string | null
          responsable_cierre?: string | null
        }
        Update: {
          actualizado_en?: string | null
          actualizado_por?: string | null
          apertura_en?: string
          apertura_por?: string | null
          base_caja_diaria?: number
          cierre_en?: string | null
          cierre_por?: string | null
          estado?: Database["public"]["Enums"]["estado_jornada"]
          fecha?: string
          id?: number
          importada?: boolean
          observacion?: string | null
          responsable_apertura?: string | null
          responsable_cierre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jornadas_actualizado_por_fkey"
            columns: ["actualizado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jornadas_apertura_por_fkey"
            columns: ["apertura_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jornadas_cierre_por_fkey"
            columns: ["cierre_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos: {
        Row: {
          actualizado_en: string | null
          actualizado_por: string | null
          anulado: boolean
          anulado_en: string | null
          anulado_motivo: string | null
          anulado_por: string | null
          area: string | null
          caja_retiro: Database["public"]["Enums"]["tipo_caja"] | null
          comprobante: string | null
          creado_en: string
          creado_por: string | null
          cuenta: string | null
          descripcion: string
          destino: Database["public"]["Enums"]["destino_retiro"] | null
          estado_sustento: Database["public"]["Enums"]["estado_sustento"] | null
          fecha: string
          id: number
          importado: boolean
          jornada_id: number | null
          medio_pago: string | null
          monto: number
          monto_digital: number
          monto_efectivo: number
          nombre: string | null
          num_operacion: string | null
          numero: string | null
          observacion: string | null
          origen: Database["public"]["Enums"]["origen_reposicion"] | null
          responsable: string | null
          ruc_dni: string | null
          serie: string | null
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
          turno: Database["public"]["Enums"]["turno_caja"]
        }
        Insert: {
          actualizado_en?: string | null
          actualizado_por?: string | null
          anulado?: boolean
          anulado_en?: string | null
          anulado_motivo?: string | null
          anulado_por?: string | null
          area?: string | null
          caja_retiro?: Database["public"]["Enums"]["tipo_caja"] | null
          comprobante?: string | null
          creado_en?: string
          creado_por?: string | null
          cuenta?: string | null
          descripcion: string
          destino?: Database["public"]["Enums"]["destino_retiro"] | null
          estado_sustento?:
            | Database["public"]["Enums"]["estado_sustento"]
            | null
          fecha: string
          id?: number
          importado?: boolean
          jornada_id?: number | null
          medio_pago?: string | null
          monto?: number
          monto_digital?: number
          monto_efectivo?: number
          nombre?: string | null
          num_operacion?: string | null
          numero?: string | null
          observacion?: string | null
          origen?: Database["public"]["Enums"]["origen_reposicion"] | null
          responsable?: string | null
          ruc_dni?: string | null
          serie?: string | null
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
          turno: Database["public"]["Enums"]["turno_caja"]
        }
        Update: {
          actualizado_en?: string | null
          actualizado_por?: string | null
          anulado?: boolean
          anulado_en?: string | null
          anulado_motivo?: string | null
          anulado_por?: string | null
          area?: string | null
          caja_retiro?: Database["public"]["Enums"]["tipo_caja"] | null
          comprobante?: string | null
          creado_en?: string
          creado_por?: string | null
          cuenta?: string | null
          descripcion?: string
          destino?: Database["public"]["Enums"]["destino_retiro"] | null
          estado_sustento?:
            | Database["public"]["Enums"]["estado_sustento"]
            | null
          fecha?: string
          id?: number
          importado?: boolean
          jornada_id?: number | null
          medio_pago?: string | null
          monto?: number
          monto_digital?: number
          monto_efectivo?: number
          nombre?: string | null
          num_operacion?: string | null
          numero?: string | null
          observacion?: string | null
          origen?: Database["public"]["Enums"]["origen_reposicion"] | null
          responsable?: string | null
          ruc_dni?: string | null
          serie?: string | null
          tipo?: Database["public"]["Enums"]["tipo_movimiento"]
          turno?: Database["public"]["Enums"]["turno_caja"]
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_actualizado_por_fkey"
            columns: ["actualizado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_anulado_por_fkey"
            columns: ["anulado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_jornada_id_fkey"
            columns: ["jornada_id"]
            isOneToOne: false
            referencedRelation: "jornadas"
            referencedColumns: ["id"]
          },
        ]
      }
      observaciones_arqueo: {
        Row: {
          arqueo_id: number
          creado_en: string
          creado_por: string | null
          diferencia: number | null
          id: number
          texto: string
          total_contado: number | null
        }
        Insert: {
          arqueo_id: number
          creado_en?: string
          creado_por?: string | null
          diferencia?: number | null
          id?: number
          texto: string
          total_contado?: number | null
        }
        Update: {
          arqueo_id?: number
          creado_en?: string
          creado_por?: string | null
          diferencia?: number | null
          id?: number
          texto?: string
          total_contado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "observaciones_arqueo_arqueo_id_fkey"
            columns: ["arqueo_id"]
            isOneToOne: false
            referencedRelation: "arqueos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observaciones_arqueo_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parametros: {
        Row: {
          actualizado_en: string | null
          actualizado_por: string | null
          base_caja_diaria: number
          caja_chica_alerta: number | null
          caja_chica_max: number
          caja_chica_min: number
          denominaciones: number[]
          fecha_corte: string
          hora_inicio_noche: string
          id: number
          saldo_inicial_caja_chica: number
          tolerancia_arqueo: number
        }
        Insert: {
          actualizado_en?: string | null
          actualizado_por?: string | null
          base_caja_diaria?: number
          caja_chica_alerta?: number | null
          caja_chica_max?: number
          caja_chica_min?: number
          denominaciones?: number[]
          fecha_corte?: string
          hora_inicio_noche?: string
          id?: number
          saldo_inicial_caja_chica?: number
          tolerancia_arqueo?: number
        }
        Update: {
          actualizado_en?: string | null
          actualizado_por?: string | null
          base_caja_diaria?: number
          caja_chica_alerta?: number | null
          caja_chica_max?: number
          caja_chica_min?: number
          denominaciones?: number[]
          fecha_corte?: string
          hora_inicio_noche?: string
          id?: number
          saldo_inicial_caja_chica?: number
          tolerancia_arqueo?: number
        }
        Relationships: [
          {
            foreignKeyName: "parametros_actualizado_por_fkey"
            columns: ["actualizado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          activo: boolean
          actualizado_en: string | null
          actualizado_por: string | null
          creado_en: string
          dni: string | null
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_usuario"]
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string | null
          actualizado_por?: string | null
          creado_en?: string
          dni?: string | null
          id: string
          nombre: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
        }
        Update: {
          activo?: boolean
          actualizado_en?: string | null
          actualizado_por?: string | null
          creado_en?: string
          dni?: string | null
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
        }
        Relationships: []
      }
    }
    Views: {
      v_resumen_diario: {
        Row: {
          egresos: number | null
          fecha: string | null
          ingresos: number | null
          ingresos_digital: number | null
          ingresos_efectivo: number | null
          n_movimientos: number | null
          pendientes: number | null
          reposiciones: number | null
          retiros: number | null
          retiros_caja_chica: number | null
          sin_comprobante: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      fn_es_supervisor: { Args: never; Returns: boolean }
      fn_jornada_abierta: { Args: { p_fecha: string }; Returns: boolean }
      fn_saldo_caja_chica: { Args: { p_hasta?: string }; Returns: number }
      fn_usuario_activo: { Args: never; Returns: boolean }
    }
    Enums: {
      destino_retiro: "BANCO" | "OTRO" | "GERENCIA"
      estado_arqueo: "CUADRA" | "REVISAR"
      estado_jornada: "ABIERTA" | "CERRADA"
      estado_sustento: "CON COMPROBANTE" | "SIN COMPROBANTE" | "PENDIENTE"
      origen_reposicion: "BANCO" | "CAJA_DIARIA"
      rol_usuario: "cajero" | "supervisor"
      tipo_caja: "DIARIA" | "CHICA"
      tipo_movimiento: "INGRESO" | "EGRESO" | "REPOSICION_CAJA_CHICA" | "RETIRO"
      turno_caja: "MAÑANA" | "NOCHE"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
    Enums: {
      destino_retiro: ["BANCO", "OTRO", "GERENCIA"],
      estado_arqueo: ["CUADRA", "REVISAR"],
      estado_jornada: ["ABIERTA", "CERRADA"],
      estado_sustento: ["CON COMPROBANTE", "SIN COMPROBANTE", "PENDIENTE"],
      origen_reposicion: ["BANCO", "CAJA_DIARIA"],
      rol_usuario: ["cajero", "supervisor"],
      tipo_caja: ["DIARIA", "CHICA"],
      tipo_movimiento: ["INGRESO", "EGRESO", "REPOSICION_CAJA_CHICA", "RETIRO"],
      turno_caja: ["MAÑANA", "NOCHE"],
    },
  },
} as const

