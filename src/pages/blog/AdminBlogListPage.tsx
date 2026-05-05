import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { blogService } from "@/services/blogService";
import type { BlogPost } from "@/types";
import { Loader2, Pencil, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const AdminBlogListPage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDraftsOnly, setShowDraftsOnly] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [showDraftsOnly]);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const data = await blogService.listAll(
        showDraftsOnly ? { status: "draft" } : undefined
      );
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

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);
      await blogService.delete(deleteId);
      setPosts(posts.filter((p) => p.id !== deleteId));
      toast.success("Post deleted successfully");
      setDeleteId(null);
    } catch (err) {
      console.error("Failed to delete post:", err);
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Blog Posts</h1>
          <p className="text-muted-foreground">Manage your blog content</p>
        </div>
        <Link to="/dashboard/blog/new">
          <Button>New Post</Button>
        </Link>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-8">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      <div className="mb-4 flex gap-2">
        <Button
          variant={showDraftsOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowDraftsOnly(true)}
        >
          Drafts
        </Button>
        <Button
          variant={!showDraftsOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowDraftsOnly(false)}
        >
          All Posts
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 border border-border/50 rounded-lg">
          <p className="text-muted-foreground mb-4">
            {showDraftsOnly ? "No drafts yet" : "No posts yet"}
          </p>
          <Link to="/dashboard/blog/new">
            <Button>Create one to get started</Button>
          </Link>
        </div>
      ) : (
        <div className="border border-border/50 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30 bg-card/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Published</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-border/30 hover:bg-card/50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{post.title}</div>
                    <div className="text-xs text-muted-foreground">{post.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                      post.status === "draft"
                        ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                        : "bg-green-500/10 text-green-700 dark:text-green-400"
                    }`}>
                      {post.status === "draft" ? "Draft" : "Published"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {post.published_at ? format(new Date(post.published_at), "MMM d, yyyy") : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {format(new Date(post.created_at), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/dashboard/blog/${post.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      {post.status === "published" && (
                        <Link to={`/dashboard/blog/${post.id}/preview`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(post.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The post and all associated media will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
