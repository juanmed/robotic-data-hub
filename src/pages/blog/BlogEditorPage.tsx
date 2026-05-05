import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { blogService } from "@/services/blogService";
import { blogMediaService } from "@/services/blogMediaService";
import type { BlogPost } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useIsBlogger } from "@/hooks/useIsBlogger";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export const BlogEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isBlogger, isLoading: isCheckingBlogger } = useIsBlogger();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(!!id);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(true);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  useEffect(() => {
    if (!id) {
      // Create mode: create a draft post immediately
      const createDraft = async () => {
        if (!user) {
          navigate("/");
          return;
        }

        try {
          const tempSlug = `untitled-post-${Date.now()}`;
          const newPost = await blogService.create({
            title: "Untitled Post",
            slug: tempSlug,
            excerpt: "",
            body_md: "",
          });
          setPost(newPost);
          setTitle(newPost.title);
          setSlug(newPost.slug);
          setExcerpt(newPost.excerpt);
          setBody(newPost.body_md);
          setStatus(newPost.status);
        } catch (err) {
          console.error("Failed to create draft:", err);
          toast.error("Failed to create new post");
          navigate("/dashboard/blog");
        }
      };

      createDraft();
    } else {
      // Edit mode: fetch existing post
      const fetchPost = async () => {
        try {
          setIsLoading(true);
          const data = await blogService.getById(id);
          if (!data) {
            toast.error("Post not found");
            navigate("/dashboard/blog");
            return;
          }

          // Check if user is the author (bloggers can always edit their own posts)
          if (data.author_id !== user?.id) {
            setIsAuthorized(false);
            toast.error("You can only edit your own posts");
            navigate(`/blog/${data.slug}`);
            return;
          }

          setPost(data);
          setTitle(data.title);
          setSlug(data.slug);
          setExcerpt(data.excerpt);
          setBody(data.body_md);
          setStatus(data.status);
        } catch (err) {
          console.error("Failed to fetch post:", err);
          toast.error("Failed to load post");
          navigate("/dashboard/blog");
        } finally {
          setIsLoading(false);
        }
      };

      fetchPost();
    }
  }, [id, navigate, user, isBlogger]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    // Auto-generate slug only if it's still the temporary one
    if (slug.startsWith("untitled-post-") || !slug) {
      setSlug(slugify(newTitle));
    }
  };

  const handleSave = async () => {
    if (!post) return;

    try {
      setIsSaving(true);

      const updatedPost = await blogService.update(post.id, {
        title,
        slug,
        excerpt,
        body_md: body,
        status,
        expectedUpdatedAt: post.updated_at,
      });

      setPost(updatedPost);
      toast.success("Post saved successfully");
    } catch (err: any) {
      console.error("Failed to save post:", err);
      toast.error(err.message || "Failed to save post");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!post || !title || !slug) {
      toast.error("Title and slug are required to publish");
      return;
    }

    try {
      setIsSaving(true);

      const updatedPost = await blogService.publish(post.id);
      setPost(updatedPost);
      setStatus(updatedPost.status);
      toast.success("Post published successfully");

      // Redirect to preview after short delay
      setTimeout(() => {
        navigate(`/dashboard/blog/${post.id}/preview`);
      }, 500);
    } catch (err: any) {
      console.error("Failed to publish post:", err);
      toast.error(err.message || "Failed to publish post");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnpublish = async () => {
    if (!post) return;

    try {
      setIsSaving(true);
      const updatedPost = await blogService.unpublish(post.id);
      setPost(updatedPost);
      setStatus(updatedPost.status);
      toast.success("Post unpublished");
    } catch (err: any) {
      console.error("Failed to unpublish post:", err);
      toast.error(err.message || "Failed to unpublish post");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isCheckingBlogger) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!post || !isAuthorized) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
      <Link to="/dashboard/blog">
        <Button variant="ghost" size="sm" className="mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to posts
        </Button>
      </Link>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <Input
            value={title}
            onChange={handleTitleChange}
            placeholder="Post title"
            className="text-lg"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium mb-2">Slug</label>
          <div className="flex gap-2">
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="url-friendly-slug"
              className="font-mono"
              disabled={status === "published"}
            />
            {status === "published" && (
              <span className="text-xs text-muted-foreground self-center whitespace-nowrap">
                (locked after publish)
              </span>
            )}
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium mb-2">Excerpt (optional)</label>
          <Textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Short summary for the post list (auto-generated from body if empty)"
            rows={3}
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-medium mb-2">Content</label>
          <MarkdownEditor
            value={body}
            onChange={setBody}
            onBlur={handleSave}
            placeholder="Write your post in markdown..."
            minRows={20}
            showSaveButton={true}
            uploader={user ? async (file) => {
              const media = await blogMediaService.upload(post.id, user.id, file);
              return {
                url: `blog-media:storage_path:${media.storage_path}`,
                alt: file.name,
              };
            } : undefined}
          />
        </div>

        {/* Status and Actions */}
        <div className="border-t border-border/30 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Publication Status</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {status === "draft"
                  ? "This post is not visible to the public yet"
                  : "This post is published and visible to everyone"}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              status === "draft"
                ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                : "bg-green-500/10 text-green-700 dark:text-green-400"
            }`}>
              {status === "draft" ? "Draft" : "Published"}
            </span>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Draft"
              )}
            </Button>

            {status === "draft" ? (
              <Button onClick={handlePublish} disabled={!title || !slug || isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish"
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleUnpublish}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Unpublishing...
                  </>
                ) : (
                  "Unpublish"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
