import { site } from "@/lib/site";
import HeroStage from "./HeroStage";
import PlayButton from "./PlayButton";
import { RestoredBadge, SoundToggle } from "./HeroControls";
import { GitHubIcon, Icon, LinkedInIcon, RingIcon } from "@/components/icons";

const SKILLS = ["Full-stack Web", "Android", "Deep Learning"];

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";
const social = `grid size-11 place-items-center rounded-full text-white/80 transition-colors duration-200 hover:bg-white/10 hover:text-white ${focusRing}`;

export default function Hero() {
  const [first, ...rest] = site.name.split(" ");

  return (
    <HeroStage>
      {/* Text column ignores the pointer so the 3D scene behind stays interactive. */}
      <div className="pointer-events-none relative mx-auto flex min-h-svh max-w-6xl flex-col justify-end px-6 pb-10 pt-28 sm:pb-14 transition-opacity duration-500 group-data-playing:opacity-0 md:justify-center md:pb-24">
        {/* Phones: the hint sits just under the fox; no hover on touch, so it's all taps. */}
        <p aria-hidden className="glass mb-3 w-fit rounded-full whitespace-nowrap px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-white/85 md:hidden">
          Tap the fox to backflip · Tap the crystal
        </p>
        <p className="glass mb-4 inline-flex w-fit sm:mb-5 items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.22em] text-white/90">
          <span className="size-2 rounded-full bg-blossom shadow-[0_0_10px_var(--color-blossom)]" aria-hidden />
          Software Developer
        </p>

        <h1 className="font-display text-[clamp(3.4rem,10.5vw,8rem)] leading-[0.9] tracking-tight text-white soft-glow">
          {first}
          <br />
          <span className="bg-gradient-to-r from-sun via-peach to-blossom bg-clip-text text-transparent [text-shadow:none]">
            {rest.join(" ")}
          </span>
        </h1>

        <p className="mt-4 max-w-md text-base leading-relaxed text-white/85 sm:mt-6 sm:text-lg md:text-xl">{site.tagline}</p>

        <ul className="mt-5 hidden flex-wrap gap-2 sm:flex" aria-label="Focus areas">
          {SKILLS.map((s) => (
            <li key={s} className="glass rounded-full px-3.5 py-1 text-sm font-medium text-white">
              {s}
            </li>
          ))}
        </ul>

        <div className="pointer-events-auto mt-6 flex flex-wrap items-center gap-3 sm:mt-9">
          <PlayButton
            className={`relative inline-flex min-h-14 items-center gap-3 rounded-full bg-gradient-to-r from-white via-[#ffe3ef] to-peach px-8 font-display text-xl uppercase tracking-wider text-violet shadow-[0_0_0_1px_rgb(255_255_255/0.5),0_10px_40px_rgb(255_143_191/0.55)] transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgb(255_255_255/0.7),0_14px_60px_rgb(255_143_191/0.85)] ${focusRing}`}
          />
          <SoundToggle className={focusRing} />
          <a
            href="#portfolio"
            aria-label="Skip to portfolio"
            className={`inline-flex min-h-12 items-center gap-2 rounded-full px-3 font-semibold text-white transition-colors duration-200 hover:bg-white/10 ${focusRing}`}
          >
            <span className="perspective-[400px]">
              <RingIcon className="size-8" />
            </span>
            <span>
              Skip<span className="hidden sm:inline"> to portfolio</span>
            </span>
          </a>
        </div>

        <div className="pointer-events-auto mt-4 flex flex-wrap items-center gap-3 sm:mt-6">
          <RestoredBadge />
          <div className="flex items-center gap-1">
            <a href={site.socials.github} aria-label="GitHub" target="_blank" rel="noreferrer" className={social}>
              <GitHubIcon />
            </a>
            <a href={site.socials.linkedin} aria-label="LinkedIn" target="_blank" rel="noreferrer" className={social}>
              <LinkedInIcon />
            </a>
            <a
              href={site.resume}
              target="_blank"
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-white/80 transition-colors duration-200 hover:bg-white/10 hover:text-white ${focusRing}`}
            >
              <Icon name="file" className="size-5" />
              Résumé<span className="sr-only"> (PDF)</span>
            </a>
          </div>
        </div>
      </div>

      <p
        aria-hidden
        className="pointer-events-none absolute right-5 top-1/2 hidden -translate-y-1/2 text-4xl font-black tracking-[0.3em] text-white/20 transition-opacity duration-500 [writing-mode:vertical-rl] group-data-playing:opacity-0 lg:block"
      >
        ハーシュ・ジョガニ
      </p>

      <p
        aria-hidden
        className="glass pointer-events-none absolute bottom-5 right-6 hidden rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-white/85 transition-opacity duration-500 group-data-playing:opacity-0 md:block"
      >
        Wake the fox · Tap for a backflip · Click the crystal
      </p>
    </HeroStage>
  );
}
