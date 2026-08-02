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
      actes_realises: {
        Row: {
          acte_id: string
          cabinet_id: string
          created_at: string
          id: string
          intervention_id: string
          observations: string | null
          quantite: number
          realise_par: string | null
        }
        Insert: {
          acte_id: string
          cabinet_id: string
          created_at?: string
          id?: string
          intervention_id: string
          observations?: string | null
          quantite?: number
          realise_par?: string | null
        }
        Update: {
          acte_id?: string
          cabinet_id?: string
          created_at?: string
          id?: string
          intervention_id?: string
          observations?: string | null
          quantite?: number
          realise_par?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actes_realises_acte_id_fkey"
            columns: ["acte_id"]
            isOneToOne: false
            referencedRelation: "catalogue_actes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actes_realises_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actes_realises_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actes_realises_realise_par_fkey"
            columns: ["realise_par"]
            isOneToOne: false
            referencedRelation: "soignants"
            referencedColumns: ["id"]
          },
        ]
      }
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
      cotations: {
        Row: {
          alertes: Json
          cabinet_id: string
          calcule_le: string
          created_at: string
          deplacement: Json
          facture_id: string | null
          id: string
          intervention_id: string
          justification: Json
          lignes: Json
          majorations: Json
          patient_id: string
          total: number
          total_ht: number
          updated_at: string
          version_ngap: string
        }
        Insert: {
          alertes?: Json
          cabinet_id: string
          calcule_le?: string
          created_at?: string
          deplacement?: Json
          facture_id?: string | null
          id?: string
          intervention_id: string
          justification?: Json
          lignes?: Json
          majorations?: Json
          patient_id: string
          total?: number
          total_ht?: number
          updated_at?: string
          version_ngap?: string
        }
        Update: {
          alertes?: Json
          cabinet_id?: string
          calcule_le?: string
          created_at?: string
          deplacement?: Json
          facture_id?: string | null
          id?: string
          intervention_id?: string
          justification?: Json
          lignes?: Json
          majorations?: Json
          patient_id?: string
          total?: number
          total_ht?: number
          updated_at?: string
          version_ngap?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotations_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotations_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: true
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cotations_facture"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ajoute_par: string | null
          cabinet_id: string
          created_at: string
          id: string
          intervention_id: string | null
          mime_type: string | null
          notes: string | null
          ordonnance_id: string | null
          patient_id: string | null
          storage_path: string
          taille_octets: number | null
          titre: string
          type: Database["public"]["Enums"]["type_document"]
          updated_at: string
          visible_medecin: boolean
        }
        Insert: {
          ajoute_par?: string | null
          cabinet_id: string
          created_at?: string
          id?: string
          intervention_id?: string | null
          mime_type?: string | null
          notes?: string | null
          ordonnance_id?: string | null
          patient_id?: string | null
          storage_path: string
          taille_octets?: number | null
          titre: string
          type?: Database["public"]["Enums"]["type_document"]
          updated_at?: string
          visible_medecin?: boolean
        }
        Update: {
          ajoute_par?: string | null
          cabinet_id?: string
          created_at?: string
          id?: string
          intervention_id?: string | null
          mime_type?: string | null
          notes?: string | null
          ordonnance_id?: string | null
          patient_id?: string | null
          storage_path?: string
          taille_octets?: number | null
          titre?: string
          type?: Database["public"]["Enums"]["type_document"]
          updated_at?: string
          visible_medecin?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "documents_ajoute_par_fkey"
            columns: ["ajoute_par"]
            isOneToOne: false
            referencedRelation: "soignants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_ordonnance_id_fkey"
            columns: ["ordonnance_id"]
            isOneToOne: false
            referencedRelation: "ordonnances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      factures: {
        Row: {
          cabinet_id: string
          created_at: string
          date_envoi: string | null
          date_paiement: string | null
          export_le: string | null
          id: string
          montant_paye: number
          motif_rejet: string | null
          notes: string | null
          numero: string
          part_amc: number
          part_amo: number
          part_patient: number
          patient_id: string
          periode_debut: string
          periode_fin: string
          statut: Database["public"]["Enums"]["statut_facture"]
          total: number
          updated_at: string
        }
        Insert: {
          cabinet_id: string
          created_at?: string
          date_envoi?: string | null
          date_paiement?: string | null
          export_le?: string | null
          id?: string
          montant_paye?: number
          motif_rejet?: string | null
          notes?: string | null
          numero: string
          part_amc?: number
          part_amo?: number
          part_patient?: number
          patient_id: string
          periode_debut: string
          periode_fin: string
          statut?: Database["public"]["Enums"]["statut_facture"]
          total?: number
          updated_at?: string
        }
        Update: {
          cabinet_id?: string
          created_at?: string
          date_envoi?: string | null
          date_paiement?: string | null
          export_le?: string | null
          id?: string
          montant_paye?: number
          motif_rejet?: string | null
          notes?: string | null
          numero?: string
          part_amc?: number
          part_amo?: number
          part_patient?: number
          patient_id?: string
          periode_debut?: string
          periode_fin?: string
          statut?: Database["public"]["Enums"]["statut_facture"]
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "factures_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          actions: string | null
          cabinet_id: string
          clos: boolean
          created_at: string
          declare_par: string | null
          description: string
          gravite: Database["public"]["Enums"]["gravite"]
          id: string
          intervention_id: string | null
          patient_id: string | null
          survenu_le: string
          type: string
          updated_at: string
        }
        Insert: {
          actions?: string | null
          cabinet_id: string
          clos?: boolean
          created_at?: string
          declare_par?: string | null
          description: string
          gravite?: Database["public"]["Enums"]["gravite"]
          id?: string
          intervention_id?: string | null
          patient_id?: string | null
          survenu_le?: string
          type: string
          updated_at?: string
        }
        Update: {
          actions?: string | null
          cabinet_id?: string
          clos?: boolean
          created_at?: string
          declare_par?: string | null
          description?: string
          gravite?: Database["public"]["Enums"]["gravite"]
          id?: string
          intervention_id?: string | null
          patient_id?: string | null
          survenu_le?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_declare_par_fkey"
            columns: ["declare_par"]
            isOneToOne: false
            referencedRelation: "soignants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      interventions: {
        Row: {
          cabinet_id: string
          created_at: string
          date: string
          debut_prevu: string
          debut_reel: string | null
          distance_precedent_km: number | null
          duree_trajet_min: number | null
          fenetre_debut: string | null
          fenetre_fin: string | null
          fin_prevue: string
          fin_reelle: string | null
          horaire_verrouille: boolean
          id: string
          lat_pointage: number | null
          lng_pointage: number | null
          motif: string | null
          notes: string | null
          ordre: number
          patient_id: string
          periode: Database["public"]["Enums"]["periode_tournee"]
          plan_id: string | null
          soignant_id: string | null
          statut: Database["public"]["Enums"]["statut_intervention"]
          tournee_id: string | null
          updated_at: string
        }
        Insert: {
          cabinet_id: string
          created_at?: string
          date: string
          debut_prevu: string
          debut_reel?: string | null
          distance_precedent_km?: number | null
          duree_trajet_min?: number | null
          fenetre_debut?: string | null
          fenetre_fin?: string | null
          fin_prevue: string
          fin_reelle?: string | null
          horaire_verrouille?: boolean
          id?: string
          lat_pointage?: number | null
          lng_pointage?: number | null
          motif?: string | null
          notes?: string | null
          ordre?: number
          patient_id: string
          periode?: Database["public"]["Enums"]["periode_tournee"]
          plan_id?: string | null
          soignant_id?: string | null
          statut?: Database["public"]["Enums"]["statut_intervention"]
          tournee_id?: string | null
          updated_at?: string
        }
        Update: {
          cabinet_id?: string
          created_at?: string
          date?: string
          debut_prevu?: string
          debut_reel?: string | null
          distance_precedent_km?: number | null
          duree_trajet_min?: number | null
          fenetre_debut?: string | null
          fenetre_fin?: string | null
          fin_prevue?: string
          fin_reelle?: string | null
          horaire_verrouille?: boolean
          id?: string
          lat_pointage?: number | null
          lng_pointage?: number | null
          motif?: string | null
          notes?: string | null
          ordre?: number
          patient_id?: string
          periode?: Database["public"]["Enums"]["periode_tournee"]
          plan_id?: string | null
          soignant_id?: string | null
          statut?: Database["public"]["Enums"]["statut_intervention"]
          tournee_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interventions_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans_de_soins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_soignant_id_fkey"
            columns: ["soignant_id"]
            isOneToOne: false
            referencedRelation: "soignants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_tournee_id_fkey"
            columns: ["tournee_id"]
            isOneToOne: false
            referencedRelation: "tournees"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_facture: {
        Row: {
          cabinet_id: string
          code: string
          coefficient: number
          cotation_id: string | null
          created_at: string
          date_acte: string
          facture_id: string
          id: string
          libelle: string
          montant: number
          taux: number
        }
        Insert: {
          cabinet_id: string
          code: string
          coefficient?: number
          cotation_id?: string | null
          created_at?: string
          date_acte: string
          facture_id: string
          id?: string
          libelle: string
          montant?: number
          taux?: number
        }
        Update: {
          cabinet_id?: string
          code?: string
          coefficient?: number
          cotation_id?: string | null
          created_at?: string
          date_acte?: string
          facture_id?: string
          id?: string
          libelle?: string
          montant?: number
          taux?: number
        }
        Relationships: [
          {
            foreignKeyName: "lignes_facture_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_facture_cotation_id_fkey"
            columns: ["cotation_id"]
            isOneToOne: false
            referencedRelation: "cotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_facture_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
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
      paiements: {
        Row: {
          cabinet_id: string
          created_at: string
          date_paiement: string
          facture_id: string
          id: string
          montant: number
          notes: string | null
          reference: string | null
          source: string
        }
        Insert: {
          cabinet_id: string
          created_at?: string
          date_paiement?: string
          facture_id: string
          id?: string
          montant: number
          notes?: string | null
          reference?: string | null
          source?: string
        }
        Update: {
          cabinet_id?: string
          created_at?: string
          date_paiement?: string
          facture_id?: string
          id?: string
          montant?: number
          notes?: string | null
          reference?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "paiements_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
      partage_jours: {
        Row: {
          cabinet_id: string
          created_at: string
          date_debut: string
          date_fin: string | null
          id: string
          jours_semaine: number[]
          notes: string | null
          periodes: Database["public"]["Enums"]["periode_tournee"][]
          regle: string
          remplace_soignant_id: string | null
          soignant_id: string
          updated_at: string
        }
        Insert: {
          cabinet_id: string
          created_at?: string
          date_debut: string
          date_fin?: string | null
          id?: string
          jours_semaine?: number[]
          notes?: string | null
          periodes?: Database["public"]["Enums"]["periode_tournee"][]
          regle?: string
          remplace_soignant_id?: string | null
          soignant_id: string
          updated_at?: string
        }
        Update: {
          cabinet_id?: string
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          id?: string
          jours_semaine?: number[]
          notes?: string | null
          periodes?: Database["public"]["Enums"]["periode_tournee"][]
          regle?: string
          remplace_soignant_id?: string | null
          soignant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partage_jours_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partage_jours_remplace_soignant_id_fkey"
            columns: ["remplace_soignant_id"]
            isOneToOne: false
            referencedRelation: "soignants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partage_jours_soignant_id_fkey"
            columns: ["soignant_id"]
            isOneToOne: false
            referencedRelation: "soignants"
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
      plan_soins_actes: {
        Row: {
          acte_id: string
          cabinet_id: string
          consignes: string | null
          created_at: string
          id: string
          plan_id: string
          quantite: number
        }
        Insert: {
          acte_id: string
          cabinet_id: string
          consignes?: string | null
          created_at?: string
          id?: string
          plan_id: string
          quantite?: number
        }
        Update: {
          acte_id?: string
          cabinet_id?: string
          consignes?: string | null
          created_at?: string
          id?: string
          plan_id?: string
          quantite?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_soins_actes_acte_id_fkey"
            columns: ["acte_id"]
            isOneToOne: false
            referencedRelation: "catalogue_actes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_soins_actes_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_soins_actes_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans_de_soins"
            referencedColumns: ["id"]
          },
        ]
      }
      plans_de_soins: {
        Row: {
          actif: boolean
          cabinet_id: string
          created_at: string
          date_debut: string
          date_fin: string | null
          duree_minutes: number
          fenetre_debut: string | null
          fenetre_fin: string | null
          heure_cible: string | null
          id: string
          jours_semaine: number[]
          libelle: string
          ordonnance_id: string | null
          patient_id: string
          periodes: Database["public"]["Enums"]["periode_tournee"][]
          protocole: string | null
          soignant_prefere_id: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          cabinet_id: string
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          duree_minutes?: number
          fenetre_debut?: string | null
          fenetre_fin?: string | null
          heure_cible?: string | null
          id?: string
          jours_semaine?: number[]
          libelle: string
          ordonnance_id?: string | null
          patient_id: string
          periodes?: Database["public"]["Enums"]["periode_tournee"][]
          protocole?: string | null
          soignant_prefere_id?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          cabinet_id?: string
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          duree_minutes?: number
          fenetre_debut?: string | null
          fenetre_fin?: string | null
          heure_cible?: string | null
          id?: string
          jours_semaine?: number[]
          libelle?: string
          ordonnance_id?: string | null
          patient_id?: string
          periodes?: Database["public"]["Enums"]["periode_tournee"][]
          protocole?: string | null
          soignant_prefere_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_de_soins_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_de_soins_ordonnance_id_fkey"
            columns: ["ordonnance_id"]
            isOneToOne: false
            referencedRelation: "ordonnances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_de_soins_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_de_soins_soignant_prefere_id_fkey"
            columns: ["soignant_prefere_id"]
            isOneToOne: false
            referencedRelation: "soignants"
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
      stocks: {
        Row: {
          cabinet_id: string
          categorie: string | null
          created_at: string
          date_peremption: string | null
          fournisseur: string | null
          id: string
          libelle: string
          notes: string | null
          quantite: number
          seuil_alerte: number
          unite: string
          updated_at: string
        }
        Insert: {
          cabinet_id: string
          categorie?: string | null
          created_at?: string
          date_peremption?: string | null
          fournisseur?: string | null
          id?: string
          libelle: string
          notes?: string | null
          quantite?: number
          seuil_alerte?: number
          unite?: string
          updated_at?: string
        }
        Update: {
          cabinet_id?: string
          categorie?: string | null
          created_at?: string
          date_peremption?: string | null
          fournisseur?: string | null
          id?: string
          libelle?: string
          notes?: string | null
          quantite?: number
          seuil_alerte?: number
          unite?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stocks_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
        ]
      }
      taches: {
        Row: {
          assignee_id: string | null
          cabinet_id: string
          categorie: string | null
          created_at: string
          description: string | null
          echeance: string | null
          fait_le: string | null
          id: string
          intervention_id: string | null
          patient_id: string | null
          priorite: number
          rappel_le: string | null
          recurrence: string | null
          statut: Database["public"]["Enums"]["statut_tache"]
          titre: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          cabinet_id: string
          categorie?: string | null
          created_at?: string
          description?: string | null
          echeance?: string | null
          fait_le?: string | null
          id?: string
          intervention_id?: string | null
          patient_id?: string | null
          priorite?: number
          rappel_le?: string | null
          recurrence?: string | null
          statut?: Database["public"]["Enums"]["statut_tache"]
          titre: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          cabinet_id?: string
          categorie?: string | null
          created_at?: string
          description?: string | null
          echeance?: string | null
          fait_le?: string | null
          id?: string
          intervention_id?: string | null
          patient_id?: string | null
          priorite?: number
          rappel_le?: string | null
          recurrence?: string | null
          statut?: Database["public"]["Enums"]["statut_tache"]
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "taches_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "soignants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taches_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taches_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taches_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      tournees: {
        Row: {
          cabinet_id: string
          created_at: string
          date: string
          duree_estimee_min: number | null
          duree_reelle_min: number | null
          heure_debut: string
          heure_fin: string
          id: string
          km_estimes: number | null
          km_reels: number | null
          notes: string | null
          periode: Database["public"]["Enums"]["periode_tournee"]
          soignant_id: string | null
          statut: Database["public"]["Enums"]["statut_tournee"]
          updated_at: string
          verrouillee: boolean
        }
        Insert: {
          cabinet_id: string
          created_at?: string
          date: string
          duree_estimee_min?: number | null
          duree_reelle_min?: number | null
          heure_debut?: string
          heure_fin?: string
          id?: string
          km_estimes?: number | null
          km_reels?: number | null
          notes?: string | null
          periode?: Database["public"]["Enums"]["periode_tournee"]
          soignant_id?: string | null
          statut?: Database["public"]["Enums"]["statut_tournee"]
          updated_at?: string
          verrouillee?: boolean
        }
        Update: {
          cabinet_id?: string
          created_at?: string
          date?: string
          duree_estimee_min?: number | null
          duree_reelle_min?: number | null
          heure_debut?: string
          heure_fin?: string
          id?: string
          km_estimes?: number | null
          km_reels?: number | null
          notes?: string | null
          periode?: Database["public"]["Enums"]["periode_tournee"]
          soignant_id?: string | null
          statut?: Database["public"]["Enums"]["statut_tournee"]
          updated_at?: string
          verrouillee?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "tournees_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournees_soignant_id_fkey"
            columns: ["soignant_id"]
            isOneToOne: false
            referencedRelation: "soignants"
            referencedColumns: ["id"]
          },
        ]
      }
      transmissions: {
        Row: {
          audio_duree_s: number | null
          audio_path: string | null
          auteur_id: string | null
          cabinet_id: string
          corrige_transmission_id: string | null
          created_at: string
          gravite: Database["public"]["Enums"]["gravite"]
          id: string
          intervention_id: string | null
          lu_par: string[]
          patient_id: string | null
          texte: string | null
          transcription: string | null
          type: Database["public"]["Enums"]["type_transmission"]
          visible_medecin: boolean
        }
        Insert: {
          audio_duree_s?: number | null
          audio_path?: string | null
          auteur_id?: string | null
          cabinet_id: string
          corrige_transmission_id?: string | null
          created_at?: string
          gravite?: Database["public"]["Enums"]["gravite"]
          id?: string
          intervention_id?: string | null
          lu_par?: string[]
          patient_id?: string | null
          texte?: string | null
          transcription?: string | null
          type?: Database["public"]["Enums"]["type_transmission"]
          visible_medecin?: boolean
        }
        Update: {
          audio_duree_s?: number | null
          audio_path?: string | null
          auteur_id?: string | null
          cabinet_id?: string
          corrige_transmission_id?: string | null
          created_at?: string
          gravite?: Database["public"]["Enums"]["gravite"]
          id?: string
          intervention_id?: string | null
          lu_par?: string[]
          patient_id?: string | null
          texte?: string | null
          transcription?: string | null
          type?: Database["public"]["Enums"]["type_transmission"]
          visible_medecin?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "transmissions_auteur_id_fkey"
            columns: ["auteur_id"]
            isOneToOne: false
            referencedRelation: "soignants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transmissions_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transmissions_corrige_transmission_id_fkey"
            columns: ["corrige_transmission_id"]
            isOneToOne: false
            referencedRelation: "transmissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transmissions_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transmissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
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
      creer_cabinet: {
        Args: {
          p_adresse_ligne1?: string
          p_code_postal?: string
          p_nom: string
          p_telephone?: string
          p_ville?: string
        }
        Returns: string
      }
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
      mon_profil: {
        Args: never
        Returns: {
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
        SetofOptions: {
          from: "*"
          to: "soignants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "titulaire" | "associee" | "remplacante"
      civilite: "M" | "Mme" | "Autre"
      gravite: "info" | "attention" | "urgent"
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
      periode_tournee: "matin" | "soir" | "nuit" | "journee"
      statut_dossier: "actif" | "en_pause" | "termine" | "archive"
      statut_facture:
        | "brouillon"
        | "a_envoyer"
        | "envoyee"
        | "payee"
        | "partielle"
        | "rejetee"
        | "litige"
        | "annulee"
      statut_intervention:
        | "planifie"
        | "en_route"
        | "en_cours"
        | "realise"
        | "absent"
        | "refuse"
        | "annule"
        | "a_replanifier"
      statut_ordonnance: "a_recuperer" | "valide" | "expiree" | "annulee"
      statut_tache: "a_faire" | "en_cours" | "faite" | "annulee"
      statut_tournee: "brouillon" | "validee" | "en_cours" | "terminee"
      type_document:
        | "ordonnance"
        | "compte_rendu"
        | "photo_plaie"
        | "consentement"
        | "resultat"
        | "autre"
      type_transmission:
        | "observation"
        | "alerte"
        | "consigne"
        | "relais"
        | "debrief"
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
      gravite: ["info", "attention", "urgent"],
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
      periode_tournee: ["matin", "soir", "nuit", "journee"],
      statut_dossier: ["actif", "en_pause", "termine", "archive"],
      statut_facture: [
        "brouillon",
        "a_envoyer",
        "envoyee",
        "payee",
        "partielle",
        "rejetee",
        "litige",
        "annulee",
      ],
      statut_intervention: [
        "planifie",
        "en_route",
        "en_cours",
        "realise",
        "absent",
        "refuse",
        "annule",
        "a_replanifier",
      ],
      statut_ordonnance: ["a_recuperer", "valide", "expiree", "annulee"],
      statut_tache: ["a_faire", "en_cours", "faite", "annulee"],
      statut_tournee: ["brouillon", "validee", "en_cours", "terminee"],
      type_document: [
        "ordonnance",
        "compte_rendu",
        "photo_plaie",
        "consentement",
        "resultat",
        "autre",
      ],
      type_transmission: [
        "observation",
        "alerte",
        "consigne",
        "relais",
        "debrief",
      ],
      zone_statut: ["autorisee", "peripherie", "exclue"],
    },
  },
} as const
