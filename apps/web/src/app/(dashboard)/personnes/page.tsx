export default function PersonnesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Personnes & Sociétés</h1>
          <p className="mt-1 text-sm text-white/50">
            Gérez vos contacts et sociétés
          </p>
        </div>
        <button className="btn-primary">+ Nouveau contact</button>
      </div>

      <div className="card">
        <p className="text-sm text-white/30">
          La liste des contacts sera affichée ici.
        </p>
      </div>
    </div>
  );
}
