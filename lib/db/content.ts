import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type DB = SupabaseClient<Database>;

/* Row types extended with joined relations (Supabase doesn't infer these). */
export type ServiceWithCategory = Database["public"]["Tables"]["services"]["Row"] & {
  service_categories?: { name: string; slug: string } | null;
};

export type ProjectWithCategory = Database["public"]["Tables"]["portfolio_items"]["Row"] & {
  portfolio_categories?: { name: string; slug: string } | null;
};

export type PostWithRelations = Database["public"]["Tables"]["blog_posts"]["Row"] & {
  blog_categories?: { name: string; slug: string } | null;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
  post_tags?: { blog_tags?: { id: string; name: string; slug: string } | null }[] | null;
};

/* ── Services ─────────────────────────────────────────────────────── */

export async function getPublishedServices(db: DB) {
  const { data, error } = await db
    .from("services")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getFeaturedServices(db: DB, limit = 6) {
  const { data, error } = await db
    .from("services")
    .select("*")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getServiceBySlug(
  db: DB,
  slug: string
): Promise<ServiceWithCategory | null> {
  const { data, error } = await db
    .from("services")
    .select("*, service_categories(name, slug)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (error) return null;
  return data as ServiceWithCategory;
}

export async function getRelatedServices(db: DB, excludeId: string, limit = 3) {
  const { data } = await db
    .from("services")
    .select("id, title, slug, summary, icon")
    .eq("status", "published")
    .neq("id", excludeId)
    .order("created_at", { ascending: true })
    .limit(limit);
  return data ?? [];
}

/* ── Portfolio ────────────────────────────────────────────────────── */

export async function getPublishedPortfolio(
  db: DB,
  categorySlug?: string
): Promise<ProjectWithCategory[]> {
  let query = db
    .from("portfolio_items")
    .select("*, portfolio_categories(name, slug)")
    .eq("status", "published");

  if (categorySlug && categorySlug !== "all") {
    query = query.eq("portfolio_categories.slug", categorySlug);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectWithCategory[];
}

export async function getFeaturedProjects(
  db: DB,
  limit = 6
): Promise<ProjectWithCategory[]> {
  const { data } = await db
    .from("portfolio_items")
    .select("*, portfolio_categories(name, slug)")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ProjectWithCategory[];
}

export async function getPortfolioItemBySlug(
  db: DB,
  slug: string
): Promise<ProjectWithCategory | null> {
  const { data } = await db
    .from("portfolio_items")
    .select("*, portfolio_categories(name, slug)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data as unknown as ProjectWithCategory;
}

/* ── Blog ─────────────────────────────────────────────────────────── */

export type PostsQuery = {
  page?: number;
  perPage?: number;
  categorySlug?: string;
  search?: string;
};

export async function getPublishedPosts(
  db: DB,
  { page = 1, perPage = 9, categorySlug, search }: PostsQuery = {}
): Promise<{
  posts: PostWithRelations[];
  total: number;
  totalPages: number;
}> {
  let query = db
    .from("blog_posts")
    .select("*, blog_categories(name, slug), profiles(full_name, avatar_url)", {
      count: "exact",
    })
    .eq("status", "published");

  if (categorySlug) query = query.eq("blog_categories.slug", categorySlug);
  if (search) query = query.ilike("title", `%${search}%`);

  const from = (page - 1) * perPage;
  const { data, count } = await query
    .order("published_at", { ascending: false })
    .range(from, from + perPage - 1);

  return {
    posts: (data ?? []) as PostWithRelations[],
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / perPage)),
  };
}

export async function getPostBySlug(
  db: DB,
  slug: string
): Promise<PostWithRelations | null> {
  const { data } = await db
    .from("blog_posts")
    .select(
      "*, blog_categories(name, slug), profiles(full_name, avatar_url), post_tags(blog_tags(id, name, slug))"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data as unknown as PostWithRelations;
}

export async function getRelatedPosts(
  db: DB,
  post: { id: string; category_id: string | null },
  limit = 3
) {
  let query = db
    .from("blog_posts")
    .select("id, title, slug, excerpt, cover_image, published_at")
    .eq("status", "published")
    .neq("id", post.id);

  if (post.category_id) query = query.eq("category_id", post.category_id);

  const { data } = await query
    .order("published_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getBlogCategories(db: DB) {
  const { data } = await db
    .from("blog_categories")
    .select("id, name, slug, description")
    .order("name", { ascending: true });
  return data ?? [];
}

/* ── Testimonials ─────────────────────────────────────────────────── */

export async function getTestimonials(db: DB, limit?: number) {
  let query = db
    .from("testimonials")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (limit) query = query.limit(limit);
  const { data } = await query;
  return data ?? [];
}

export async function getFeaturedTestimonials(db: DB, limit = 3) {
  const { data } = await db
    .from("testimonials")
    .select("*")
    .eq("status", "published")
    .eq("featured", true)
    .order("sort_order", { ascending: true })
    .limit(limit);
  return data ?? [];
}

/* ── Careers ──────────────────────────────────────────────────────── */

export async function getOpenCareers(db: DB) {
  const { data } = await db
    .from("careers")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getCareerBySlug(db: DB, slug: string) {
  const { data } = await db
    .from("careers")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data;
}

/* ── Site settings ────────────────────────────────────────────────── */

export async function getSiteSettings(db: DB) {
  const { data } = await db.from("site_settings").select("key, value");
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.value) map[row.key] = row.value;
  }
  return map;
}

export type EnabledAd = {
  id: string;
  name: string;
  ad_client: string;
  slot_id: string | null;
  mobile_slot_id: string | null;
  mobile_format: string;
  format: string;
  placement: string;
};

/** Enabled Google AdSense units, optionally filtered by placement. */
export async function getEnabledAds(db: DB, placement?: string): Promise<EnabledAd[]> {
  let q = db
    .from("ads")
    .select("id, name, ad_client, slot_id, mobile_slot_id, mobile_format, format, placement")
    .eq("enabled", true)
    .order("sort_order", { ascending: true });
  if (placement) q = q.eq("placement", placement);
  const { data } = await q;
  return (data ?? []) as EnabledAd[];
}

export type PublicStudyMaterial = {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  category: string | null;
  created_at: string;
};

/** Published study materials for the public downloads page. */
export async function getPublishedStudyMaterials(db: DB): Promise<PublicStudyMaterial[]> {
  const { data } = await db
    .from("study_materials")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  return (data ?? []) as PublicStudyMaterial[];
}
