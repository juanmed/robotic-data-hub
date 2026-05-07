import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { blogService } from "@/services/blogService";
import type { BlogPost } from "@/types";
import { Loader2 } from "lucide-react";

export const BlogListPage = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        const data = await blogService.list({ publishedOnly: true });
        setPosts(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch blog posts:", err);
        setError("Failed to load blog posts");
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pt-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Blog</h1>
        <p className="text-muted-foreground">Latest posts and insights</p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-8">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No blog posts yet</p>
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.id} className="border-b border-border/50 pb-8 last:border-0">
              <Link to={`/blog/${post.slug}`} className="group">
                <h2 className="text-2xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
              </Link>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                {post.published_at && (
                  <time dateTime={post.published_at}>
                    {format(new Date(post.published_at), "MMMM d, yyyy")}
                  </time>
                )}
              </div>

              <p className="text-base text-muted-foreground mb-4">
                {post.excerpt || "No excerpt provided"}
              </p>

              <Link
                to={`/blog/${post.slug}`}
                className="inline-flex text-sm font-medium text-primary hover:underline"
              >
                Read more →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
