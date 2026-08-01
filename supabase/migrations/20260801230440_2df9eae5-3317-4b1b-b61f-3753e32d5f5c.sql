-- ============================================================
-- CABINET — Socle (Phase 0, partie 1)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- Types ----------
CREATE TYPE public.app_role AS ENUM ('admin', 'titulaire', 'associee', 'remplacante');
CREATE TYPE public.civilite AS ENUM ('M', 'Mme', 'Autre');
CREATE TYPE public.statut_dossier AS ENUM ('actif', 'en_pause', 'termine', 'archive');
CREATE TYPE public.statut_ordonnance AS ENUM ('a_recuperer', 'valide', 'expiree', 'annulee');
CREATE TYPE public.lettre_cle AS ENUM ('AMI', 'AIS', 'AMX', 'BSI', 'BSA', 'BSB', 'BSC', 'DI', 'IFD', 'IK', 'MAJ', 'AUTRE');
CREATE TYPE public.zone_statut AS ENUM ('autorisee', 'peripherie', 'exclue');

-- ---------- Utilitaire updated_at ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------- Cabinets ----------
CREATE TABLE public.cabinets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  siret TEXT,
  adresse_ligne1 TEXT,
  code_postal TEXT,
  ville TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  telephone TEXT,
  email TEXT,
  mode_demo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.cabinets TO authenticated;
GRANT ALL ON public.cabinets TO service_role;
ALTER TABLE public.cabinets ENABLE ROW LEVEL SECURITY;

-- ---------- Soignants ----------
CREATE TABLE public.soignants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  cabinet_id UUID REFERENCES public.cabinets(id) ON DELETE SET NULL,
  nom TEXT NOT NULL DEFAULT '',
  prenom TEXT NOT NULL DEFAULT '',
  email TEXT,
  telephone TEXT,
  numero_adeli TEXT,
  numero_rpps TEXT,
  couleur TEXT NOT NULL DEFAULT '#4E7C68',
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_soignants_cabinet ON public.soignants(cabinet_id);
GRANT SELECT, INSERT, UPDATE ON public.soignants TO authenticated;
GRANT ALL ON public.soignants TO service_role;
ALTER TABLE public.soignants ENABLE ROW LEVEL SECURITY;

-- ---------- Rôles (table séparée : anti-escalade) ----------
CREATE TABLE public.soignant_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.soignant_roles TO authenticated;
GRANT ALL ON public.soignant_roles TO service_role;
ALTER TABLE public.soignant_roles ENABLE ROW LEVEL SECURITY;

-- ---------- Fonctions de sécurité ----------
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.soignant_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.current_cabinet_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT cabinet_id FROM public.soignants WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_soignant_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.soignants WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_cabinet_member(_cabinet_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _cabinet_id IS NOT NULL AND _cabinet_id = public.current_cabinet_id();
$$;

-- ---------- Policies socle ----------
CREATE POLICY "cabinet_lecture_membre" ON public.cabinets FOR SELECT TO authenticated
  USING (id = public.current_cabinet_id());
CREATE POLICY "cabinet_creation" ON public.cabinets FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "cabinet_maj_titulaire" ON public.cabinets FOR UPDATE TO authenticated
  USING (id = public.current_cabinet_id()
     AND (public.has_role(auth.uid(),'titulaire') OR public.has_role(auth.uid(),'admin')));

CREATE POLICY "soignant_lecture_cabinet" ON public.soignants FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_cabinet_member(cabinet_id));
CREATE POLICY "soignant_creation_self" ON public.soignants FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "soignant_maj_self_ou_titulaire" ON public.soignants FOR UPDATE TO authenticated
  USING (user_id = auth.uid()
     OR (public.is_cabinet_member(cabinet_id)
         AND (public.has_role(auth.uid(),'titulaire') OR public.has_role(auth.uid(),'admin'))));

CREATE POLICY "roles_lecture_self" ON public.soignant_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'titulaire'));

