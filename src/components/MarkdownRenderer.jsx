import React, { useMemo } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: true
});

export default function MarkdownRenderer({ content }) {
  const sanitized = useMemo(() => {
    const html = marked.parse(content || "");
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  }, [content]);

  return <div className="markdown" dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
