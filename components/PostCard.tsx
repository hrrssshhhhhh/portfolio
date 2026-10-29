import { ViewTransition } from "react";
import Link from "next/link";
import { formatDate, type Post } from "@/lib/posts";

// One post in a list, styled like a level-select card: it lifts and glows on hover or focus.
export default function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col border-2 border-line bg-night-2 p-6 shadow-[6px_6px_0_rgb(0_0_0/0.45)] transition-[transform,border-color,box-shadow] duration-200 hover:border-sakura/60 hover:shadow-[6px_6px_0_rgb(0_0_0/0.45),0_0_32px_rgb(255_111_174/0.25)] focus-visible:border-sakura/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky motion-safe:hover:-translate-y-1"
    >
      <time dateTime={post.date} className="font-mono text-xs uppercase tracking-wider text-haze">
        {formatDate(post.date)}
      </time>
      {/* Same name as the post page's heading: the title morphs between them on navigation. */}
      <ViewTransition name={`post-title-${post.slug}`} share="morph" default="none">
        <h3 className="mt-3 w-fit font-display text-2xl transition-colors duration-200 group-hover:text-sakura">{post.title}</h3>
      </ViewTransition>
      <p className="mt-3 flex-1 leading-relaxed text-haze">{post.summary}</p>
      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tags">
        {post.tags.map((t) => (
          <li key={t} className="border border-line px-2 py-0.5 font-mono text-xs text-haze">
            {t}
          </li>
        ))}
      </ul>
    </Link>
  );
}
