// Projects. Adding one is a new entry here, no page code.

import type { IconName } from "@/components/icons";

export type Project = {
  title: string;
  icon: IconName;
  description: string;
  highlights: string[]; // shown when the card is opened
  tech: string[];
  year: number;
  links: { live?: string; github?: string };
  image?: string; // path under public/
  featured: boolean;
};

export const projects: Project[] = [
  {
    title: "NeuroSeg-ICH",
    icon: "scan",
    description:
      "Deep learning pipeline that segments intracranial hemorrhage in brain CT scans. Custom ResUNet trained with BCE + Dice loss on PhysioNet CT-ICH; best validation Dice 0.63.",
    highlights: [
      "Residual U-Net written from scratch, with residual skip connections for better gradient flow.",
      "BCE + Dice loss (pos_weight 20) and ReduceLROnPlateau to handle severe class imbalance.",
      "Precision ~0.74, recall ~0.44; Dice 0.94 on the best inference slice.",
      "Adaptive threshold search plus CT overlays, contours, and error maps for analysis.",
    ],
    tech: ["Python", "PyTorch", "ResUNet", "Medical Imaging"],
    year: 2026,
    links: { github: "https://github.com/hrrssshhhhhh/NeuroSeg-ICH" },
    featured: true,
  },
  {
    title: "SalarySync",
    icon: "wallet",
    description:
      "Full-stack personal finance app that turns a monthly salary into a per-category plan and shows, as you log expenses, what is still safe to spend. Live on Vercel with Google sign-in.",
    highlights: [
      "Next.js 16 Server Components and Server Actions on Supabase Postgres via Drizzle ORM; totals and breakdowns computed in SQL.",
      "Data isolation in three layers: verified session on every request, user id on every query, and Row Level Security blocking the public API.",
      "Salary envelopes with 90% warnings, a running-total sparkline against last month's pace, and separate investment tracking.",
      "Zod validation at every action, dark mode with no flash on load, and reduced-motion and WCAG-aware interactions.",
    ],
    tech: ["Next.js", "TypeScript", "PostgreSQL", "Supabase", "Drizzle"],
    year: 2026,
    links: { live: "https://salarysyncc.vercel.app/", github: "https://github.com/hrrssshhhhhh/SalarySyncc" },
    featured: true,
  },
  {
    title: "LeaseGen",
    icon: "file",
    description:
      "Full-stack app for creating, managing, and exporting residential lease agreements, with live preview, one-click PDF export, a clause library, and JWT auth with per-user data isolation.",
    highlights: [
      "Every API call checks the JWT and returns 403 on access to another user's data.",
      "Dashboard with tenant/address search, rent-range filter, date sort, and bulk actions.",
      "Reusable clause library and rental-law reference built into the editor.",
      "Flask REST API on SQLite, with server-side PDF rendering.",
    ],
    tech: ["React", "Flask", "SQLite", "JWT"],
    year: 2026,
    links: { github: "https://github.com/hrrssshhhhhh/LeaseGen" },
    featured: true,
  },
  {
    title: "Online Retail Store",
    icon: "cart",
    description:
      "Cloud-connected Android shopping app with Firebase auth, real-time product search, and a wishlist and cart linked to each user.",
    highlights: [
      "Schema linking users to wishlist and cart entities by unique IDs.",
      "Case-insensitive search and live cart badges through Firebase listeners.",
      "Tested auth, search accuracy, discount logic, and cart consistency.",
    ],
    tech: ["Kotlin", "Firebase", "Android"],
    year: 2025,
    links: { github: "https://github.com/hrrssshhhhhh/retail-data-architecture" },
    featured: true,
  },
];
