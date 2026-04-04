"use client";
// src/components/ChangelogModal.tsx

const INK = "#111111";
const SL  = "#888888";
const BD  = "#EBEBEB";
const W   = "#ffffff";
const LT  = "#F5F5F5";

type Tag = "nuovo" | "migliorato" | "fix";

interface ChangeItem {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  desc: string;
  tag: Tag;
}

interface Version {
  version: string;
  date: string;
  changes: ChangeItem[];
}

const TAG_META: Record<Tag, { label: string; bg: string; color: string }> = {
  nuovo:      { label: "Nuovo",      bg: "#E1F5EE", color: "#0F6E56" },
  migliorato: { label: "Migliorato", bg: "#FAEEDA", color: "#854F0B" },
  fix:        { label: "Fix",        bg: "#E6F1FB", color: "#185FA5" },
};

const VERSIONS: Version[] = [
  {
    version: "1.2.0",
    date: "4 Aprile 2026",
    changes: [
      {
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
        iconBg: "#E1F5EE",
        title: "Vendita bundle dal magazzino",
        desc: "Seleziona più articoli dal magazzino e vendili in un'unica transazione, con prezzo individuale per ogni pezzo.",
        tag: "nuovo",
      },
      {
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
        iconBg: "#f0fad0",
        title: "Classifiche prodotti",
        desc: "Top margine assoluto, top margine % e venduti più velocemente. Si aggiornano per profilo e ruotano automaticamente ogni 8 secondi.",
        tag: "nuovo",
      },
      {
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
        iconBg: "#E6F1FB",
        title: "Ticket medio vendita/acquisto",
        desc: "Nuova card con prezzo medio di vendita e acquisto, min/max e barra di posizionamento.",
        tag: "nuovo",
      },
      {
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
        iconBg: "#FAEEDA",
        title: "Nuovo layout dashboard",
        desc: "Cash flow spostata nella colonna destra. Layout a 3 colonne ottimizzato e completamente responsive.",
        tag: "migliorato",
      },
      {
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
        iconBg: "#E6F1FB",
        title: "Magazzino semplificato",
        desc: "Rimossi i tab Sospeso/Venduti/Tutti — il magazzino mostra solo gli articoli disponibili.",
        tag: "migliorato",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "Marzo 2026",
    changes: [
      {
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
        iconBg: "#E1F5EE",
        title: "Gestione profili multipli",
        desc: "Filtra tutta la dashboard per profilo Vinted con un solo click.",
        tag: "nuovo",
      },
      {
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
        iconBg: "#FAEEDA",
        title: "Grafici vendite per periodo",
        desc: "Visualizza le vendite per settimana, mese o anno con navigazione temporale.",
        tag: "nuovo",
      },
    ],
  },
];

export default function ChangelogModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <style>{`
        .cl-overlay {
          position: fixed; inset: 0; z-index: 400;
          background: rgba(0,0,0,.40); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .cl-modal {
          background: ${W}; border-radius: 24px;
          width: 100%; max-width: 480px;
          max-height: 88vh; display: flex; flex-direction: column;
          box-shadow: 0 32px 80px rgba(0,0,0,.20);
          overflow: hidden; animation: clSlideUp .35s cubic-bezier(.22,.68,0,1.2);
        }
        @keyframes clSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .cl-header { padding: 24px 24px 0; flex-shrink: 0; }
        .cl-badge {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 600;
          background: #f0fad0; color: #3B6D11;
          padding: 4px 10px; border-radius: 999px; margin-bottom: 12px;
        }
        .cl-title { font-size: 20px; font-weight: 800; color: ${INK}; letter-spacing: -.02em; margin-bottom: 3px; }
        .cl-date  { font-size: 12px; color: ${SL}; margin-bottom: 20px; }
        .cl-divider { height: 0.5px; background: ${BD}; }
        .cl-body { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 6px; }
        .cl-version-label {
          font-size: 10px; font-weight: 700; color: ${SL};
          text-transform: uppercase; letter-spacing: .07em;
          padding: 10px 0 6px;
        }
        .cl-version-label:first-child { padding-top: 0; }
        .cl-item { display: flex; gap: 14px; align-items: flex-start; padding: 10px 0; border-top: 0.5px solid ${BD}; }
        .cl-item:first-of-type { border-top: none; }
        .cl-icon {
          width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .cl-text { flex: 1; min-width: 0; }
        .cl-item-title { font-size: 13px; font-weight: 700; color: ${INK}; margin-bottom: 3px; }
        .cl-item-desc  { font-size: 12px; color: ${SL}; line-height: 1.55; }
        .cl-tag {
          display: inline-block; font-size: 10px; font-weight: 600;
          padding: 2px 8px; border-radius: 999px; margin-top: 6px;
        }
        .cl-footer {
          padding: 16px 24px; border-top: 0.5px solid ${BD};
          display: flex; justify-content: space-between; align-items: center;
          flex-shrink: 0; background: ${W};
        }
        .cl-version-pill {
          font-size: 11px; background: ${LT}; color: ${SL};
          padding: 4px 12px; border-radius: 999px;
        }
        .cl-btn-close {
          padding: 10px 24px; border-radius: 999px;
          border: none; background: ${INK}; color: ${W};
          font-size: 13px; font-weight: 700; cursor: pointer;
          font-family: inherit; transition: opacity .15s;
        }
        .cl-btn-close:hover { opacity: .85; }
      `}</style>

      <div className="cl-overlay" onClick={onClose}>
        <div className="cl-modal" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="cl-header">
            <div className="cl-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Scopri le novità
            </div>
            <div className="cl-title">Aggiornamento v{VERSIONS[0].version}</div>
            <div className="cl-date">{VERSIONS[0].date}</div>
          </div>

          <div className="cl-divider" />

          {/* Body */}
          <div className="cl-body">
            {VERSIONS.map((ver, vi) => (
              <div key={ver.version}>
                {vi > 0 && (
                  <div className="cl-version-label">v{ver.version} — {ver.date}</div>
                )}
                {ver.changes.map((change, ci) => {
                  const tag = TAG_META[change.tag];
                  return (
                    <div key={ci} className="cl-item">
                      <div className="cl-icon" style={{ background: change.iconBg }}>
                        {change.icon}
                      </div>
                      <div className="cl-text">
                        <div className="cl-item-title">{change.title}</div>
                        <div className="cl-item-desc">{change.desc}</div>
                        <span className="cl-tag" style={{ background: tag.bg, color: tag.color }}>
                          {tag.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="cl-footer">
            <span className="cl-version-pill">v{VERSIONS[0].version}</span>
            <button className="cl-btn-close" onClick={onClose}>Chiudi</button>
          </div>

        </div>
      </div>
    </>
  );
}
