import { Icon } from "@/components/icons";
import { profile } from "@/lib/profile";
import Section from "./Section";
import SkillChip from "./SkillChip";

export default function SkillsSection() {
  return (
    <Section id="skills">
      <div className="grid gap-6 sm:grid-cols-2">
        {profile.skills.map((group) => (
          <div key={group.area} className="panel p-6">
            <h3 className="flex items-center gap-3 font-display text-xl text-(--bit)">
              <span className="grid size-10 place-items-center border-2 border-(--bit)">
                <Icon name={group.icon} />
              </span>
              {group.area}
              <span className="ml-auto font-mono text-xs text-haze">
                {String(group.items.length).padStart(2, "0")}
              </span>
            </h3>
            <ul className="mt-5 flex flex-wrap gap-2.5">
              {group.items.map((item) => (
                // Power-up chip: skewed like the hero chips, charges up and sings on hover.
                <SkillChip key={item} label={item} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
