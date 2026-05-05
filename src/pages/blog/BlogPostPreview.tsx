import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { format } from "date-fns";
import { blogService } from "@/services/blogService";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import type { BlogPost } from "@/types";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const BlogPostPreview = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      try {
        setIsLoading(true);
        const data = await blogService.getById(id);
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
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !post) {
    return <Navigate to="/dashboard/blog" replace />;
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-8 pt-24">
      <div className="mb-8">
        <Link to="/dashboard/blog">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to posts
          </Button>
        </Link>

        <header>
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            {post.published_at && (
              <time dateTime={post.published_at}>
                {format(new Date(post.published_at), "MMMM d, yyyy")}
              </time>
            )}
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              post.status === "draft"
                ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                : "bg-green-500/10 text-green-700 dark:text-green-400"
            }`}>
              {post.status === "draft" ? "Draft" : "Published"}
            </span>
          </div>
        </header>
      </div>

      <div className="prose prose-invert prose-sm max-w-none">
        <MarkdownRenderer content={post.body_md} />
      </div>
    </article>
  );
};
