import Link from "next/link";
import Container from "@/components/Container";
import PostCard from "@/components/PostCard";
import { allPosts } from "@/lib/posts";

// The 3 newest posts, below Projects. Not a data bit (the blog keeps growing), so no Section frame.
export default function LatestPosts() {
  return (
    <section aria-labelledby="latest-posts-title" className="py-20 md:py-28">
      <Container>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-haze">Field notes</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h2 id="latest-posts-title" className="font-display text-4xl tracking-tight title-shadow md:text-6xl">
            Latest posts
          </h2>
          <Link
            href="/blog"
            className="inline-flex min-h-11 items-center font-semibold text-sky transition-colors duration-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky"
          >
            All posts →
          </Link>
        </div>
        <ul className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {allPosts()
            .slice(0, 3)
            .map((post) => (
              <li key={post.slug}>
                <PostCard post={post} />
              </li>
            ))}
        </ul>
      </Container>
    </section>
  );
}
