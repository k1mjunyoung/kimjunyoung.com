import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeStarryNight from "rehype-starry-night";
import rehypeStringify from "rehype-stringify";

export interface Heading {
  id: string;
  text: string;
  depth: 2 | 3;
}

// rehype 트리 최소 타입 (hast)
interface HNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HNode[];
}

const el = (
  tagName: string,
  properties: Record<string, unknown>,
  children: HNode[],
): HNode => ({ type: "element", tagName, properties, children });

function textOf(node: HNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(textOf).join("");
}

/**
 * 1. h2/h3 목록을 file.data.headings에 모은다 (rehype-slug 이후에 실행)
 * 2. <pre><code>를 언어 라벨 + 복사 버튼이 있는 .code-block으로 감싼다
 */
function rehypeArticle() {
  return (tree: HNode, file: { data: Record<string, unknown> }) => {
    const headings: Heading[] = [];

    function walk(node: HNode) {
      const children = node.children;
      if (!children) return;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.type !== "element") continue;

        if ((child.tagName === "h2" || child.tagName === "h3") && child.properties?.id) {
          const text = textOf(child).trim();
          if (text) {
            headings.push({
              id: String(child.properties.id),
              text,
              depth: child.tagName === "h2" ? 2 : 3,
            });
          }
        }

        const code = child.tagName === "pre" ? child.children?.[0] : undefined;
        if (code?.type === "element" && code.tagName === "code") {
          const classes = (code.properties?.className as string[] | undefined) ?? [];
          const lang =
            classes.find((c) => c.startsWith("language-"))?.slice("language-".length) ?? "text";
          children[i] = el("div", { className: ["code-block"] }, [
            el("div", { className: ["code-head"] }, [
              el("span", {}, [{ type: "text", value: lang }]),
              el("button", { type: "button", className: ["code-copy"], dataCopy: "" }, [
                { type: "text", value: "복사" },
              ]),
            ]),
            child,
          ]);
          continue;
        }

        walk(child);
      }
    }

    walk(tree);
    file.data.headings = headings;
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStarryNight)
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings, { behavior: "prepend" })
  .use(rehypeArticle)
  .use(rehypeStringify, { allowDangerousHtml: true });

/** 포스트 본문 HTML과 목차용 제목 목록 */
export async function renderArticle(md: string): Promise<{ html: string; headings: Heading[] }> {
  const file = await processor.process(md);
  return {
    html: String(file),
    headings: (file.data.headings as Heading[] | undefined) ?? [],
  };
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
  const stripped = content.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
  const mdMatches = [...stripped.matchAll(/!\[.*?\]\((.*?)\)/g)].map((m) => m[1]);
  const htmlMatches = [...stripped.matchAll(/<img[^>]+src=["']([^"']+)["']/g)].map((m) => m[1]);
  return [...mdMatches, ...htmlMatches].slice(0, max);
}
