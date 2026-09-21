"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownViewer({ content }: { content: string }) {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-table:overflow-x-auto prose-pre:overflow-x-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ node, ...props }) => {
            const src = String(props.src || "");
            // Rewrite relative asset paths to /api/v1/files/...
            if (src.startsWith("assets/") || (!src.startsWith("http") && !src.startsWith("/") && !src.startsWith("data:"))) {
              props.src = `/api/v1/files/${src}`;
            } else if (src.startsWith("/")) {
              props.src = src;
            }
            return <img {...props} alt={props.alt || ""} />;
          },
          a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
