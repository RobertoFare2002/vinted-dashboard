"use client";
// src/components/ProfilesCard.tsx
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createProfileFromVinted, deleteProfile } from "@/app/(dashboard)/profiles/actions";
import { Plus, X, Trash2, Loader } from "lucide-react";

const GREEN    = "#007782";
const GREEN_BG = "#f0fad0";
const INK      = "#111111";
const SL       = "#888888";
const BD       = "#EBEBEB";
const LT       = "#F5F5F5";
const W        = "#ffffff";
const RED      = "#FF4D4D";

type Profile = {
  id: string;
  name: string;
  avatar_url?: string | null;
};

type Props = {
  profiles: Profile[];
};

export default function ProfilesCard({ profiles }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("profile") ?? null;

  const [showModal, setShowModal] = useState(false);
  const [vintedUrl, setVintedUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function selectProfile(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedId === id) {
      params.delete("profile"); // deseleziona
    } else {
      params.set("profile", id);
    }
    router.push(`/?${params.toString()}`);
  }

  function openModal() {
    setVintedUrl("");
    setError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setError(null);
    setVintedUrl("");
  }

  function handleCreate() {
    if (!vintedUrl.trim()) {
      setError("Inserisci l'URL del profilo Vinted.");
      return;
    }
    if (!vintedUrl.includes("vinted.")) {
      setError("L'URL non sembra essere un profilo Vinted valido.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await createProfileFromVinted(vintedUrl.trim());
        router.refresh();
        closeModal();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Errore durante la creazione del profilo.");
      }
    });
  }

  function handleDelete(profileId: string, profileName: string) {
    if (!confirm(`Eliminare il profilo "${profileName}"?`)) return;
    startTransition(async () => {
      try {
        await deleteProfile(profileId);
        // Se era selezionato, rimuovi il filtro
        if (selectedId === profileId) {
          const params = new URLSearchParams(searchParams.toString());
          params.delete("profile");
          router.push(`/?${params.toString()}`);
        } else {
          router.refresh();
        }
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : "Errore eliminazione.");
      }
    });
  }

  return (
    <>
      <style>{`
        .pc-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 12px;
          margin-bottom: 4px;
          cursor: pointer;
          transition: background .15s;
          border: 1.5px solid transparent;
        }
        .pc-item:hover { background: ${LT}; }
        .pc-item.selected {
          background: ${GREEN_BG};
          border-color: #6bb800;
        }
        .pc-avatar {
          width: 38px; height: 38px;
          border-radius: 12px;
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid ${BD};
        }
        .pc-avatar-placeholder {
          width: 38px; height: 38px;
          border-radius: 12px;
          background: ${LT};
          border: 1px solid ${BD};
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          font-size: 16px;
        }
        .pc-name {
          font-size: 13px; font-weight: 600; color: ${INK};
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          flex: 1;
        }
        .pc-name.selected { color: #6bb800; }
        .pc-selected-badge {
          font-size: 10px; font-weight: 700;
          color: #6bb800; background: transparent;
          padding: 0; border-radius: 0;
          border: none;
          white-space: nowrap;
          display: inline-flex; align-items: center; gap: 4px;
        }
        .pc-selected-badge::before {
          content: '';
          display: inline-block;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #007782;
          flex-shrink: 0;
        }
        .pc-delete-btn {
          padding: 4px 6px; border-radius: 8px;
          border: 1px solid transparent; background: transparent;
          cursor: pointer; color: ${SL};
          transition: all .15s; display: flex; align-items: center;
          flex-shrink: 0; opacity: 0;
        }
        .pc-item:hover .pc-delete-btn { opacity: 1; }
        .pc-delete-btn:hover { border-color: ${RED}; color: ${RED}; background: #fef2f2; }
        .pc-create-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 999px; border: none;
          background: #007782; color: #ffffff;
          font-size: 12px; font-weight: 600;
          cursor: pointer; font-family: inherit;
          transition: opacity .15s;
        }
        .pc-create-btn:hover { opacity: .85; }
        .pc-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,.45);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; padding: 16px;
        }
        .pc-modal {
          background: ${W}; border-radius: 16px;
          padding: 24px; width: 100%; max-width: 420px;
          box-shadow: 0 20px 60px rgba(0,0,0,.18);
        }
        .pc-modal-title { font-size: 16px; font-weight: 700; color: ${INK}; margin-bottom: 6px; }
        .pc-modal-subtitle { font-size: 12px; color: ${SL}; margin-bottom: 20px; line-height: 1.5; }
        .pc-input {
          width: 100%; padding: 10px 12px; border-radius: 12px;
          border: 1.5px solid ${BD}; font-size: 13px;
          font-family: inherit; color: ${INK}; outline: none;
          background: ${LT}; box-sizing: border-box; transition: border-color .15s;
        }
        .pc-input:focus { border-color: #6bb800; background: ${W}; }
        .pc-modal-actions { display: flex; gap: 8px; margin-top: 16px; }
        .pc-confirm-btn {
          flex: 1; padding: 10px; border-radius: 12px; border: none;
          background: #007782; color: #ffffff; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: inherit;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          transition: opacity .15s;
        }
        .pc-confirm-btn:hover { opacity: .85; }
        .pc-confirm-btn:disabled { opacity: .6; cursor: not-allowed; }
        .pc-cancel-modal-btn {
          padding: 10px 16px; border-radius: 12px;
          border: 1.5px solid ${BD}; background: ${W};
          font-size: 13px; color: ${SL}; cursor: pointer; font-family: inherit;
        }
        .pc-cancel-modal-btn:hover { border-color: ${INK}; color: ${INK}; }
        .pc-error {
          font-size: 11px; color: ${RED}; margin-top: 8px;
          padding: 8px 10px; background: #fef2f2; border-radius: 999px; border: 1px solid #fecaca;
        }
        .pc-empty {
          display: flex; flex-direction: column; align-items: center;
          padding: 24px 16px; gap: 8px; text-align: center;
        }
        @keyframes pc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .pc-spinning { animation: pc-spin 1s linear infinite; }
        .pc-filter-hint {
          font-size: 11px; color: ${SL}; text-align: center;
          padding: 6px 0 2px; opacity: .7;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: SL, fontWeight: 500 }}>
          {profiles.length} {profiles.length === 1 ? "profilo" : "profili"}
          {selectedId && <span style={{ color: "#6bb800", marginLeft: 6 }}>• filtrato</span>}
        </span>
        <button className="pc-create-btn" onClick={openModal}>
          <Plus size={13} /> Crea profilo
        </button>
      </div>

      {/* Lista profili o stato vuoto */}
      {profiles.length === 0 ? (
        <div className="pc-empty">
          <div style={{ fontSize: 22 }}>👤</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>Nessun profilo</div>
          <div style={{ fontSize: 12, color: SL, maxWidth: 200 }}>
            Crea il tuo primo profilo Vinted per iniziare a tracciare le vendite.
          </div>
        </div>
      ) : (
        <>
          {profiles.map(p => {
            const isSelected = selectedId === p.id;
            return (
              <div
                key={p.id}
                className={`pc-item${isSelected ? " selected" : ""}`}
                onClick={() => selectProfile(p.id)}
              >
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.name} className="pc-avatar" />
                ) : (
                  <div className="pc-avatar-placeholder">👤</div>
                )}
                <span className={`pc-name${isSelected ? " selected" : ""}`}>{p.name}</span>
                {isSelected && <span className="pc-selected-badge">attivo</span>}
                <button
                  className="pc-delete-btn"
                  onClick={e => { e.stopPropagation(); handleDelete(p.id, p.name); }}
                  disabled={isPending}
                  title="Elimina profilo"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
          <div className="pc-filter-hint">
            {selectedId ? "Clicca di nuovo per rimuovere il filtro" : "Clicca un profilo per filtrare la dashboard"}
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="pc-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="pc-modal">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div className="pc-modal-title">Crea profilo Vinted</div>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: SL, padding: 2 }}>
                <X size={16} />
              </button>
            </div>
            <div className="pc-modal-subtitle">
              Incolla l'URL del profilo Vinted. Recupereremo automaticamente foto profilo e nome utente.
            </div>
            <input
              className="pc-input"
              value={vintedUrl}
              onChange={e => setVintedUrl(e.target.value)}
              placeholder="https://www.vinted.it/member/12345-username"
              autoFocus
              onKeyDown={e => { if (e.key === "Enter") handleCreate(); }}
              disabled={isPending}
            />
            {error && <div className="pc-error">⚠️ {error}</div>}
            <div className="pc-modal-actions">
              <button className="pc-cancel-modal-btn" onClick={closeModal} disabled={isPending}>Annulla</button>
              <button className="pc-confirm-btn" onClick={handleCreate} disabled={isPending}>
                {isPending ? <><Loader size={13} className="pc-spinning" /> Importazione...</> : <><Plus size={13} /> Crea profilo</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
