import { Icon } from "@/components/icons";
import { profile } from "@/lib/profile";
import CgpaMeter from "./CgpaMeter";
import Section from "./Section";

export default function EducationSection() {
  const { education, certifications } = profile;

  return (
    <Section id="education">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="panel p-6 md:p-8">
          <p className="font-mono text-xs uppercase tracking-wider text-(--bit)">
            {education.start} – {education.end}
          </p>
          <h3 className="mt-2 text-2xl font-bold">{education.degree}</h3>
          <p className="mt-1 text-haze">{education.school}</p>
          <div className="mt-8">
            <CgpaMeter value={education.cgpa} max={education.cgpaMax} />
          </div>
          <ul className="mt-6 space-y-1 text-haze">
            {education.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-haze">
            Achievements · {certifications.length} unlocked
          </h3>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {certifications.map((c) => (
              // Achievement tile: icon badge fills with the bit color on hover.
              <li
                key={c.title}
                className="group flex gap-4 border-2 border-line bg-night-2 p-4 transition-colors duration-200 hover:border-(--bit)"
              >
                <span className="grid size-11 shrink-0 place-items-center border-2 border-(--bit) text-(--bit) transition-colors duration-200 group-hover:bg-(--bit) group-hover:text-night">
                  <Icon name={c.icon} />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold leading-snug">{c.title}</span>
                  <span className="mt-1 block text-sm text-haze">
                    {c.by}
                    {"year" in c && ` · ${c.year}`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
