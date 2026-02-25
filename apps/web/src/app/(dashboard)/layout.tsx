import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-950">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-800/10 via-brand-950 to-brand-950" />

      <Sidebar />

      {/* Main content */}
      <main className="relative ml-sidebar min-h-screen p-6 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
