import { GitHubIcon, Icon } from "@/components/icons";
import { portfolioRepos, type Repo } from "@/lib/github";
import { projects, type Project } from "@/lib/projects";
import Section from "./Section";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky";

// Corner brackets that lock onto the card like a game target reticle.
const CORNERS = [
  "left-0 top-0 border-l-2 border-t-2",
  "right-0 top-0 border-r-2 border-t-2",
  "bottom-0 left-0 border-b-2 border-l-2",
  "bottom-0 right-0 border-b-2 border-r-2",
];

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group relative flex flex-col border-2 border-line bg-night-2 p-6 shadow-[6px_6px_0_rgb(0_0_0/0.45)] transition-colors duration-200 hover:border-(--bit)/60 focus-within:border-(--bit)/60">
      {CORNERS.map((c) => (
        <span
          key={c}
          aria-hidden
          className={`pointer-events-none absolute -m-2 size-4 border-(--bit) opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${c}`}
        />
      ))}

      <div className="flex items-start justify-between">
        <span className="grid size-12 place-items-center border-2 border-(--bit) text-(--bit) transition-colors duration-200 group-hover:bg-(--bit) group-hover:text-night">
          <Icon name={project.icon} className="size-6" />
        </span>
        <span className="font-mono text-xs uppercase tracking-wider text-haze">{project.year}</span>
      </div>

      <h3 className="mt-5 font-display text-2xl">{project.title}</h3>
      <p className="mt-3 leading-relaxed text-haze">{project.description}</p>

      <details className="smooth-details group/details mt-4">
        <summary
          className={`inline-flex min-h-11 cursor-pointer list-none items-center gap-2 font-mono text-xs uppercase tracking-widest text-(--bit) transition-colors duration-200 hover:text-white [&::-webkit-details-marker]:hidden ${focusRing}`}
        >
          <Icon name="chevron" className="size-4 -rotate-90 transition-transform duration-200 group-open/details:rotate-0" />
          Inspect build
        </summary>
        <ul className="mt-2 space-y-2 border-l-2 border-(--bit)/40 pl-4 text-sm leading-relaxed text-haze">
          {project.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </details>

      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tech used">
        {project.tech.map((t) => (
          <li key={t} className="border border-line px-2 py-0.5 font-mono text-xs text-haze">
            {t}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex gap-4 border-t-2 border-line pt-3">
        {project.links.github && (
          <a
            href={project.links.github}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex min-h-11 items-center gap-2 font-semibold text-sun transition-colors duration-200 hover:text-white ${focusRing}`}
          >
            <GitHubIcon />
            Code<span className="sr-only"> for {project.title}</span>
          </a>
        )}
        {project.links.live && (
          <a
            href={project.links.live}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex min-h-11 items-center font-semibold text-sky transition-colors duration-200 hover:text-white ${focusRing}`}
          >
            Live demo<span className="sr-only"> of {project.title}</span>
          </a>
        )}
      </div>
    </article>
  );
}

// A repo tagged `portfolio` on GitHub (lib/github.ts): smaller than a featured card, no write-up.
function RepoCard({ repo }: { repo: Repo }) {
  const updated = new Date(repo.pushedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
  return (
    <article className="flex h-full flex-col border-2 border-line bg-night-2 p-5 transition-colors duration-200 hover:border-(--bit)/60 focus-within:border-(--bit)/60">
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-display text-xl break-words">{repo.name}</h4>
        {repo.stars > 0 && <span className="shrink-0 font-mono text-xs text-sun">★ {repo.stars}</span>}
      </div>
      {repo.description && <p className="mt-2 flex-1 text-sm leading-relaxed text-haze">{repo.description}</p>}
      <p className="mt-3 font-mono text-xs uppercase tracking-wider text-haze">
        {[repo.language, `Updated ${updated}`].filter(Boolean).join(" · ")}
      </p>
      {repo.topics.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Topics">
          {repo.topics.slice(0, 4).map((t) => (
            <li key={t} className="border border-line px-2 py-0.5 font-mono text-xs text-haze">
              {t}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex gap-4 border-t-2 border-line pt-2">
        <a href={repo.url} target="_blank" rel="noreferrer" className={`inline-flex min-h-11 items-center gap-2 font-semibold text-sun transition-colors duration-200 hover:text-white ${focusRing}`}>
          <GitHubIcon />
          Code<span className="sr-only"> for {repo.name}</span>
        </a>
        {repo.homepage && (
          <a href={repo.homepage} target="_blank" rel="noreferrer" className={`inline-flex min-h-11 items-center font-semibold text-sky transition-colors duration-200 hover:text-white ${focusRing}`}>
            Live demo<span className="sr-only"> of {repo.name}</span>
          </a>
        )}
      </div>
    </article>
  );
}

export default async function ProjectsSection() {
  const repos = await portfolioRepos();
  return (
    <Section id="projects">
      <ul className="grid items-start gap-8 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <li key={p.title}>
            <ProjectCard project={p} />
          </li>
        ))}
      </ul>
      {repos.length > 0 && (
        <div className="mt-16">
          <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-haze">More on GitHub</h3>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {repos.map((r) => (
              <li key={r.url}>
                <RepoCard repo={r} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}
