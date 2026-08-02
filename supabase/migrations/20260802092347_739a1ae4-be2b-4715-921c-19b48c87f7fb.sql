CREATE OR REPLACE FUNCTION public.mon_profil()
RETURNS public.soignants
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.soignants;
  v_email text;
  v_meta jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;

  SELECT * INTO v_row FROM public.soignants WHERE user_id = v_uid;
  IF FOUND THEN
    RETURN v_row;
  END IF;

  SELECT email, raw_user_meta_data INTO v_email, v_meta FROM auth.users WHERE id = v_uid;

  INSERT INTO public.soignants (user_id, nom, prenom, email)
  VALUES (
    v_uid,
    COALESCE(NULLIF(v_meta ->> 'nom', ''), 'Soignant'),
    COALESCE(NULLIF(v_meta ->> 'prenom', ''), ''),
    v_email
  )
  ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.mon_profil() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mon_profil() TO authenticated;

CREATE OR REPLACE FUNCTION public.creer_cabinet(
  p_nom text,
  p_ville text DEFAULT NULL,
  p_code_postal text DEFAULT NULL,
  p_adresse_ligne1 text DEFAULT NULL,
  p_telephone text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_soignant public.soignants;
  v_cabinet_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;
  IF coalesce(trim(p_nom), '') = '' THEN
    RAISE EXCEPTION 'Le nom du cabinet est obligatoire';
  END IF;

  v_soignant := public.mon_profil();

  IF v_soignant.cabinet_id IS NOT NULL THEN
    RAISE EXCEPTION 'Ce soignant est déjà rattaché à un cabinet';
  END IF;

  INSERT INTO public.cabinets (nom, ville, code_postal, adresse_ligne1, telephone)
  VALUES (trim(p_nom), p_ville, p_code_postal, p_adresse_ligne1, p_telephone)
  RETURNING id INTO v_cabinet_id;

  UPDATE public.soignants SET cabinet_id = v_cabinet_id, updated_at = now() WHERE user_id = v_uid;

  INSERT INTO public.soignant_roles (user_id, role)
  VALUES (v_uid, 'titulaire')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN v_cabinet_id;
END;
$$;

REVOKE ALL ON FUNCTION public.creer_cabinet(text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.creer_cabinet(text, text, text, text, text) TO authenticated;