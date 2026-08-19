"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trees, Users, Plus, Bell, Ellipsis } from "lucide-react";
import { cn } from "@/lib/utils";

const ONGLETS = [
  { href: "/tableau", label: "Arbre", Icon: Trees, central: false },
  { href: "/famille", label: "Famille", Icon: Users, central: false },
  { href: "/tableau/declarer", label: "Déclarer", Icon: Plus, central: true },
  { href: "/activites", label: "Activités", Icon: Bell, central: false },
  { href: "/plus", label: "Plus", Icon: Ellipsis, central: false },
];

export default function NavigationBas({ dansFlux = false }: { dansFlux?: boolean }) {
  const chemin = usePathname();

  return (
    <nav
      className={cn(
        "z-50 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.08)] md:hidden",
        dansFlux ? "relative" : "fixed inset-x-0 bottom-0"
      )}
    >
      <div className="grid grid-cols-5">
        {ONGLETS.map(({ href, label, Icon, central }) => {
          const actif = central
            ? chemin === href
            : chemin === href || chemin.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition",
                central ? "-mt-4" : "py-2.5",
                actif ? "text-emerald-700" : "text-neutral-500"
              )}
              aria-current={actif ? "page" : undefined}
            >
              {central ? (
                <span
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full border-4 border-neutral-100 shadow-md transition",
                    actif ? "bg-emerald-600" : "bg-emerald-700"
                  )}
                >
                  <Icon className="h-7 w-7 text-white" aria-hidden />
                </span>
              ) : (
                <Icon className="h-6 w-6" aria-hidden />
              )}
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}