import type { Metadata } from "next";
import GameLoader from "@/components/game/GameLoader";
import AboutSection from "@/components/sections/AboutSection";
import ContactSection from "@/components/sections/ContactSection";
import EducationSection from "@/components/sections/EducationSection";
import ProjectsSection from "@/components/sections/ProjectsSection";
import SkillsSection from "@/components/sections/SkillsSection";

export const metadata: Metadata = { title: "Play" };

// The sections are rendered here on the server and handed to the game, which shows them in
// the finale panel. One copy of the content, no client-side duplicate.
export default function PlayPage() {
  return (
    <main className="min-h-svh flex-1 bg-[#f2a7a0]">
      <h1 className="sr-only">Sakura Hills: a 30-second run to restore the portfolio</h1>
      <GameLoader
        sections={{
          about: <AboutSection />,
          education: <EducationSection />,
          skills: <SkillsSection />,
          projects: <ProjectsSection />,
          contact: <ContactSection />,
        }}
      />
    </main>
  );
}
