import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeStringify from "rehype-stringify";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings, { behavior: "prepend" })
  .use(rehypeStringify, { allowDangerousHtml: true });

export async function renderMarkdown(md: string): Promise<string> {
  return String(await processor.process(md));
}

export function extractPreview(content: string, maxLength = 140): string {
  const stripped = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .replace(/^\s*[-*>]\s+/gm, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > maxLength
    ? stripped.slice(0, maxLength) + "…"
    : stripped;
}

export function extractContentImages(content: string, max = 4): string[] {
  const mdMatches = [...content.matchAll(/!\[.*?\]\((.*?)\)/g)].map((m) => m[1]);
  const htmlMatches = [...content.matchAll(/<img[^>]+src=["']([^"']+)["']/g)].map((m) => m[1]);
  return [...mdMatches, ...htmlMatches].slice(0, max);
}
