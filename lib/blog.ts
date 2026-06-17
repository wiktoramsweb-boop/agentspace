import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

export type PostFrontmatter = {
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  readingTime: string;
  keywords: string[];
};

export type Post = PostFrontmatter & {
  slug: string;
  html: string;
};

export type PostMeta = PostFrontmatter & {
  slug: string;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function readPostFile(slug: string) {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  const raw = fs.readFileSync(filePath, "utf8");
  return matter(raw);
}

export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getAllPostsMeta(): PostMeta[] {
  const slugs = getAllPostSlugs();
  const posts = slugs.map((slug) => {
    const { data } = readPostFile(slug);
    return { slug, ...(data as PostFrontmatter) };
  });
  // Najnowsze pierwsze
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const { data, content } = readPostFile(slug);
    const html = await marked.parse(content, { gfm: true, breaks: false });
    return {
      slug,
      html,
      ...(data as PostFrontmatter),
    };
  } catch {
    return null;
  }
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
