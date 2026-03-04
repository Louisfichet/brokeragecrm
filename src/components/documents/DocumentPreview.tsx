"use client";

interface PreviewSection {
  type: "title" | "subtitle" | "text" | "bold" | "article" | "list" | "space" | "separator" | "signature";
  content?: string;
  items?: string[];
  size?: number;
}

interface DocumentPreviewProps {
  sections: PreviewSection[];
  companyName?: string;
}

export default function DocumentPreview({ sections, companyName = "PARKTO" }: DocumentPreviewProps) {
  return (
    <div className="bg-white border border-navy-200 rounded-xl shadow-sm mx-auto" style={{ maxWidth: 680 }}>
      {/* Header mimant le PDF */}
      <div className="px-8 pt-6 pb-3 border-b border-navy-800">
        <div className="flex items-center justify-between">
          <div className="w-16 h-6 bg-navy-100 rounded text-[6px] text-navy-400 flex items-center justify-center">
            LOGO
          </div>
          <div className="text-right">
            <p className="text-[10px] text-navy-400 uppercase tracking-wide">{companyName}</p>
          </div>
        </div>
      </div>

      {/* Document body */}
      <div className="px-8 py-6 space-y-0">
        {sections.map((section, i) => {
          switch (section.type) {
            case "title":
              return (
                <div key={i} className="py-2 text-center">
                  <h1 className="text-[15px] font-bold text-navy-900 leading-snug">
                    {section.content}
                  </h1>
                  <div className="mx-auto mt-1.5 w-24 h-[1px] bg-navy-800" />
                </div>
              );

            case "subtitle":
              return (
                <p key={i} className="text-[12px] italic text-navy-500 text-center py-1.5">
                  {section.content}
                </p>
              );

            case "text":
              return (
                <p
                  key={i}
                  className="text-[11px] text-navy-800 leading-relaxed text-justify py-0.5"
                  style={{ fontSize: section.size ? `${section.size + 2}px` : undefined }}
                >
                  {section.content}
                </p>
              );

            case "bold":
              return (
                <p
                  key={i}
                  className="text-[11px] font-semibold text-navy-900 leading-relaxed text-justify py-0.5"
                  style={{ fontSize: section.size ? `${section.size + 2}px` : undefined }}
                >
                  {section.content}
                </p>
              );

            case "article":
              return (
                <div key={i} className="mt-3 mb-1">
                  <div className="bg-navy-50 rounded px-2 py-1">
                    <h3 className="text-[11.5px] font-bold text-navy-900">
                      {section.content}
                    </h3>
                  </div>
                </div>
              );

            case "list":
              return (
                <ul key={i} className="py-0.5 space-y-0.5 pl-3">
                  {section.items?.map((item, j) => (
                    <li key={j} className="text-[11px] text-navy-800 leading-relaxed">
                      —&nbsp;&nbsp;{item}
                    </li>
                  ))}
                </ul>
              );

            case "space":
              return (
                <div
                  key={i}
                  style={{ height: `${(section.size || 0.5) * 16}px` }}
                />
              );

            case "separator":
              return (
                <hr key={i} className="my-3 border-navy-200" />
              );

            case "signature":
              return (
                <div key={i} className="mt-6 pt-4 grid grid-cols-2 gap-8">
                  {/* Contrepartie */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-navy-900">Pour la contrepartie</p>
                    <p className="text-[10px] text-navy-600">Lu et approuvé — Bon pour accord</p>
                    <p className="text-[10px] text-navy-600">Date : __ / __ / ______</p>
                    <p className="text-[10px] text-navy-600">Signature :</p>
                    <div className="h-12 border border-dashed border-navy-200 rounded mt-1" />
                  </div>
                  {/* Société */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-navy-900">Pour {companyName}</p>
                    <p className="text-[10px] text-navy-600">Représentant légal</p>
                    <p className="text-[10px] text-navy-600">
                      Fait à Paris, le {new Date().toLocaleDateString("fr-FR")}
                    </p>
                    <div className="h-12 bg-navy-50 rounded mt-1 flex items-center justify-center">
                      <span className="text-[8px] text-navy-400 italic">Signature + Tampon</span>
                    </div>
                  </div>
                </div>
              );

            default:
              return null;
          }
        })}
      </div>

      {/* Footer mimant le PDF */}
      <div className="px-8 py-3 border-t border-navy-200 flex items-center justify-between">
        <p className="text-[8px] text-navy-400">{companyName} — Document confidentiel</p>
        <p className="text-[8px] text-navy-400">Aperçu</p>
      </div>
    </div>
  );
}
