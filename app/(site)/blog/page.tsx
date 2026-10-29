import type { Metadata } from "next";
import Container from "@/components/Container";
import PostCard from "@/components/PostCard";
import { allPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on what I build: web, Android, deep learning, and this portfolio's game.",
};

export default function BlogPage() {
  return (
    <main className="flex-1 pb-24 pt-40 md:pt-36">
      <Container>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-haze">Field notes</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight title-shadow md:text-6xl">Blog</h1>
        <ul className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {allPosts().map((post) => (
            <li key={post.slug}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      </Container>
    </main>
  );
}
