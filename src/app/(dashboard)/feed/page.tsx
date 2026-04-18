// src/app/(dashboard)/feed/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect }     from "next/navigation";
import FeedClient       from "@/components/FeedClient";

export const revalidate = 0;

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: rawPosts },
    { data: allLikes },
    { data: myLikes  },
  ] = await Promise.all([
    supabase
      .from("feed_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("feed_likes").select("post_id"),
    supabase.from("feed_likes").select("post_id").eq("user_id", user.id),
  ]);

  // Conta like per post
  const likeCountMap: Record<string, number> = {};
  for (const l of (allLikes ?? [])) {
    likeCountMap[l.post_id] = (likeCountMap[l.post_id] ?? 0) + 1;
  }
  const myLikedSet = new Set((myLikes ?? []).map(l => l.post_id));

  const posts = (rawPosts ?? []).map((p: any) => ({
    ...p,
    likeCount: likeCountMap[p.id] ?? 0,
    likedByMe: myLikedSet.has(p.id),
  }));

  return (
    <div className="page-scroll">
      <FeedClient initialPosts={posts} currentUserId={user.id} />
    </div>
  );
}
