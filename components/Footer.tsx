import Container from "@/components/Container";
import { GitHubIcon, LinkedInIcon } from "@/components/icons";
import { site } from "@/lib/site";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky";

// Cached so the prerender allows the clock read; the year updates on each build.
async function Year() {
  "use cache";
  return new Date().getFullYear();
}

export default function Footer() {
  return (
    <footer className="border-t-2 border-line bg-night-2">
      <Container className="flex flex-col items-center justify-between gap-4 py-8 text-sm text-haze sm:flex-row">
        <p>
          © <Year /> {site.name}
        </p>

        <div className="flex items-center gap-1">
          <a
            href={`mailto:${site.email}`}
            className={`flex min-h-11 items-center px-2 font-semibold transition-colors duration-200 hover:text-sakura ${focusRing}`}
          >
            {site.email}
          </a>
          <a
            href={site.socials.github}
            aria-label="GitHub"
            target="_blank"
            rel="noreferrer"
            className={`grid size-11 place-items-center transition-colors duration-200 hover:text-sakura ${focusRing}`}
          >
            <GitHubIcon />
          </a>
          <a
            href={site.socials.linkedin}
            aria-label="LinkedIn"
            target="_blank"
            rel="noreferrer"
            className={`grid size-11 place-items-center transition-colors duration-200 hover:text-sakura ${focusRing}`}
          >
            <LinkedInIcon />
          </a>
        </div>
      </Container>
    </footer>
  );
}
