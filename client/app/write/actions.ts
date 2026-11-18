"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { postHref } from "@/lib/site";
import {
  WRITE_COOKIE,
  WRITE_SESSION_DAYS,
  checkPassword,
  createSessionToken,
  verifySessionToken,
} from "@/lib/write-auth";
import type { Post } from "@/types/post";

// 서버 액션은 누구나 POST로 직접 부를 수 있으므로 middleware와 별개로 액션마다 세션을 확인한다.

async function requireSession(): Promise<void> {
  const token = (await cookies()).get(WRITE_COOKIE)?.value;
  if (!(await verifySessionToken(token))) {
    throw new Error("로그인이 필요합니다");
  }
}

// --- 로그인 ---

export interface LoginState {
  error?: string;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!process.env.WRITE_PASSWORD) {
    return { error: "WRITE_PASSWORD가 설정되지 않아 글 작성이 꺼져 있습니다" };
  }
  const input = String(formData.get("password") ?? "");
  if (!(await checkPassword(input))) {
    // 무차별 대입을 조금이라도 늦춘다
    await new Promise((r) => setTimeout(r, 800));
    return { error: "암호가 맞지 않습니다" };
  }

  (await cookies()).set(WRITE_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: WRITE_SESSION_DAYS * 24 * 60 * 60,
  });
  redirect("/write");
}

export async function logout(): Promise<void> {
  (await cookies()).delete(WRITE_COOKIE);
  redirect("/write/login");
}

// --- 저장 ---

/** POST /api/posts 요청 바디 (server PostCreateRequest) */
export interface PostCreateInput {
  title: string;
  slug: string;
  description: string | null;
  tags: string[];
  content: string;
  thumbnailUrl: string | null;
  /** true면 지금 시각으로 발행, false면 비공개 저장 */
  publish: boolean;
}

export type SaveResult =
  | { ok: true; slug: string; href: string; published: boolean }
  | { ok: false; error: string };

function validate(input: PostCreateInput): string | undefined {
  if (!input.title.trim()) return "제목을 입력하세요";
  if (!input.slug.trim()) return "slug를 입력하세요";
  // URL 한 칸에 들어가야 한다. 한글 slug는 기존 글에도 있으므로 허용한다
  if (/[\s/?#%\\]/.test(input.slug)) return "slug에는 공백과 / ? # % \\ 를 쓸 수 없습니다";
  if (!input.content.trim()) return "본문을 입력하세요";
  if (input.thumbnailUrl && !/^https?:\/\//.test(input.thumbnailUrl)) {
    return "썸네일은 http(s) URL이어야 합니다";
  }
  return undefined;
}

/** ProblemDetail(application/problem+json)의 detail, 없으면 상태 코드 */
async function errorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: string; title?: string };
    if (body.detail) return body.detail;
    if (body.title) return `${res.status} ${body.title}`;
  } catch {
    // 바디가 JSON이 아니면 상태 코드만 쓴다
  }
  return `${res.status} ${res.statusText}`;
}

export async function createPost(raw: PostCreateInput): Promise<SaveResult> {
  await requireSession();

  const input: PostCreateInput = {
    title: raw.title.trim(),
    slug: raw.slug.trim(),
    description: raw.description?.trim() || null,
    tags: [...new Set(raw.tags.map((t) => t.trim()).filter(Boolean))],
    content: raw.content,
    thumbnailUrl: raw.thumbnailUrl?.trim() || null,
    publish: raw.publish,
  };
  const invalid = validate(input);
  if (invalid) return { ok: false, error: invalid };

  const base = process.env.API_URL;
  const token = process.env.ADMIN_API_TOKEN;
  if (!base) return { ok: false, error: "API_URL 환경변수가 없습니다" };
  if (!token) return { ok: false, error: "ADMIN_API_TOKEN 환경변수가 없습니다" };

  let res: Response;
  try {
    res = await fetch(`${base.replace(/\/+$/, "")}/api/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
      cache: "no-store",
    });
  } catch (e) {
    return { ok: false, error: `서버에 연결하지 못했습니다 (${(e as Error).message})` };
  }

  if (res.status === 404 || res.status === 405) {
    return { ok: false, error: "서버에 글 작성 API(POST /api/posts)가 아직 없습니다" };
  }
  if (res.status === 401 || res.status === 403) {
    return { ok: false, error: "서버가 ADMIN_API_TOKEN을 거부했습니다" };
  }
  if (res.status === 409) {
    return { ok: false, error: `이미 있는 slug입니다: ${input.slug}` };
  }
  if (!res.ok) return { ok: false, error: await errorMessage(res) };

  const saved = (await res.json()) as Post;
  // 정적 생성된 목록과 글 페이지를 다시 만든다 (다시 배포하지 않아도 반영)
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  revalidatePath("/post/[slug]", "page");

  return {
    ok: true,
    slug: saved.slug,
    href: postHref(saved.slug),
    published: input.publish,
  };
}
