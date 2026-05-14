import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface Post {
  lang: string;
  slug: string;
  permalink: string;
  title: string;
  description: string;
  date: string;
  categories: string[];
  domain: string;
  link: string;
  commit_url: string;
  redirect_from: string[];
  content: string;
  firstImage: string | null;
}

// Posts live in ko/_posts/ (Jekyll convention retained during Supabase transition)
const POSTS_DIR = path.join(process.cwd(), 'ko', '_posts');

let _cache: Post[] | null = null;

function parsePost(filename: string, raw: string): Post {
  const { data, content } = matter(raw);

  const permalink: string = data.permalink ?? '';
  const slugFromPermalink = permalink.split('/').filter(Boolean).pop();
  const slugFromFilename = filename
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .replace(/\.md$/, '');
  const slug = slugFromPermalink || slugFromFilename;

  const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
  const mdImgMatch = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
  const firstImage = imgMatch?.[1] ?? mdImgMatch?.[1] ?? null;

  const categories = data.categories
    ? (Array.isArray(data.categories) ? data.categories : [data.categories]).filter(Boolean)
    : [];

  const redirect_from = data.redirect_from
    ? (Array.isArray(data.redirect_from) ? data.redirect_from : [data.redirect_from]).filter(Boolean)
    : [];

  return {
    lang: data.lang ?? 'ko',
    slug,
    permalink,
    title: data.title ?? '',
    description: data.description ?? '',
    date: data.date ? new Date(data.date).toISOString() : '',
    categories,
    domain: data.domain ?? '',
    link: data.link ?? '',
    commit_url: data.commit_url ?? '',
    redirect_from,
    content,
    firstImage,
  };
}

export function getAllPosts(lang = 'ko'): Post[] {
  if (_cache) return _cache;

  const langDir = POSTS_DIR;
  if (!fs.existsSync(langDir)) return [];

  const files = fs.readdirSync(langDir).filter((f) => f.endsWith('.md'));

  const posts: Post[] = [];
  for (const filename of files) {
    const raw = fs.readFileSync(path.join(langDir, filename), 'utf-8');
    const { data } = matter(raw);
    if (data.published === false) continue;
    posts.push(parsePost(filename, raw));
  }

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  _cache = posts;
  return posts;
}

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function getPrevNext(slug: string): { prev: Post | null; next: Post | null } {
  const posts = getAllPosts();
  const idx = posts.findIndex((p) => p.slug === slug);
  if (idx === -1) return { prev: null, next: null };

  // Jekyll convention: prev = newer (lower index), next = older (higher index), wrap around
  const prevIdx = idx === 0 ? posts.length - 1 : idx - 1;
  const nextIdx = idx === posts.length - 1 ? 0 : idx + 1;

  return { prev: posts[prevIdx], next: posts[nextIdx] };
}

export function getPostsByDomain(domain: string): Post[] {
  return getAllPosts().filter((p) => p.domain === domain);
}
