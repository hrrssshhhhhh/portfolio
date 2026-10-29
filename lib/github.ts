import { cacheLife } from "next/cache";
import { projects } from "@/lib/projects";
import { site } from "@/lib/site";

// Public GitHub repos tagged with the `portfolio` topic, shown under the hand-written projects.
// Tag a repo on GitHub and it appears here within about an hour, no redeploy. Repos already in
// lib/projects.ts are skipped so nothing shows twice.

export type Repo = {
  name: string;
  description: string;
  url: string;
  homepage?: string;
  language?: string;
  topics: string[];
  stars: number;
  pushedAt: string;
};

const TOPIC = "portfolio";
const user = site.socials.github.split("/").pop()!;

type ApiRepo = {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  pushed_at: string;
};

// Cached for an hour. Throws on a failed request so a GitHub hiccup is never cached as "no repos".
async function fetchRepos(): Promise<Repo[]> {
  "use cache";
  cacheLife("hours");
  const res = await fetch(`https://api.github.com/users/${user}/repos?per_page=100&sort=pushed`, {
    headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const featured = new Set(projects.map((p) => p.links.github?.toLowerCase()));
  return ((await res.json()) as ApiRepo[])
    .filter((r) => r.topics?.includes(TOPIC) && !featured.has(r.html_url.toLowerCase()))
    .map((r) => ({
      name: r.name,
      description: r.description ?? "",
      url: r.html_url,
      homepage: r.homepage || undefined,
      language: r.language ?? undefined,
      topics: (r.topics ?? []).filter((t) => t !== TOPIC),
      stars: r.stargazers_count,
      pushedAt: r.pushed_at,
    }));
}

// GitHub down or rate-limited: show no extra repos; the featured projects still render.
export async function portfolioRepos(): Promise<Repo[]> {
  try {
    return await fetchRepos();
  } catch (e) {
    console.error("GitHub repos unavailable:", e);
    return [];
  }
}
