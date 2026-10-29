// Site-wide info and links. Edit here; every page reads from this file.

export const site = {
  name: "Harsh Jogani",
  tagline: "Building reliable software across web, mobile, and AI.",
  description:
    "Harsh Jogani is a software developer who builds full-stack web apps, cloud-connected Android apps, and deep learning models for medical image segmentation.",
  // Absolute URL for the sitemap, robots and share links. Set SITE_URL once there's a custom domain;
  // on Vercel the production URL is picked up on its own.
  url:
    process.env.SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  location: "Ahmedabad, India",
  email: "harshjogani1303@gmail.com",
  resume: "/harsh-jogani-resume.pdf", // public/; replace the file to update it
  socials: {
    github: "https://github.com/hrrssshhhhhh",
    linkedin: "https://www.linkedin.com/in/harsh-jogani-bb5222265/",
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "About", href: "/#about" },
    { label: "Projects", href: "/#projects" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/#contact" },
  ],
} as const;
