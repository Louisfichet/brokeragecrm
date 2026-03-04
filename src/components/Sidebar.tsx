"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Building2, Settings, LogOut, Home, Calendar, FileText } from "lucide-react";

const navigation = [
  { name: "Biens", href: "/biens", icon: Home },
  { name: "Sociétés & Contacts", href: "/societes", icon: Building2 },
  { name: "Calendrier", href: "/calendrier", icon: Calendar },
  { name: "Documents", href: "/documents", icon: FileText },
];

const adminNavigation = [
  { name: "Paramètres", href: "/parametres/utilisateurs", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-[var(--sidebar-width)] bg-navy-950 text-white z-40">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">
              CRM Broker
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-primary-500/20 text-primary-300"
                    : "text-navy-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}

          {session?.user?.role === "ADMIN" && (
            <>
              <div className="pt-4 pb-2">
                <div className="h-px bg-white/10" />
              </div>
              {adminNavigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-primary-500/20 text-primary-300"
                        : "text-navy-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-navy-400 truncate">
                {session?.user?.role === "ADMIN" ? "Administrateur" : "Freelance"}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-lg text-navy-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Bottom nav mobile */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-navy-950 border-t border-white/10 z-40 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  active ? "text-primary-400" : "text-navy-400 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="truncate max-w-[80px]">{item.name}</span>
              </Link>
            );
          })}
          {session?.user?.role === "ADMIN" && (
            <Link
              href="/parametres/utilisateurs"
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive("/parametres") ? "text-primary-400" : "text-navy-400 hover:text-white"
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Paramètres</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
