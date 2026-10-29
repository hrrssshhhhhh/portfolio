import type { MetadataRoute } from "next";
import { allPosts } from "@/lib/posts";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/play`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${site.url}/blog`, changeFrequency: "weekly", priority: 0.7 },
    ...allPosts().map((p) => ({ url: `${site.url}/blog/${p.slug}`, lastModified: p.date, priority: 0.6 })),
  ];
}
