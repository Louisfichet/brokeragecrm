export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
        <p className="mt-1 text-sm text-white/50">
          Vue d&apos;ensemble de votre activité
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Biens actifs", value: "—", color: "brand-400" },
          { label: "En négociation", value: "—", color: "amber-400" },
          { label: "Deals signés", value: "—", color: "emerald-400" },
          { label: "Matchs en attente", value: "—", color: "violet-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="card">
            <p className="text-sm text-white/50">{kpi.label}</p>
            <p className={`mt-2 text-3xl font-bold text-${kpi.color}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Pipeline + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold text-white">Pipeline</h2>
          <p className="mt-4 text-sm text-white/30">
            Le pipeline sera affiché ici une fois les biens créés.
          </p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white">
            Activité récente
          </h2>
          <p className="mt-4 text-sm text-white/30">
            Les dernières actions apparaîtront ici.
          </p>
        </div>
      </div>
    </div>
  );
}
