import type { CSSProperties, ReactNode } from "react";
import Container from "@/components/Container";
import { sections, type SectionId } from "@/lib/sections";
import BitLabel from "./BitLabel";

// Frame for every data bit: anchor id, game-screen label, and title. `--bit` is the bit's color.
export default function Section({ id, children }: { id: SectionId; children: ReactNode }) {
  const index = sections.findIndex((s) => s.id === id);
  const { name, color } = sections[index];

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="py-20 md:py-28"
      style={{ "--bit": `var(--color-${color})` } as CSSProperties}
    >
      <Container>
        <BitLabel text={`Data bit ${String(index + 1).padStart(2, "0")} / ${name}`} />
        <h2
          id={`${id}-title`}
          className="mt-3 font-display text-4xl tracking-tight title-shadow md:text-6xl"
        >
          {name}
        </h2>
        <div className="mt-12">{children}</div>
      </Container>
    </section>
  );
}
