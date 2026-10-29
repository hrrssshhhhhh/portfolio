import Link from "next/link";
import Container from "@/components/Container";
import { RingIcon } from "@/components/icons";
import { site } from "@/lib/site";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export default function Header() {
  return (
    // Fades out with the hero text while the crystal bursts on the way to /play.
    <header className="fixed inset-x-0 top-4 z-50 transition-opacity duration-500 [body:has([data-playing])_&]:pointer-events-none [body:has([data-playing])_&]:opacity-0">
      <Container>
        {/* Below md the links wrap onto a second row instead of hiding in a menu. */}
        <div className="glass flex flex-wrap items-center justify-between gap-x-6 rounded-3xl px-5 py-1.5 md:rounded-full md:py-2">
          <Link href="/" className={`flex min-h-11 items-center font-display text-lg tracking-wide text-white soft-glow ${focusRing}`}>
            {site.name}
          </Link>

          <nav aria-label="Main" className="order-last w-full md:order-none md:w-auto">
            <ul className="flex justify-between gap-1 md:gap-2">
              {site.nav
                .filter((item) => item.href !== "/")
                .map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-white/80 transition-colors duration-200 hover:bg-white/10 hover:text-white ${focusRing}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>

          <Link
            href="/play"
            className={`inline-flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-r from-white to-peach px-4 font-display text-sm uppercase tracking-wider text-violet shadow-[0_6px_24px_rgb(255_143_191/0.5)] transition-shadow duration-200 hover:shadow-[0_8px_32px_rgb(255_143_191/0.8)] ${focusRing}`}
          >
            <span className="perspective-[200px]">
              <RingIcon className="size-5" />
            </span>
            Play
          </Link>
        </div>
      </Container>
    </header>
  );
}
