import { profile } from "@/lib/profile";
import QuestLog from "./QuestLog";
import Section from "./Section";

export default function AboutSection() {
  return (
    <Section id="about">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div className="max-w-prose space-y-5 text-lg leading-relaxed text-haze">
          {profile.about.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>

        <div>
          <h3 className="mb-5 font-mono text-xs uppercase tracking-[0.25em] text-haze">
            Quest log · Experience
          </h3>
          <QuestLog jobs={profile.experience} />
        </div>
      </div>
    </Section>
  );
}
