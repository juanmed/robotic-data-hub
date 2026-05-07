import { useEffect, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { blogService } from "@/services/blogService";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useAuth } from "@/hooks/useAuth";
import type { BlogPost } from "@/types";
import { Loader2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchPost = async () => {
      try {
        setIsLoading(true);
        const data = await blogService.getBySlug(slug);
        if (!data) {
          setNotFound(true);
        } else {
          setPost(data);
        }
      } catch (err) {
        console.error("Failed to fetch blog post:", err);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-8 pt-24">
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-4xl font-bold">{post.title}</h1>
          {user?.id === post.author_id && (
            <Link to={`/dashboard/blog/${post.id}/edit`}>
              <Button size="sm" variant="outline">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {post.published_at && (
            <time dateTime={post.published_at}>
              {format(new Date(post.published_at), "MMMM d, yyyy")}
            </time>
          )}
        </div>
      </header>

      <div className="prose prose-invert prose-sm max-w-none">
        <MarkdownRenderer content={post.body_md} />
      </div>
    </article>
  );
};
