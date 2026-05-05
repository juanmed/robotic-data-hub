import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { blogMediaService } from "@/services/blogMediaService";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  const [transformedContent, setTransformedContent] = useState(content);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const transformBlogMediaLinks = async (markdown: string) => {
      try {
        const regex = /blog-media:storage_path:([^\s)]+)/g;
        let transformed = markdown;
        const matches = Array.from(markdown.matchAll(regex));

        for (const match of matches) {
          const storagePath = match[1];
          try {
            const signedUrl = await blogMediaService.getSignedUrl(storagePath);
            transformed = transformed.replace(
              `blog-media:storage_path:${storagePath}`,
              signedUrl
            );
          } catch (err) {
            console.error(
              `Failed to get signed URL for ${storagePath}:`,
              err
            );
          }
        }

        setTransformedContent(transformed);
      } catch (err) {
        console.error("Error transforming markdown:", err);
        setTransformedContent(markdown);
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    transformBlogMediaLinks(content);
  }, [content]);

  if (isLoading) {
    return <div className={`prose prose-invert prose-sm max-w-none ${className}`}>Loading...</div>;
  }

  return (
    <div className={`prose prose-invert prose-sm max-w-none ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {transformedContent}
      </ReactMarkdown>
    </div>
  );
};
