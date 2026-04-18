// src/components/FeedClient.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleLike, deleteFeedPost } from "@/app/(dashboard)/feed/actions";
import dynamic from "next/dynamic";

const CreatePostModal = dynamic(() => import("@/components/CreatePostModal"), { ssr: false });

export type FeedPost = {
  id:             string;
  user_id:        string;
  author_name:    string | null;
  author_avatar:  string | null;
  sale_name:      string | null;
  sale_amount:    number | null;
  sale_cost:      number | null;
  sale_platform:  string | null;
  photo_url:      string | null;
  caption:        string | null;
  created_at:     string;
  likeCount:      number;
  likedByMe:      boolean;
  // legacy
  user_profiles?: { display_name: string | null; avatar_url: string | null } | null;
};

type Props = {
  initialPosts:  FeedPost[];
  currentUserId: string;
};

// ── helpers ───────────────────────────────────────────────────────────────────

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return "adesso";
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}g`;
  return new Date(date).toLocaleDateString("it", { day: "numeric", month: "short" });
}

function fmt(n: number) {
  return n.toLocaleString("it", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getAuthorName(post: FeedPost) {
  return post.author_name
    || post.user_profiles?.display_name
    || "Utente";
}

function getAuthorAvatar(post: FeedPost) {
  return post.author_avatar || post.user_profiles?.avatar_url || null;
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, avatarUrl, size = 32 }: { name: string; avatarUrl: string | null; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg,#007782,#00a896)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 800, color: "#fff",
      flexShrink: 0, overflow: "hidden",
    }}>
      {avatarUrl
        ? <img src={avatarUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Heart icon ────────────────────────────────────────────────────────────────

function HeartIcon({ filled, size = 24 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? "#ed4956" : "none"}
      stroke={filled ? "#ed4956" : "var(--slate)"}
      strokeWidth={filled ? 0 : 1.8}
      style={{ transition: "all .15s", transform: filled ? "scale(1.1)" : "scale(1)" }}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

// ── Post card ─────────────────────────────────────────────────────────────────

function PostCard({
  post, isOwn, isLiking,
  onLike, onDelete,
}: {
  post: FeedPost;
  isOwn: boolean;
  isLiking: boolean;
  onLike: () => void;
  onDelete: () => void;
}) {
  const name   = getAuthorName(post);
  const avatar = getAuthorAvatar(post);
  const amount = Number(post.sale_amount ?? 0);
  const cost   = Number(post.sale_cost   ?? 0);
  const profit = amount - cost;
  const margin = cost > 0 ? Math.round((profit / cost) * 100) : null;
  const [imgError, setImgError] = useState(false);

  return (
    <article style={{
      background: "var(--white)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    }}>
      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 14px",
      }}>
        <Avatar name={name} avatarUrl={avatar} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.2 }}>{name}</div>
          <div style={{ fontSize: 11, color: "var(--slate)", marginTop: 1 }}>{timeAgo(post.created_at)}</div>
        </div>
        {isOwn && (
          <button
            onClick={onDelete}
            title="Elimina"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--slate)", fontSize: 22, lineHeight: 1, padding: 4,
              borderRadius: 6, transition: "color .12s",
            }}
          >···</button>
        )}
      </div>

      {/* ── Photo ── */}
      {post.photo_url && !imgError && (
        <div style={{ width: "100%", aspectRatio: "1 / 1", background: "var(--light)" }}>
          <img
            src={post.photo_url}
            alt={post.sale_name ?? ""}
            onError={() => setImgError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ padding: "10px 14px 4px", display: "flex", alignItems: "center", gap: 14 }}>
        <button
          onClick={onLike}
          disabled={isLiking}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
        >
          <HeartIcon filled={post.likedByMe} />
        </button>
      </div>

      {/* ── Like count ── */}
      {post.likeCount > 0 && (
        <div style={{ padding: "0 14px 4px", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
          {post.likeCount} {post.likeCount === 1 ? "Mi piace" : "Mi piace"}
        </div>
      )}

      {/* ── Sale badge ── */}
      {post.sale_name && (
        <div style={{ padding: "4px 14px", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <span style={{
            background: "rgba(107,184,0,0.12)", border: "1px solid rgba(107,184,0,0.3)",
            borderRadius: 6, padding: "3px 10px",
            fontSize: 12.5, fontWeight: 700, color: "#6bb800",
          }}>
            {post.sale_name}
          </span>
          <span style={{
            fontSize: 13, fontWeight: 800, color: "#6bb800",
          }}>€{fmt(amount)}</span>
          {margin !== null && (
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: profit >= 0 ? "#6bb800" : "#FF4D4D",
              background: profit >= 0 ? "rgba(107,184,0,0.10)" : "rgba(255,77,77,0.10)",
              borderRadius: 6, padding: "2px 7px",
              border: `1px solid ${profit >= 0 ? "rgba(107,184,0,0.25)" : "rgba(255,77,77,0.25)"}`,
            }}>
              {profit >= 0 ? "+" : ""}€{fmt(profit)} · {margin}%
            </span>
          )}
          {post.sale_platform && (
            <span style={{ fontSize: 11, color: "var(--slate)" }}>{post.sale_platform}</span>
          )}
        </div>
      )}

      {/* ── Caption ── */}
      {post.caption && (
        <div style={{ padding: "2px 14px 12px", fontSize: 13.5, color: "var(--ink)", lineHeight: 1.5 }}>
          <span style={{ fontWeight: 700, marginRight: 6 }}>{name}</span>
          {post.caption}
        </div>
      )}

      {/* bottom spacer when no caption */}
      {!post.caption && <div style={{ height: 10 }} />}
    </article>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FeedClient({ initialPosts, currentUserId }: Props) {
  const router   = useRouter();
  const [posts, setPosts]         = useState<FeedPost[]>(initialPosts);
  const [createOpen, setCreate]   = useState(false);
  const [likingId, setLikingId]   = useState<string | null>(null);
  const [, startTransition]       = useTransition();

  useEffect(() => { setPosts(initialPosts); }, [initialPosts]);

  function handleLike(postId: string) {
    if (likingId) return;
    setLikingId(postId);
    // Ottimistico
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1 }
      : p
    ));
    startTransition(async () => {
      try {
        const res = await toggleLike(postId);
        setPosts(prev => prev.map(p => p.id === postId
          ? { ...p, likeCount: res.count, likedByMe: res.liked }
          : p
        ));
      } catch {
        // rollback
        setPosts(prev => prev.map(p => p.id === postId
          ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1 }
          : p
        ));
      } finally { setLikingId(null); }
    });
  }

  function handleDelete(postId: string) {
    setPosts(prev => prev.filter(p => p.id !== postId));
    startTransition(async () => {
      try { await deleteFeedPost(postId); }
      catch { router.refresh(); }
    });
  }

  return (
    <>
      {createOpen && (
        <CreatePostModal
          onClose={() => setCreate(false)}
          onSuccess={() => { setCreate(false); router.refresh(); }}
        />
      )}

      {/* ── Layout Instagram-style ── */}
      <div style={{ maxWidth: 468, margin: "0 auto" }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.3px" }}>Feed</div>
            <div style={{ fontSize: 12, color: "var(--slate)" }}>Le vendite della community</div>
          </div>
          <button
            onClick={() => setCreate(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#007782", color: "#fff",
              padding: "9px 18px", borderRadius: 999, border: "none",
              fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Pubblica
          </button>
        </div>

        {/* Empty state */}
        {posts.length === 0 && (
          <div style={{
            textAlign: "center", padding: "72px 0",
            border: "1px dashed var(--border)", borderRadius: 16,
          }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>📸</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>Nessun post ancora</div>
            <div style={{ fontSize: 13, color: "var(--slate)", marginBottom: 20 }}>Sii il primo a pubblicare una vendita!</div>
            <button
              onClick={() => setCreate(true)}
              style={{ background: "#007782", color: "#fff", padding: "10px 24px", borderRadius: 999, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
            >+ Pubblica ora</button>
          </div>
        )}

        {/* Post list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              isOwn={post.user_id === currentUserId}
              isLiking={likingId === post.id}
              onLike={() => handleLike(post.id)}
              onDelete={() => handleDelete(post.id)}
            />
          ))}
        </div>

        <div style={{ height: 80 }} />
      </div>
    </>
  );
}
