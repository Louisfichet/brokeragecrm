export default function BiensPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Biens</h1>
          <p className="mt-1 text-sm text-white/50">
            Gérez votre portefeuille de biens immobiliers
          </p>
        </div>
        <button className="btn-primary">+ Nouveau bien</button>
      </div>

      <div className="card">
        <p className="text-sm text-white/30">
          La liste des biens sera affichée ici.
        </p>
      </div>
    </div>
  );
}
