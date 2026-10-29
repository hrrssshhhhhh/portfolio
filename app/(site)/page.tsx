import Hero from "@/components/hero/Hero";
import BitRail from "@/components/sections/BitRail";
import AboutSection from "@/components/sections/AboutSection";
import ContactSection from "@/components/sections/ContactSection";
import EducationSection from "@/components/sections/EducationSection";
import LatestPosts from "@/components/sections/LatestPosts";
import ProjectsSection from "@/components/sections/ProjectsSection";
import SkillsSection from "@/components/sections/SkillsSection";

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <div id="portfolio">
        <AboutSection />
        <EducationSection />
        <SkillsSection />
        <ProjectsSection />
        <LatestPosts />
        <ContactSection />
      </div>
      <BitRail />
    </main>
  );
}
