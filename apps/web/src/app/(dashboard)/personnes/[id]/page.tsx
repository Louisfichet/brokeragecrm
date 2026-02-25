export default function PersonneDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Fiche contact {params.id}</h1>
      <div className="card">
        <p className="text-sm text-white/30">
          Le détail du contact sera affiché ici.
        </p>
      </div>
    </div>
  );
}
