import type { Metadata } from "next";
import { ViewTransition } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import { allPosts, formatDate, getPost } from "@/lib/posts";

// Every post is prerendered at build time. Cache Components has no `dynamicParams`, so an unknown
// slug reaches the page and gets notFound() there.
export function generateStaticParams() {
  return allPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = getPost((await params).slug);
  return post ? { title: post.title, description: post.summary } : {};
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const post = getPost((await params).slug);
  if (!post) notFound();

  return (
    <main className="flex-1 pb-24 pt-40 md:pt-36">
      <Container>
        <article className="mx-auto max-w-2xl">
          <Link
            href="/blog"
            className="inline-flex min-h-11 items-center font-mono text-xs uppercase tracking-widest text-sky transition-colors duration-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky"
          >
            ← All posts
          </Link>
          <time dateTime={post.date} className="mt-6 block font-mono text-xs uppercase tracking-wider text-haze">
            {formatDate(post.date)}
          </time>
          <ViewTransition name={`post-title-${post.slug}`} share="morph" default="none">
            <h1 className="mt-3 w-fit font-display text-3xl leading-tight title-shadow sm:text-4xl md:text-5xl md:tracking-tight">{post.title}</h1>
          </ViewTransition>
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tags">
            {post.tags.map((t) => (
              <li key={t} className="border border-line px-2 py-0.5 font-mono text-xs text-haze">
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-10 border-t-2 border-line pt-8">
            {post.body.map((block, i) =>
              block.startsWith("## ") ? (
                <h2 key={i} className="mt-10 font-display text-2xl text-sakura first:mt-0">
                  {block.slice(3)}
                </h2>
              ) : (
                <p key={i} className="mt-5 text-lg leading-relaxed text-foreground/90 first:mt-0">
                  {block}
                </p>
              ),
            )}
          </div>
        </article>
      </Container>
    </main>
  );
}
