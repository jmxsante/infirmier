import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { profilQueryOptions } from "@/lib/api";

/** Charge le profil du soignant connecté et redirige vers l'onboarding si aucun cabinet. */
export function useCabinet() {
  const navigate = useNavigate();
  const { data: profil, isLoading, error } = useQuery(profilQueryOptions);

  useEffect(() => {
    if (!isLoading && profil && !profil.cabinet_id) {
      navigate({ to: "/bienvenue", replace: true });
    }
  }, [isLoading, profil, navigate]);

  return { profil, cabinetId: profil?.cabinet_id ?? null, isLoading, error };
}
