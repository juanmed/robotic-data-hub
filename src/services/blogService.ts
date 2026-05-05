import { supabase } from "@/integrations/supabase/client";
import type { BlogPost } from "@/types";

interface CreateBlogPostInput {
  title: string;
  slug: string;
  excerpt: string;
  body_md: string;
  author_id?: string;
}

interface UpdateBlogPostInput extends Partial<CreateBlogPostInput> {
  status?: "draft" | "published";
  expectedUpdatedAt?: string;
}

export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*{1,2}([^*]*)\*{1,2}/g, "$1")
    .replace(/_([^_]*)_/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

export function truncateExcerpt(text: string, maxLength: number = 150): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export const blogService = {
  async create(input: CreateBlogPostInput): Promise<BlogPost> {
    // If no author_id provided, use current user from auth
    let authorId = input.author_id;
    if (!authorId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Must be authenticated to create a post");
      authorId = user.id;
    }

    const excerpt =
      input.excerpt ||
      truncateExcerpt(stripMarkdown(input.body_md));

    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        author_id: authorId,
        title: input.title,
        slug: input.slug,
        excerpt,
        body_md: input.body_md,
        status: "draft",
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as BlogPost;
  },

  async update(
    id: string,
    input: UpdateBlogPostInput
  ): Promise<BlogPost> {
    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.body_md !== undefined) {
      updateData.body_md = input.body_md;
      // Auto-truncate excerpt if not explicitly provided
      if (input.excerpt === undefined) {
        updateData.excerpt = truncateExcerpt(stripMarkdown(input.body_md));
      }
    }
    if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
    if (input.status !== undefined) {
      updateData.status = input.status;
      if (input.status === "published") {
        updateData.published_at = new Date().toISOString();
      } else if (input.status === "draft") {
        updateData.published_at = null;
      }
    }

    let query = supabase.from("blog_posts").update(updateData).eq("id", id);

    // Optimistic concurrency control: check updated_at if provided
    if (input.expectedUpdatedAt) {
      query = query.eq("updated_at", input.expectedUpdatedAt);
    }

    const { data, error } = await query.select().single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows updated (likely due to updated_at mismatch)
        throw new Error(
          "Post was modified by another user. Please reload and try again."
        );
      }
      throw error;
    }
    return data as unknown as BlogPost;
  },

  async publish(id: string): Promise<BlogPost> {
    // Fetch current post to check if it's ready to publish
    const { data: post, error: fetchError } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const blogPost = post as unknown as BlogPost;
    if (!blogPost.title || !blogPost.slug) {
      throw new Error("Title and slug are required to publish");
    }

    return this.update(id, { status: "published" });
  },

  async unpublish(id: string): Promise<BlogPost> {
    return this.update(id, { status: "draft" });
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async getById(id: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return (data as unknown as BlogPost) || null;
  },

  async getBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return (data as unknown as BlogPost) || null;
  },

  async list(options?: { publishedOnly?: boolean }): Promise<BlogPost[]> {
    let query = supabase
      .from("blog_posts")
      .select("*")
      .order("published_at", { ascending: false, nullsFirst: false });

    if (options?.publishedOnly !== false) {
      query = query.eq("status", "published");
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data ?? []) as unknown as BlogPost[];
  },

  async listAll(options?: { status?: "draft" | "published" }): Promise<BlogPost[]> {
    let query = supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data ?? []) as unknown as BlogPost[];
  },
};
