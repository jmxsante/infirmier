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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          appareil: string | null
          apres: Json | null
          avant: Json | null
          cabinet_id: string | null
          contexte: Json | null
          created_at: string
          entite: string
          entite_id: string | null
          id: number
          ip: string | null
          patient_id: string | null
          soignant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          appareil?: string | null
          apres?: Json | null
          avant?: Json | null
          cabinet_id?: string | null
          contexte?: Json | null
          created_at?: string
          entite: string
          entite_id?: string | null
          id?: number
          ip?: string | null
          patient_id?: string | null
          soignant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          appareil?: string | null
          apres?: Json | null
          avant?: Json | null
          cabinet_id?: string | null
          contexte?: Json | null
          created_at?: string
          entite?: string
          entite_id?: string | null
          id?: number
          ip?: string | null
          patient_id?: string | null
          soignant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cabinets: {
        Row: {
          adresse_ligne1: string | null
          code_postal: string | null
          created_at: string
          email: string | null
          id: string
          lat: number | null
          lng: number | null
          mode_demo: boolean
          nom: string
          siret: string | null
          telephone: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse_ligne1?: string | null
          code_postal?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          mode_demo?: boolean
          nom: string
          siret?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse_ligne1?: string | null
          code_postal?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          mode_demo?: boolean
          nom?: string
          siret?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      catalogue_actes: {
        Row: {
          actif: boolean
          article: string | null
          bsi_requis: boolean
          chapitre: string | null
          code: string
          coefficient: number
          conditions: string | null
          created_at: string
          cumul_interdit_avec: string[]
          date_effet: string
          duree_minutes: number
          id: string
          lettre_cle: Database["public"]["Enums"]["lettre_cle"]
          libelle: string
          libelle_court: string | null
          majorations_possibles: string[]
          materiel: string[]
          prescription_obligatoire: boolean
          recherche: string | null
          updated_at: string
          valeur_lettre: number
          version_ngap: string
        }
        Insert: {
          actif?: boolean
          article?: string | null
          bsi_requis?: boolean
          chapitre?: string | null
          code: string
          coefficient?: number
          conditions?: string | null
          created_at?: string
          cumul_interdit_avec?: string[]
          date_effet?: string
          duree_minutes?: number
          id?: string
          lettre_cle?: Database["public"]["Enums"]["lettre_cle"]
          libelle: string
          libelle_court?: string | null
          majorations_possibles?: string[]
          materiel?: string[]
          prescription_obligatoire?: boolean
          recherche?: string | null
          updated_at?: string
          valeur_lettre?: number
          version_ngap?: string
        }
        Update: {
          actif?: boolean
          article?: string | null
          bsi_requis?: boolean
          chapitre?: string | null
          code?: string
          coefficient?: number
          conditions?: string | null
          created_at?: string
          cumul_interdit_avec?: string[]
          date_effet?: string
          duree_minutes?: number
          id?: string
          lettre_cle?: Database["public"]["Enums"]["lettre_cle"]
          libelle?: string
          libelle_court?: string | null
          majorations_possibles?: string[]
          materiel?: string[]
          prescription_obligatoire?: boolean
          recherche?: string | null
          updated_at?: string
          valeur_lettre?: number
          version_ngap?: string
        }
        Relationships: []
      }
      ordonnances: {
        Row: {
          actes_prescrits: Json
          ald: boolean
          cabinet_id: string
          contenu: string | null
          created_at: string
          cree_par: string | null
          date_debut: string | null
          date_fin: string | null
          date_prescription: string
          fichier_path: string | null
          id: string
          notes: string | null
          patient_id: string
          prescripteur_id: string | null
          renouvelable: boolean
          renouvellements: number
          statut: Database["public"]["Enums"]["statut_ordonnance"]
          texte_ocr: string | null
          updated_at: string
        }
        Insert: {
          actes_prescrits?: Json
          ald?: boolean
          cabinet_id: string
          contenu?: string | null
          created_at?: string
          cree_par?: string | null
          date_debut?: string | null
          date_fin?: string | null
          date_prescription?: string
          fichier_path?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          prescripteur_id?: string | null
          renouvelable?: boolean
          renouvellements?: number
          statut?: Database["public"]["Enums"]["statut_ordonnance"]
          texte_ocr?: string | null
          updated_at?: string
        }
        Update: {
          actes_prescrits?: Json
          ald?: boolean
          cabinet_id?: string
          contenu?: string | null
          created_at?: string
          cree_par?: string | null
          date_debut?: string | null
          date_fin?: string | null
          date_prescription?: string
          fichier_path?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          prescripteur_id?: string | null
          renouvelable?: boolean
          renouvellements?: number
          statut?: Database["public"]["Enums"]["statut_ordonnance"]
          texte_ocr?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordonnances_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordonnances_cree_par_fkey"
            columns: ["cree_par"]
            isOneToOne: false
            referencedRelation: "soignants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordonnances_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordonnances_prescripteur_id_fkey"
            columns: ["prescripteur_id"]
            isOneToOne: false
            referencedRelation: "prescripteurs"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_acces: {
        Row: {
          cabinet_id: string
          created_at: string
          id: string
          patient_id: string
          portee: string
          prescripteur_id: string | null
          revoque: boolean
          soignant_id: string | null
          updated_at: string
          valide_au: string | null
          valide_du: string
        }
        Insert: {
          cabinet_id: string
          created_at?: string
          id?: string
          patient_id: string
          portee?: string
          prescripteur_id?: string | null
          revoque?: boolean
          soignant_id?: string | null
          updated_at?: string
          valide_au?: string | null
          valide_du?: string
        }
        Update: {
          cabinet_id?: string
          created_at?: string
          id?: string
          patient_id?: string
          portee?: string
          prescripteur_id?: string | null
          revoque?: boolean
          soignant_id?: string | null
          updated_at?: string
          valide_au?: string | null
          valide_du?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_acces_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_acces_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_acces_prescripteur_id_fkey"
            columns: ["prescripteur_id"]
            isOneToOne: false
            referencedRelation: "prescripteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_acces_soignant_id_fkey"
            columns: ["soignant_id"]
            isOneToOne: false
            referencedRelation: "soignants"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          acces_animal: string | null
          acces_ascenseur: boolean | null
          acces_cle: string | null
          acces_code: string | null
          acces_etage: string | null
          acces_stationnement: string | null
          adresse_ligne1: string
          adresse_ligne2: string | null
          aidant: string | null
          ald: boolean
          ald_libelle: string | null
          allergies: string | null
          antecedents: string | null
          cabinet_id: string
          caisse: string | null
          civilite: Database["public"]["Enums"]["civilite"] | null
          code_postal: string
          consentement_partage_medecin: boolean
          contact_urgence: string | null
          contact_urgence_tel: string | null
          created_at: string
          cree_par: string | null
          date_admission: string
          date_naissance: string | null
          date_sortie: string | null
          email: string | null
          exoneration: string | null
          gir: number | null
          hors_zone: boolean
          id: string
          lat: number | null
          lng: number | null
          medecin_traitant_id: string | null
          mutuelle_nom: string | null
          mutuelle_numero: string | null
          nir_chiffre: string | null
          nir_derniers: string | null
          nom: string
          nom_naissance: string | null
          observations: string | null
          personne_confiance: string | null
          personne_confiance_tel: string | null
          prenom: string
          regime: string | null
          risques: string[]
          statut: Database["public"]["Enums"]["statut_dossier"]
          telephone: string | null
          telephone_secondaire: string | null
          tiers_payant: boolean
          traitements_en_cours: string | null
          updated_at: string
          ville: string
          zone_cpam_id: string | null
        }
        Insert: {
          acces_animal?: string | null
          acces_ascenseur?: boolean | null
          acces_cle?: string | null
          acces_code?: string | null
          acces_etage?: string | null
          acces_stationnement?: string | null
          adresse_ligne1?: string
          adresse_ligne2?: string | null
          aidant?: string | null
          ald?: boolean
          ald_libelle?: string | null
          allergies?: string | null
          antecedents?: string | null
          cabinet_id: string
          caisse?: string | null
          civilite?: Database["public"]["Enums"]["civilite"] | null
          code_postal?: string
          consentement_partage_medecin?: boolean
          contact_urgence?: string | null
          contact_urgence_tel?: string | null
          created_at?: string
          cree_par?: string | null
          date_admission?: string
          date_naissance?: string | null
          date_sortie?: string | null
          email?: string | null
          exoneration?: string | null
          gir?: number | null
          hors_zone?: boolean
          id?: string
          lat?: number | null
          lng?: number | null
          medecin_traitant_id?: string | null
          mutuelle_nom?: string | null
          mutuelle_numero?: string | null
          nir_chiffre?: string | null
          nir_derniers?: string | null
          nom: string
          nom_naissance?: string | null
          observations?: string | null
          personne_confiance?: string | null
          personne_confiance_tel?: string | null
          prenom: string
          regime?: string | null
          risques?: string[]
          statut?: Database["public"]["Enums"]["statut_dossier"]
          telephone?: string | null
          telephone_secondaire?: string | null
          tiers_payant?: boolean
          traitements_en_cours?: string | null
          updated_at?: string
          ville?: string
          zone_cpam_id?: string | null
        }
        Update: {
          acces_animal?: string | null
          acces_ascenseur?: boolean | null
          acces_cle?: string | null
          acces_code?: string | null
          acces_etage?: string | null
          acces_stationnement?: string | null
          adresse_ligne1?: string
          adresse_ligne2?: string | null
          aidant?: string | null
          ald?: boolean
          ald_libelle?: string | null
          allergies?: string | null
          antecedents?: string | null
          cabinet_id?: string
          caisse?: string | null
          civilite?: Database["public"]["Enums"]["civilite"] | null
          code_postal?: string
          consentement_partage_medecin?: boolean
          contact_urgence?: string | null
          contact_urgence_tel?: string | null
          created_at?: string
          cree_par?: string | null
          date_admission?: string
          date_naissance?: string | null
          date_sortie?: string | null
          email?: string | null
          exoneration?: string | null
          gir?: number | null
          hors_zone?: boolean
          id?: string
          lat?: number | null
          lng?: number | null
          medecin_traitant_id?: string | null
          mutuelle_nom?: string | null
          mutuelle_numero?: string | null
          nir_chiffre?: string | null
          nir_derniers?: string | null
          nom?: string
          nom_naissance?: string | null
          observations?: string | null
          personne_confiance?: string | null
          personne_confiance_tel?: string | null
          prenom?: string
          regime?: string | null
          risques?: string[]
          statut?: Database["public"]["Enums"]["statut_dossier"]
          telephone?: string | null
          telephone_secondaire?: string | null
          tiers_payant?: boolean
          traitements_en_cours?: string | null
          updated_at?: string
          ville?: string
          zone_cpam_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_cree_par_fkey"
            columns: ["cree_par"]
            isOneToOne: false
            referencedRelation: "soignants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_medecin_traitant_id_fkey"
            columns: ["medecin_traitant_id"]
            isOneToOne: false
            referencedRelation: "prescripteurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_zone_cpam_id_fkey"
            columns: ["zone_cpam_id"]
            isOneToOne: false
            referencedRelation: "zones_cpam"
            referencedColumns: ["id"]
          },
        ]
      }
      prescripteurs: {
        Row: {
          adresse: string | null
          cabinet_id: string
          civilite: Database["public"]["Enums"]["civilite"] | null
          code_postal: string | null
          contact_prefere: string
          created_at: string
          email: string | null
          id: string
          nom: string
          notes: string | null
          numero_rpps: string | null
          portail_actif: boolean
          prenom: string | null
          specialite: string
          structure: string | null
          telephone: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          cabinet_id: string
          civilite?: Database["public"]["Enums"]["civilite"] | null
          code_postal?: string | null
          contact_prefere?: string
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          notes?: string | null
          numero_rpps?: string | null
          portail_actif?: boolean
          prenom?: string | null
          specialite?: string
          structure?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          cabinet_id?: string
          civilite?: Database["public"]["Enums"]["civilite"] | null
          code_postal?: string | null
          contact_prefere?: string
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          notes?: string | null
          numero_rpps?: string | null
          portail_actif?: boolean
          prenom?: string | null
          specialite?: string
          structure?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescripteurs_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
        ]
      }
      soignant_roles: {
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
      soignants: {
        Row: {
          actif: boolean
          cabinet_id: string | null
          couleur: string
          created_at: string
          email: string | null
          id: string
          nom: string
          numero_adeli: string | null
          numero_rpps: string | null
          prenom: string
          telephone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actif?: boolean
          cabinet_id?: string | null
          couleur?: string
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          numero_adeli?: string | null
          numero_rpps?: string | null
          prenom?: string
          telephone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actif?: boolean
          cabinet_id?: string | null
          couleur?: string
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          numero_adeli?: string | null
          numero_rpps?: string | null
          prenom?: string
          telephone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "soignants_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
        ]
      }
      zones_cpam: {
        Row: {
          cabinet_id: string
          centre_lat: number | null
          centre_lng: number | null
          codes_postaux: string[]
          communes: string[]
          created_at: string
          geojson: Json | null
          id: string
          nom: string
          notes: string | null
          rayon_km: number | null
          statut: Database["public"]["Enums"]["zone_statut"]
          updated_at: string
        }
        Insert: {
          cabinet_id: string
          centre_lat?: number | null
          centre_lng?: number | null
          codes_postaux?: string[]
          communes?: string[]
          created_at?: string
          geojson?: Json | null
          id?: string
          nom: string
          notes?: string | null
          rayon_km?: number | null
          statut?: Database["public"]["Enums"]["zone_statut"]
          updated_at?: string
        }
        Update: {
          cabinet_id?: string
          centre_lat?: number | null
          centre_lng?: number | null
          codes_postaux?: string[]
          communes?: string[]
          created_at?: string
          geojson?: Json | null
          id?: string
          nom?: string
          notes?: string | null
          rayon_km?: number | null
          statut?: Database["public"]["Enums"]["zone_statut"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "zones_cpam_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_cabinet_id: { Args: never; Returns: string }
      current_soignant_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_cabinet_member: { Args: { _cabinet_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "titulaire" | "associee" | "remplacante"
      civilite: "M" | "Mme" | "Autre"
      lettre_cle:
        | "AMI"
        | "AIS"
        | "AMX"
        | "BSI"
        | "BSA"
        | "BSB"
        | "BSC"
        | "DI"
        | "IFD"
        | "IK"
        | "MAJ"
        | "AUTRE"
      statut_dossier: "actif" | "en_pause" | "termine" | "archive"
      statut_ordonnance: "a_recuperer" | "valide" | "expiree" | "annulee"
      zone_statut: "autorisee" | "peripherie" | "exclue"
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
      app_role: ["admin", "titulaire", "associee", "remplacante"],
      civilite: ["M", "Mme", "Autre"],
      lettre_cle: [
        "AMI",
        "AIS",
        "AMX",
        "BSI",
        "BSA",
        "BSB",
        "BSC",
        "DI",
        "IFD",
        "IK",
        "MAJ",
        "AUTRE",
      ],
      statut_dossier: ["actif", "en_pause", "termine", "archive"],
      statut_ordonnance: ["a_recuperer", "valide", "expiree", "annulee"],
      zone_statut: ["autorisee", "peripherie", "exclue"],
    },
  },
} as const
