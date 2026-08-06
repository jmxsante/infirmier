import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  LogOut,
  Receipt,
  Route as RouteIcon,
  Stethoscope,
  UserRoundSearch,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/tournee", label: "Tournée", icon: RouteIcon },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/actes", label: "Actes & cotation", icon: Stethoscope },
  { to: "/facturation", label: "Facturation", icon: Receipt },
  { to: "/prescripteurs", label: "Prescripteurs", icon: UserRoundSearch },
];


export function AppShell({
  titre,
  sousTitre,
  action,
  children,
}: {
  titre: string;
  sousTitre?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function seDeconnecter() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-28 pt-6 md:flex-row md:gap-8 md:pb-10">
        <aside className="hidden w-52 shrink-0 md:block">
          <Link to="/tournee" className="flex items-center gap-2 px-2">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <CalendarClock className="size-5" />
            </span>
            <span className="font-display text-lg font-semibold">Cabinet</span>
          </Link>
          <nav className="mt-8 space-y-1">
            {NAV.map((item) => {
              const actif = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    actif
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={seDeconnecter}
            className="mt-8 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4" />
            Se déconnecter
          </button>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-semibold">{titre}</h1>
              {sousTitre ? (
                <p className="mt-1 text-sm text-muted-foreground">{sousTitre}</p>
              ) : null}
            </div>
            {action}
          </header>
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <div className="flex items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
          {NAV.map((item) => {
            const actif = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                  actif ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
