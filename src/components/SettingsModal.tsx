"use client";
// src/components/SettingsModal.tsx
import { useState, useRef, useTransition, useEffect } from "react";
import { Camera, X, Loader, Check, User, Mail, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Props = {
  userEmail: string;
  onClose: () => void;
};

export default function SettingsModal({ userEmail, onClose }: Props) {
  const router   = useRouter();
  const supabase = createClient();

  const [activeTab,     setActiveTab]     = useState<"profile"|"email"|"password">("profile");
  const [displayName,   setDisplayName]   = useState(userEmail.split("@")[0] || "");
  const [avatarUrl,     setAvatarUrl]     = useState<string | null>(null);
  const [avatarFile,    setAvatarFile]    = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [newEmail,      setNewEmail]      = useState("");
  const [newPass,       setNewPass]       = useState("");
  const [confirmPass,   setConfirmPass]   = useState("");
  const [isPending,     startTransition]  = useTransition();
  const [success,       setSuccess]       = useState("");
  const [error,         setError]         = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = userEmail ? userEmail.charAt(0).toUpperCase() : "U";

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.display_name) setDisplayName(user.user_metadata.display_name);
      if (user?.user_metadata?.avatar_url)   setAvatarUrl(user.user_metadata.avatar_url);
    });
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleSaveProfile() {
    setError(""); setSuccess("");
    startTransition(async () => {
      try {
        let finalAvatarUrl = avatarUrl;
        if (avatarFile) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Non autenticato");
          const ext  = avatarFile.name.split(".").pop() || "jpg";
          const path = `user-avatars/${user.id}/avatar.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("profile-avatars")
            .upload(path, avatarFile, { upsert: true });
          if (upErr) throw new Error(upErr.message);
          const { data: urlData } = supabase.storage.from("profile-avatars").getPublicUrl(path);
          finalAvatarUrl = urlData.publicUrl + `?t=${Date.now()}`;
          setAvatarUrl(finalAvatarUrl);
          setAvatarPreview(null);
          setAvatarFile(null);
        }
        const { error: metaErr } = await supabase.auth.updateUser({
          data: { display_name: displayName.trim() || userEmail.split("@")[0], avatar_url: finalAvatarUrl },
        });
        if (metaErr) throw new Error(metaErr.message);
        setSuccess("Profilo aggiornato!");
        router.refresh();
      } catch (e: unknown) { setError(e instanceof Error ? e.message : "Errore sconosciuto"); }
    });
  }

  function handleSaveEmail() {
    setError(""); setSuccess("");
    if (!newEmail.trim() || !newEmail.includes("@")) { setError("Inserisci un indirizzo email valido."); return; }
    startTransition(async () => {
      try {
        const { error: e } = await supabase.auth.updateUser({ email: newEmail.trim() });
        if (e) throw new Error(e.message);
        setSuccess("Email aggiornata! Controlla la tua casella per confermare.");
        setNewEmail("");
      } catch (e: unknown) { setError(e instanceof Error ? e.message : "Errore sconosciuto"); }
    });
  }

  function handleSavePassword() {
    setError(""); setSuccess("");
    if (newPass.length < 6) { setError("La password deve essere di almeno 6 caratteri."); return; }
    if (newPass !== confirmPass) { setError("Le password non coincidono."); return; }
    startTransition(async () => {
      try {
        const { error: e } = await supabase.auth.updateUser({ password: newPass });
        if (e) throw new Error(e.message);
        setSuccess("Password aggiornata!");
        setNewPass(""); setConfirmPass("");
      } catch (e: unknown) { setError(e instanceof Error ? e.message : "Errore sconosciuto"); }
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 13px",
    background: "#F5F5F5", border: "1px solid #EBEBEB",
    borderRadius: 12, color: "#111111", fontSize: 13,
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600,
    textTransform: "uppercase", letterSpacing: ".05em",
    color: "#888888", display: "block", marginBottom: 5,
  };

  return (
    <>
      <style>{`
        .sm-overlay {
          position: fixed; inset: 0; z-index: 99999;
          background: rgba(0,0,0,.45); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center; padding: 16px;
        }
        .sm-modal {
          background: #ffffff; border-radius: 20px;
          width: 100%; max-width: 460px; max-height: 90vh;
          box-shadow: 0 24px 60px rgba(0,0,0,.18);
          overflow: hidden; display: flex; flex-direction: column;
        }
        .sm-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px 0; flex-shrink: 0;
        }
        .sm-tabs {
          display: flex; gap: 4px; padding: 16px 24px 0;
          border-bottom: 1px solid #EBEBEB; flex-shrink: 0;
        }
        .sm-tab {
          padding: 8px 14px; border-radius: 999px 999px 0 0;
          font-size: 12px; font-weight: 600; cursor: pointer;
          border: none; background: transparent; font-family: inherit;
          color: #888888; transition: color .15s; border-bottom: 2px solid transparent;
          margin-bottom: -1px;
        }
        .sm-tab:hover { color: #111111; }
        .sm-tab.active { color: #111111; border-bottom-color: #111111; }
        .sm-body { padding: 24px; overflow-y: auto; flex: 1; }
        .sm-avatar-upload { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
        .sm-avatar-big {
          width: 64px; height: 64px; border-radius: 50%;
          background: #007782; display: flex; align-items: center; justify-content: center;
          font-size: 24px; font-weight: 700; color: #ffffff;
          border: 2px solid rgba(0,0,0,.08); overflow: hidden; flex-shrink: 0;
          position: relative; cursor: pointer;
        }
        .sm-avatar-big img { width: 100%; height: 100%; object-fit: cover; }
        .sm-avatar-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,.45);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity .15s; border-radius: 50%;
        }
        .sm-avatar-big:hover .sm-avatar-overlay { opacity: 1; }
        @keyframes sm-spin { to { transform: rotate(360deg); } }
        .sm-spin { animation: sm-spin 1s linear infinite; }
      `}</style>

      <div className="sm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="sm-modal" onClick={e => e.stopPropagation()}>

          <div className="sm-header">
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#111111", letterSpacing: "-.02em" }}>Impostazioni account</div>
              <div style={{ fontSize: 12, color: "#888888", marginTop: 2 }}>{userEmail}</div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: "none", background: "#F5F5F5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#888888" }}>
              <X size={15} />
            </button>
          </div>

          <div className="sm-tabs">
            {(["profile", "email", "password"] as const).map(key => (
              <button key={key} className={`sm-tab ${activeTab === key ? "active" : ""}`} onClick={() => { setActiveTab(key); setError(""); setSuccess(""); }}>
                {key === "profile" ? "Profilo" : key === "email" ? "Email" : "Password"}
              </button>
            ))}
          </div>

          <div className="sm-body">
            {activeTab === "profile" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="sm-avatar-upload">
                  <div className="sm-avatar-big" onClick={() => fileRef.current?.click()}>
                    {(avatarPreview || avatarUrl)
                      ? <img src={avatarPreview || avatarUrl!} alt="" />
                      : <span style={{ fontSize: 24 }}>{initials}</span>}
                    <div className="sm-avatar-overlay"><Camera size={18} color="#fff" /></div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111111", marginBottom: 4 }}>Foto profilo</div>
                    <button onClick={() => fileRef.current?.click()} style={{ fontSize: 12, color: "#888888", border: "1px solid #EBEBEB", background: "#fff", borderRadius: 999, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                      Cambia foto
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Nome visualizzato</label>
                  <input style={inputStyle} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={userEmail.split("@")[0]} />
                </div>
                {error   && <div style={{ fontSize: 12, color: "#FF4D4D", background: "rgba(255,77,77,.07)", padding: "9px 12px", borderRadius: 10 }}>⚠ {error}</div>}
                {success && <div style={{ fontSize: 12, color: "#6bb800", background: "#f0fad0", padding: "9px 12px", borderRadius: 10, display: "flex", alignItems: "center", gap: 6 }}><Check size={13} /> {success}</div>}
                <button onClick={handleSaveProfile} disabled={isPending} style={{ padding: "11px", borderRadius: 999, border: "none", background: "#007782", color: "#fff", fontWeight: 700, fontSize: 13, cursor: isPending ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: isPending ? .7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {isPending ? <><Loader size={13} className="sm-spin" /> Salvataggio…</> : "Salva modifiche"}
                </button>
              </div>
            )}

            {activeTab === "email" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ fontSize: 13, color: "#888888", background: "#F5F5F5", borderRadius: 12, padding: "10px 14px" }}>
                  Email attuale: <strong style={{ color: "#111111" }}>{userEmail}</strong>
                </div>
                <div>
                  <label style={labelStyle}>Nuova email</label>
                  <input style={inputStyle} type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="nuova@email.com" />
                </div>
                <div style={{ fontSize: 11, color: "#888888" }}>Ti verrà inviata una email di conferma al nuovo indirizzo.</div>
                {error   && <div style={{ fontSize: 12, color: "#FF4D4D", background: "rgba(255,77,77,.07)", padding: "9px 12px", borderRadius: 10 }}>⚠ {error}</div>}
                {success && <div style={{ fontSize: 12, color: "#6bb800", background: "#f0fad0", padding: "9px 12px", borderRadius: 10, display: "flex", alignItems: "center", gap: 6 }}><Check size={13} /> {success}</div>}
                <button onClick={handleSaveEmail} disabled={isPending} style={{ padding: "11px", borderRadius: 999, border: "none", background: "#007782", color: "#fff", fontWeight: 700, fontSize: 13, cursor: isPending ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: isPending ? .7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {isPending ? <><Loader size={13} className="sm-spin" /> Salvataggio…</> : "Aggiorna email"}
                </button>
              </div>
            )}

            {activeTab === "password" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Nuova password</label>
                  <input style={inputStyle} type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="••••••••" />
                </div>
                <div>
                  <label style={labelStyle}>Conferma password</label>
                  <input style={inputStyle} type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="••••••••" />
                </div>
                {error   && <div style={{ fontSize: 12, color: "#FF4D4D", background: "rgba(255,77,77,.07)", padding: "9px 12px", borderRadius: 10 }}>⚠ {error}</div>}
                {success && <div style={{ fontSize: 12, color: "#6bb800", background: "#f0fad0", padding: "9px 12px", borderRadius: 10, display: "flex", alignItems: "center", gap: 6 }}><Check size={13} /> {success}</div>}
                <button onClick={handleSavePassword} disabled={isPending} style={{ padding: "11px", borderRadius: 999, border: "none", background: "#007782", color: "#fff", fontWeight: 700, fontSize: 13, cursor: isPending ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: isPending ? .7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {isPending ? <><Loader size={13} className="sm-spin" /> Salvataggio…</> : "Cambia password"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
