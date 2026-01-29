import React, { useMemo } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import hljs from "highlight.js/lib/common";

marked.setOptions({
  gfm: true,
  breaks: true
});

export default function MarkdownRenderer({ content }) {
  const sanitized = useMemo(() => {
    const renderer = new marked.Renderer();
    renderer.code = (code, language) => {
      const safeLanguage =
        language && /^[a-z0-9+-]+$/i.test(language) && hljs.getLanguage(language)
          ? language
          : "";
      let highlighted = "";
      if (safeLanguage) {
        highlighted = hljs.highlight(code, { language: safeLanguage }).value;
      } else {
        highlighted = hljs.highlightAuto(code).value;
      }
      return `
        <div class="code-block">
          <div class="code-header">
            <div class="dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <button class="code-copy" type="button">复制</button>
          </div>
          <pre><code class="hljs ${safeLanguage ? `language-${safeLanguage}` : ""}">${highlighted}</code></pre>
        </div>
      `;
    };
    renderer.link = (href, title, text) => {
      const titleAttr = title ? ` title="${title}"` : "";
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
    };
    const html = marked.parse(content || "", { renderer });
    DOMPurify.addHook("afterSanitizeAttributes", (node) => {
      if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
        const rel = (node.getAttribute("rel") || "").split(" ");
        if (!rel.includes("noopener")) rel.push("noopener");
        if (!rel.includes("noreferrer")) rel.push("noreferrer");
        node.setAttribute("rel", rel.filter(Boolean).join(" "));
      }
    });
    const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    DOMPurify.removeAllHooks();
    return clean;
  }, [content]);

  return (
    <div
      className="markdown"
      dangerouslySetInnerHTML={{ __html: sanitized }}
      onClick={(event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (!target.classList.contains("code-copy")) return;
        const block = target.closest(".code-block");
        if (!block) return;
        const code = block.querySelector("code");
        if (!code) return;
        const text = code.textContent || "";
        navigator.clipboard.writeText(text).then(() => {
          target.textContent = "已复制";
          window.setTimeout(() => {
            target.textContent = "复制";
          }, 1500);
        });
      }}
    />
  );
}
