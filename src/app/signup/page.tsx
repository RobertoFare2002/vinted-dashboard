"use client";
// src/app/signup/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Le password non coincidono."); return; }
    if (password.length < 6)  { setError("La password deve essere di almeno 6 caratteri."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
    }
  }

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 10, color: "rgba(255,255,255,.92)",
    fontSize: 14, outline: "none", boxSizing: "border-box" as const
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(900px 600px at 50% 0%, rgba(22,194,163,.12), transparent 60%), #0b0b0d"
    }}>
      <div style={{
        width: "100%", maxWidth: 380,
        background: "rgba(18,18,22,.9)",
        border: "1px solid rgba(255,255,255,.10)",
        borderRadius: 16, padding: 28,
        backdropFilter: "blur(12px)"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "linear-gradient(135deg,rgba(22,194,163,.3),rgba(22,194,163,.08))",
            border: "1px solid rgba(22,194,163,.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px", fontSize: 22
          }}>🏪</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "rgba(255,255,255,.92)" }}>
            Crea il tuo account
          </h1>
          <p style={{ color: "rgba(255,255,255,.55)", fontSize: 13, marginTop: 6 }}>
            Inizia a gestire il tuo magazzino Vinted
          </p>
        </div>

        {done ? (
          <div style={{
            padding: "16px", borderRadius: 12,
            background: "rgba(22,194,163,.12)",
            border: "1px solid rgba(22,194,163,.3)",
            color: "#16c2a3", fontSize: 14, textAlign: "center", lineHeight: 1.6
          }}>
            ✅ Account creato!<br/>
            <span style={{ color: "rgba(255,255,255,.55)", fontSize: 12 }}>
              Controlla la tua email per confermare l&apos;account, poi accedi.
            </span>
            <div style={{ marginTop: 16 }}>
              <Link href="/login" style={{ color: "#16c2a3", fontSize: 13, fontWeight: 600 }}>
                Vai al login →
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,.55)", display: "block", marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,.55)", display: "block", marginBottom: 6 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,.55)", display: "block", marginBottom: 6 }}>Conferma password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required style={inputStyle} />
            </div>

            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(255,77,109,.12)", border: "1px solid rgba(255,77,109,.3)",
                color: "#ff4d6d", fontSize: 13
              }}>{error}</div>
            )}

            <button type="submit" disabled={loading} style={{
              padding: "12px", borderRadius: 12, border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              background: "linear-gradient(135deg, rgba(22,194,163,.95), rgba(22,194,163,.65))",
              color: "#06110f", fontWeight: 700, fontSize: 14,
              opacity: loading ? 0.7 : 1, marginTop: 4
            }}>
              {loading ? "Creazione account…" : "Crea account"}
            </button>

            <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,.4)", marginTop: 4 }}>
              Hai già un account?{" "}
              <Link href="/login" style={{ color: "#16c2a3", fontWeight: 600 }}>Accedi</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