-- ---------- Zones CPAM ----------
CREATE TABLE public.zones_cpam (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES public.cabinets(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  statut public.zone_statut NOT NULL DEFAULT 'autorisee',
  codes_postaux TEXT[] NOT NULL DEFAULT '{}',
  communes TEXT[] NOT NULL DEFAULT '{}',
  geojson JSONB,
  centre_lat DOUBLE PRECISION,
  centre_lng DOUBLE PRECISION,
  rayon_km NUMERIC(6,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_zones_cabinet ON public.zones_cpam(cabinet_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zones_cpam TO authenticated;
GRANT ALL ON public.zones_cpam TO service_role;
ALTER TABLE public.zones_cpam ENABLE ROW LEVEL SECURITY;
CREATE POLICY "zones_cabinet" ON public.zones_cpam FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

-- ---------- Prescripteurs ----------
CREATE TABLE public.prescripteurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES public.cabinets(id) ON DELETE CASCADE,
  civilite public.civilite,
  nom TEXT NOT NULL,
  prenom TEXT,
  specialite TEXT NOT NULL DEFAULT 'Médecin généraliste',
  numero_rpps TEXT,
  structure TEXT,
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  telephone TEXT,
  email TEXT,
  contact_prefere TEXT NOT NULL DEFAULT 'telephone',
  portail_actif BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_prescripteurs_cabinet ON public.prescripteurs(cabinet_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescripteurs TO authenticated;
GRANT ALL ON public.prescripteurs TO service_role;
ALTER TABLE public.prescripteurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prescripteurs_cabinet" ON public.prescripteurs FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

-- ---------- Patients ----------
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES public.cabinets(id) ON DELETE CASCADE,
  civilite public.civilite,
  nom TEXT NOT NULL,
  nom_naissance TEXT,
  prenom TEXT NOT NULL,
  date_naissance DATE,
  telephone TEXT,
  telephone_secondaire TEXT,
  email TEXT,
  -- Sécurité sociale
  nir_chiffre BYTEA,
  nir_derniers TEXT,
  caisse TEXT,
  regime TEXT,
  mutuelle_nom TEXT,
  mutuelle_numero TEXT,
  tiers_payant BOOLEAN NOT NULL DEFAULT true,
  exoneration TEXT,
  ald BOOLEAN NOT NULL DEFAULT false,
  ald_libelle TEXT,
  medecin_traitant_id UUID REFERENCES public.prescripteurs(id) ON DELETE SET NULL,
  -- Domicile
  adresse_ligne1 TEXT NOT NULL DEFAULT '',
  adresse_ligne2 TEXT,
  code_postal TEXT NOT NULL DEFAULT '',
  ville TEXT NOT NULL DEFAULT '',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  zone_cpam_id UUID REFERENCES public.zones_cpam(id) ON DELETE SET NULL,
  hors_zone BOOLEAN NOT NULL DEFAULT false,
  acces_etage TEXT,
  acces_code TEXT,
  acces_cle TEXT,
  acces_ascenseur BOOLEAN,
  acces_animal TEXT,
  acces_stationnement TEXT,
  -- Entourage
  personne_confiance TEXT,
  personne_confiance_tel TEXT,
  contact_urgence TEXT,
  contact_urgence_tel TEXT,
  aidant TEXT,
  -- Clinique
  gir SMALLINT,
  allergies TEXT,
  antecedents TEXT,
  traitements_en_cours TEXT,
  risques TEXT[] NOT NULL DEFAULT '{}',
  observations TEXT,
  -- Dossier
  statut public.statut_dossier NOT NULL DEFAULT 'actif',
  date_admission DATE NOT NULL DEFAULT CURRENT_DATE,
  date_sortie DATE,
  consentement_partage_medecin BOOLEAN NOT NULL DEFAULT false,
  cree_par UUID REFERENCES public.soignants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_patients_cabinet ON public.patients(cabinet_id);
CREATE INDEX idx_patients_nom ON public.patients(cabinet_id, nom, prenom);
CREATE INDEX idx_patients_statut ON public.patients(cabinet_id, statut);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patients_cabinet" ON public.patients FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

-- ---------- Accès nominatifs au dossier ----------
CREATE TABLE public.patient_acces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES public.cabinets(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  soignant_id UUID REFERENCES public.soignants(id) ON DELETE CASCADE,
  prescripteur_id UUID REFERENCES public.prescripteurs(id) ON DELETE CASCADE,
  portee TEXT NOT NULL DEFAULT 'complet',
  valide_du DATE NOT NULL DEFAULT CURRENT_DATE,
  valide_au DATE,
  revoque BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_acces_patient ON public.patient_acces(patient_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_acces TO authenticated;
GRANT ALL ON public.patient_acces TO service_role;
ALTER TABLE public.patient_acces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acces_cabinet" ON public.patient_acces FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

-- ---------- Catalogue NGAP ----------
CREATE TABLE public.catalogue_actes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  libelle TEXT NOT NULL,
  libelle_court TEXT,
  chapitre TEXT,
  article TEXT,
  lettre_cle public.lettre_cle NOT NULL DEFAULT 'AMI',
  coefficient NUMERIC(6,2) NOT NULL DEFAULT 1,
  valeur_lettre NUMERIC(6,2) NOT NULL DEFAULT 3.15,
  duree_minutes SMALLINT NOT NULL DEFAULT 10,
  prescription_obligatoire BOOLEAN NOT NULL DEFAULT true,
  bsi_requis BOOLEAN NOT NULL DEFAULT false,
  cumul_interdit_avec TEXT[] NOT NULL DEFAULT '{}',
  majorations_possibles TEXT[] NOT NULL DEFAULT '{}',
  materiel TEXT[] NOT NULL DEFAULT '{}',
  conditions TEXT,
  version_ngap TEXT NOT NULL DEFAULT '2026-06-21',
  date_effet DATE NOT NULL DEFAULT '2026-06-21',
  actif BOOLEAN NOT NULL DEFAULT true,
  recherche TEXT GENERATED ALWAYS AS (lower(code || ' ' || libelle)) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (code, version_ngap)
);
CREATE INDEX idx_catalogue_recherche ON public.catalogue_actes(recherche);
CREATE INDEX idx_catalogue_lettre ON public.catalogue_actes(lettre_cle);
GRANT SELECT ON public.catalogue_actes TO authenticated;
GRANT ALL ON public.catalogue_actes TO service_role;
ALTER TABLE public.catalogue_actes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalogue_lecture" ON public.catalogue_actes FOR SELECT TO authenticated USING (true);

-- ---------- Ordonnances ----------
CREATE TABLE public.ordonnances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES public.cabinets(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  prescripteur_id UUID REFERENCES public.prescripteurs(id) ON DELETE SET NULL,
  date_prescription DATE NOT NULL DEFAULT CURRENT_DATE,
  date_debut DATE,
  date_fin DATE,
  renouvelable BOOLEAN NOT NULL DEFAULT false,
  renouvellements SMALLINT NOT NULL DEFAULT 0,
  ald BOOLEAN NOT NULL DEFAULT false,
  statut public.statut_ordonnance NOT NULL DEFAULT 'valide',
  contenu TEXT,
  texte_ocr TEXT,
  fichier_path TEXT,
  actes_prescrits JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  cree_par UUID REFERENCES public.soignants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ordonnances_patient ON public.ordonnances(patient_id);
CREATE INDEX idx_ordonnances_fin ON public.ordonnances(cabinet_id, date_fin);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordonnances TO authenticated;
GRANT ALL ON public.ordonnances TO service_role;
ALTER TABLE public.ordonnances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ordonnances_cabinet" ON public.ordonnances FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

-- ---------- Journal d'audit (append-only) ----------
CREATE TABLE public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  cabinet_id UUID,
  user_id UUID,
  soignant_id UUID,
  action TEXT NOT NULL,
  entite TEXT NOT NULL,
  entite_id UUID,
  patient_id UUID,
  avant JSONB,
  apres JSONB,
  contexte JSONB,
  ip TEXT,
  appareil TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_cabinet_date ON public.audit_log(cabinet_id, created_at DESC);
CREATE INDEX idx_audit_patient ON public.audit_log(patient_id, created_at DESC);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.audit_log_id_seq TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.audit_log_id_seq TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_lecture_cabinet" ON public.audit_log FOR SELECT TO authenticated
  USING (public.is_cabinet_member(cabinet_id));
CREATE POLICY "audit_ecriture_cabinet" ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (public.is_cabinet_member(cabinet_id) AND user_id = auth.uid());

-- ---------- Triggers updated_at ----------
CREATE TRIGGER trg_cabinets_updated BEFORE UPDATE ON public.cabinets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_soignants_updated BEFORE UPDATE ON public.soignants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_zones_updated BEFORE UPDATE ON public.zones_cpam FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_prescripteurs_updated BEFORE UPDATE ON public.prescripteurs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_patients_updated BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_acces_updated BEFORE UPDATE ON public.patient_acces FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_catalogue_updated BEFORE UPDATE ON public.catalogue_actes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_ordonnances_updated BEFORE UPDATE ON public.ordonnances FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- Profil auto à l'inscription ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.soignants (user_id, nom, prenom, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nom', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'prenom', ''),
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();