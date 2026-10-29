import { GitHubIcon, Icon, LinkedInIcon } from "@/components/icons";
import ContactForm from "@/components/ContactForm";
import { site } from "@/lib/site";
import CopyEmail from "./CopyEmail";
import Section from "./Section";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky";

const SOCIALS = [
  { label: "GitHub", href: site.socials.github, handle: "hrrssshhhhhh", icon: <GitHubIcon /> },
  { label: "LinkedIn", href: site.socials.linkedin, handle: "Harsh Jogani", icon: <LinkedInIcon /> },
  { label: "Résumé", href: site.resume, handle: "PDF, 2 pages", icon: <Icon name="file" className="size-5" /> },
];

export default function ContactSection() {
  return (
    <Section id="contact">
      <p className="max-w-prose text-lg leading-relaxed text-haze">
        Have a role, a project, or just a question? My inbox is open.
      </p>

      <div className="mt-8">
        <ContactForm />
      </div>

      <p className="mt-12 font-mono text-xs uppercase tracking-[0.25em] text-haze">Or reach me directly</p>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <a
          href={`mailto:${site.email}`}
          className={`inline-flex min-h-14 max-w-full items-center gap-3 break-all border-2 border-(--bit) px-6 font-bold text-(--bit) transition-colors duration-150 hover:bg-(--bit) hover:text-night sm:text-lg ${focusRing}`}
        >
          <Icon name="mail" className="size-5 shrink-0" />
          {site.email}
        </a>
        <CopyEmail email={site.email} />
      </div>

      <ul className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SOCIALS.map((s) => (
          <li key={s.label}>
            <a
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className={`group flex min-h-14 items-center gap-4 border-2 border-line bg-night-2 p-3 transition-colors duration-200 hover:border-(--bit) ${focusRing}`}
            >
              <span className="grid size-10 place-items-center border-2 border-line text-haze transition-colors duration-200 group-hover:border-(--bit) group-hover:bg-(--bit) group-hover:text-night">
                {s.icon}
              </span>
              <span>
                <span className="block font-semibold">{s.label}</span>
                <span className="block text-sm text-haze">{s.handle}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
