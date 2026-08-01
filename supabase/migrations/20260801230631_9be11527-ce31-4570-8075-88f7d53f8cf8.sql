-- ============================================================
-- Corrections sécurité partie 1
-- ============================================================
DROP POLICY IF EXISTS "cabinet_creation" ON public.cabinets;
CREATE POLICY "cabinet_creation_sans_cabinet" ON public.cabinets FOR INSERT TO authenticated
  WITH CHECK (public.current_cabinet_id() IS NULL);

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_cabinet_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_soignant_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_cabinet_member(UUID) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_cabinet_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_soignant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_cabinet_member(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, public, authenticated;

-- ============================================================
-- Types
-- ============================================================
CREATE TYPE public.periode_tournee AS ENUM ('matin', 'soir', 'nuit', 'journee');
CREATE TYPE public.statut_intervention AS ENUM ('planifie','en_route','en_cours','realise','absent','refuse','annule','a_replanifier');
CREATE TYPE public.statut_tournee AS ENUM ('brouillon','validee','en_cours','terminee');
CREATE TYPE public.statut_facture AS ENUM ('brouillon','a_envoyer','envoyee','payee','partielle','rejetee','litige','annulee');
CREATE TYPE public.type_transmission AS ENUM ('observation','alerte','consigne','relais','debrief');
CREATE TYPE public.gravite AS ENUM ('info','attention','urgent');
CREATE TYPE public.type_document AS ENUM ('ordonnance','compte_rendu','photo_plaie','consentement','resultat','autre');
CREATE TYPE public.statut_tache AS ENUM ('a_faire','en_cours','faite','annulee');

-- ============================================================
-- Partage des jours
-- ============================================================
CREATE TABLE public.partage_jours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES public.cabinets(id) ON DELETE CASCADE,
  soignant_id UUID NOT NULL REFERENCES public.soignants(id) ON DELETE CASCADE,
  date_debut DATE NOT NULL,
  date_fin DATE,
  regle TEXT NOT NULL DEFAULT 'personnalise',
  jours_semaine SMALLINT[] NOT NULL DEFAULT '{}',
  periodes public.periode_tournee[] NOT NULL DEFAULT '{matin,soir}',
  remplace_soignant_id UUID REFERENCES public.soignants(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_partage_cabinet ON public.partage_jours(cabinet_id, date_debut);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partage_jours TO authenticated;
GRANT ALL ON public.partage_jours TO service_role;
ALTER TABLE public.partage_jours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partage_cabinet" ON public.partage_jours FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

-- ============================================================
-- Plans de soins
-- ============================================================
CREATE TABLE public.plans_de_soins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES public.cabinets(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  ordonnance_id UUID REFERENCES public.ordonnances(id) ON DELETE SET NULL,
  libelle TEXT NOT NULL,
  date_debut DATE NOT NULL DEFAULT CURRENT_DATE,
  date_fin DATE,
  jours_semaine SMALLINT[] NOT NULL DEFAULT '{1,2,3,4,5,6,7}',
  periodes public.periode_tournee[] NOT NULL DEFAULT '{matin}',
  heure_cible TIME,
  fenetre_debut TIME,
  fenetre_fin TIME,
  duree_minutes SMALLINT NOT NULL DEFAULT 10,
  soignant_prefere_id UUID REFERENCES public.soignants(id) ON DELETE SET NULL,
  protocole TEXT,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_plans_patient ON public.plans_de_soins(patient_id);
CREATE INDEX idx_plans_cabinet_actif ON public.plans_de_soins(cabinet_id, actif);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans_de_soins TO authenticated;
GRANT ALL ON public.plans_de_soins TO service_role;
ALTER TABLE public.plans_de_soins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_cabinet" ON public.plans_de_soins FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

CREATE TABLE public.plan_soins_actes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES public.cabinets(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans_de_soins(id) ON DELETE CASCADE,
  acte_id UUID NOT NULL REFERENCES public.catalogue_actes(id) ON DELETE RESTRICT,
  quantite SMALLINT NOT NULL DEFAULT 1,
  consignes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_plan_actes_plan ON public.plan_soins_actes(plan_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_soins_actes TO authenticated;
GRANT ALL ON public.plan_soins_actes TO service_role;
ALTER TABLE public.plan_soins_actes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_actes_cabinet" ON public.plan_soins_actes FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

-- ============================================================
-- Tournées & interventions
-- ============================================================
CREATE TABLE public.tournees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES public.cabinets(id) ON DELETE CASCADE,
  soignant_id UUID REFERENCES public.soignants(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  periode public.periode_tournee NOT NULL DEFAULT 'matin',
  heure_debut TIME NOT NULL DEFAULT '06:30',
  heure_fin TIME NOT NULL DEFAULT '13:30',
  statut public.statut_tournee NOT NULL DEFAULT 'brouillon',
  km_estimes NUMERIC(7,2),
  km_reels NUMERIC(7,2),
  duree_estimee_min INTEGER,
  duree_reelle_min INTEGER,
  verrouillee BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cabinet_id, soignant_id, date, periode)
);
CREATE INDEX idx_tournees_date ON public.tournees(cabinet_id, date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournees TO authenticated;
GRANT ALL ON public.tournees TO service_role;
ALTER TABLE public.tournees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tournees_cabinet" ON public.tournees FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

CREATE TABLE public.interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES public.cabinets(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans_de_soins(id) ON DELETE SET NULL,
  tournee_id UUID REFERENCES public.tournees(id) ON DELETE SET NULL,
  soignant_id UUID REFERENCES public.soignants(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  periode public.periode_tournee NOT NULL DEFAULT 'matin',
  debut_prevu TIMESTAMPTZ NOT NULL,
  fin_prevue TIMESTAMPTZ NOT NULL,
  fenetre_debut TIMESTAMPTZ,
  fenetre_fin TIMESTAMPTZ,
  horaire_verrouille BOOLEAN NOT NULL DEFAULT false,
  debut_reel TIMESTAMPTZ,
  fin_reelle TIMESTAMPTZ,
  lat_pointage DOUBLE PRECISION,
  lng_pointage DOUBLE PRECISION,
  statut public.statut_intervention NOT NULL DEFAULT 'planifie',
  motif TEXT,
  ordre SMALLINT NOT NULL DEFAULT 0,
  distance_precedent_km NUMERIC(6,2),
  duree_trajet_min SMALLINT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_interventions_date ON public.interventions(cabinet_id, date, periode);
CREATE INDEX idx_interventions_tournee ON public.interventions(tournee_id, ordre);
CREATE INDEX idx_interventions_patient ON public.interventions(patient_id, date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interventions TO authenticated;
GRANT ALL ON public.interventions TO service_role;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interventions_cabinet" ON public.interventions FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

CREATE TABLE public.actes_realises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES public.cabinets(id) ON DELETE CASCADE,
  intervention_id UUID NOT NULL REFERENCES public.interventions(id) ON DELETE CASCADE,
  acte_id UUID NOT NULL REFERENCES public.catalogue_actes(id) ON DELETE RESTRICT,
  quantite SMALLINT NOT NULL DEFAULT 1,
  observations TEXT,
  realise_par UUID REFERENCES public.soignants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_actes_realises_interv ON public.actes_realises(intervention_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.actes_realises TO authenticated;
GRANT ALL ON public.actes_realises TO service_role;
ALTER TABLE public.actes_realises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "actes_realises_cabinet" ON public.actes_realises FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

-- ============================================================
-- Cotation & facturation
-- ============================================================
CREATE TABLE public.cotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES public.cabinets(id) ON DELETE CASCADE,
  intervention_id UUID NOT NULL REFERENCES public.interventions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  lignes JSONB NOT NULL DEFAULT '[]'::jsonb,
  majorations JSONB NOT NULL DEFAULT '[]'::jsonb,
  deplacement JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_ht NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  justification JSONB NOT NULL DEFAULT '[]'::jsonb,
  alertes JSONB NOT NULL DEFAULT '[]'::jsonb,
  version_ngap TEXT NOT NULL DEFAULT '2026-06-21',
  facture_id UUID,
  calcule_le TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (intervention_id)
);
CREATE INDEX idx_cotations_patient ON public.cotations(patient_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cotations TO authenticated;
GRANT ALL ON public.cotations TO service_role;
ALTER TABLE public.cotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cotations_cabinet" ON public.cotations FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

CREATE TABLE public.factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES public.cabinets(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  periode_debut DATE NOT NULL,
  periode_fin DATE NOT NULL,
  statut public.statut_facture NOT NULL DEFAULT 'brouillon',
  part_amo NUMERIC(10,2) NOT NULL DEFAULT 0,
  part_amc NUMERIC(10,2) NOT NULL DEFAULT 0,
  part_patient NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  montant_paye NUMERIC(10,2) NOT NULL DEFAULT 0,
  date_envoi DATE,
  date_paiement DATE,
  motif_rejet TEXT,
  export_le TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cabinet_id, numero)
);
CREATE INDEX idx_factures_statut ON public.factures(cabinet_id, statut);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.factures TO authenticated;
GRANT ALL ON public.factures TO service_role;
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "factures_cabinet" ON public.factures FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

ALTER TABLE public.cotations ADD CONSTRAINT fk_cotations_facture
  FOREIGN KEY (facture_id) REFERENCES public.factures(id) ON DELETE SET NULL;

CREATE TABLE public.lignes_facture (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES public.cabinets(id) ON DELETE CASCADE,
  facture_id UUID NOT NULL REFERENCES public.factures(id) ON DELETE CASCADE,
  cotation_id UUID REFERENCES public.cotations(id) ON DELETE SET NULL,
  date_acte DATE NOT NULL,
  code TEXT NOT NULL,
  libelle TEXT NOT NULL,
  coefficient NUMERIC(6,2) NOT NULL DEFAULT 1,
  taux SMALLINT NOT NULL DEFAULT 100,
  montant NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lignes_facture ON public.lignes_facture(facture_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lignes_facture TO authenticated;
GRANT ALL ON public.lignes_facture TO service_role;
ALTER TABLE public.lignes_facture ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lignes_cabinet" ON public.lignes_facture FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

CREATE TABLE public.paiements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES public.cabinets(id) ON DELETE CASCADE,
  facture_id UUID NOT NULL REFERENCES public.factures(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'amo',
  montant NUMERIC(10,2) NOT NULL,
  date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_paiements_facture ON public.paiements(facture_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paiements TO authenticated;
GRANT ALL ON public.paiements TO service_role;
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "paiements_cabinet" ON public.paiements FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

-- ============================================================
-- Transmissions (append-only)
-- ============================================================
CREATE TABLE public.transmissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES public.cabinets(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  intervention_id UUID REFERENCES public.interventions(id) ON DELETE SET NULL,
  auteur_id UUID REFERENCES public.soignants(id) ON DELETE SET NULL,
  type public.type_transmission NOT NULL DEFAULT 'observation',
  gravite public.gravite NOT NULL DEFAULT 'info',
  texte TEXT,
  audio_path TEXT,
  audio_duree_s SMALLINT,
  transcription TEXT,
  visible_medecin BOOLEAN NOT NULL DEFAULT false,
  lu_par UUID[] NOT NULL DEFAULT '{}',
  corrige_transmission_id UUID REFERENCES public.transmissions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_transmissions_patient ON public.transmissions(patient_id, created_at DESC);
GRANT SELECT, INSERT ON public.transmissions TO authenticated;
GRANT ALL ON public.transmissions TO service_role;
ALTER TABLE public.transmissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transmissions_lecture" ON public.transmissions FOR SELECT TO authenticated
  USING (public.is_cabinet_member(cabinet_id));
CREATE POLICY "transmissions_creation" ON public.transmissions FOR INSERT TO authenticated
  WITH CHECK (public.is_cabinet_member(cabinet_id));

-- ============================================================
-- Tâches, documents, stocks, incidents
-- ============================================================
CREATE TABLE public.taches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES public.cabinets(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  intervention_id UUID REFERENCES public.interventions(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES public.soignants(id) ON DELETE SET NULL,
  titre TEXT NOT NULL,
  description TEXT,
  statut public.statut_tache NOT NULL DEFAULT 'a_faire',
  priorite SMALLINT NOT NULL DEFAULT 2,
  echeance TIMESTAMPTZ,
  rappel_le TIMESTAMPTZ,
  recurrence TEXT,
  categorie TEXT,
  fait_le TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_taches_cabinet ON public.taches(cabinet_id, statut, echeance);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.taches TO authenticated;
GRANT ALL ON public.taches TO service_role;
ALTER TABLE public.taches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "taches_cabinet" ON public.taches FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES public.cabinets(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  ordonnance_id UUID REFERENCES public.ordonnances(id) ON DELETE SET NULL,
  intervention_id UUID REFERENCES public.interventions(id) ON DELETE SET NULL,
  type public.type_document NOT NULL DEFAULT 'autre',
  titre TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  taille_octets INTEGER,
  visible_medecin BOOLEAN NOT NULL DEFAULT false,
  ajoute_par UUID REFERENCES public.soignants(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_documents_patient ON public.documents(patient_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents_cabinet" ON public.documents FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

CREATE TABLE public.stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES public.cabinets(id) ON DELETE CASCADE,
  libelle TEXT NOT NULL,
  categorie TEXT,
  quantite INTEGER NOT NULL DEFAULT 0,
  unite TEXT NOT NULL DEFAULT 'unité',
  seuil_alerte INTEGER NOT NULL DEFAULT 0,
  date_peremption DATE,
  fournisseur TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stocks_cabinet ON public.stocks(cabinet_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stocks TO authenticated;
GRANT ALL ON public.stocks TO service_role;
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stocks_cabinet" ON public.stocks FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_id UUID NOT NULL REFERENCES public.cabinets(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  intervention_id UUID REFERENCES public.interventions(id) ON DELETE SET NULL,
  declare_par UUID REFERENCES public.soignants(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  gravite public.gravite NOT NULL DEFAULT 'attention',
  description TEXT NOT NULL,
  actions TEXT,
  survenu_le TIMESTAMPTZ NOT NULL DEFAULT now(),
  clos BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_incidents_cabinet ON public.incidents(cabinet_id, survenu_le DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incidents TO authenticated;
GRANT ALL ON public.incidents TO service_role;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "incidents_cabinet" ON public.incidents FOR ALL TO authenticated
  USING (public.is_cabinet_member(cabinet_id)) WITH CHECK (public.is_cabinet_member(cabinet_id));

-- ============================================================
-- Triggers updated_at
-- ============================================================
CREATE TRIGGER trg_partage_updated BEFORE UPDATE ON public.partage_jours FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.plans_de_soins FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_tournees_updated BEFORE UPDATE ON public.tournees FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_interventions_updated BEFORE UPDATE ON public.interventions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cotations_updated BEFORE UPDATE ON public.cotations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_factures_updated BEFORE UPDATE ON public.factures FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_taches_updated BEFORE UPDATE ON public.taches FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_stocks_updated BEFORE UPDATE ON public.stocks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_incidents_updated BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();