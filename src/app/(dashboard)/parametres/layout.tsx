"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Building2, ScrollText } from "lucide-react";

const tabs = [
  { name: "Utilisateurs", href: "/parametres/utilisateurs", icon: Users },
  { name: "Société", href: "/parametres/societe", icon: Building2 },
  { name: "Logs", href: "/parametres/logs", icon: ScrollText },
];

export default function ParametresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div>
      {/* Tabs navigation */}
      <div className="flex items-center gap-1 mb-6 border-b border-navy-100 pb-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                active
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-navy-500 hover:text-navy-700 hover:border-navy-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
