// About, experience, education, skills, and certifications. Edit here; the sections and the game read from this file.

export const profile = {
  about: [
    "I'm a software developer from Ahmedabad, India, working at Multitrade Softech. I build full-stack web apps, cloud-connected Android apps, and deep learning models.",
    "My major project, NeuroSeg-ICH, segments brain hemorrhages in CT scans with a ResUNet I wrote from scratch in PyTorch. Before that I built an Android retail app in Kotlin and Firebase during my internship at Softcolon Technology.",
    "I care about software that is reliable and easy to maintain, and I enjoy working in a team.",
  ],
  experience: [
    {
      role: "Software Developer",
      company: "Multitrade Softech Pvt. Ltd.",
      start: "Aug 2026",
      end: "Present",
      points: [
        "Onboarding as a full-time developer on the team's codebase, workflow, and engineering tools.",
        "Building working knowledge of the relational databases and data-handling practices used across projects.",
      ],
    },
    {
      role: "Software Developer Intern (Python)",
      company: "Multitrade Softech Pvt. Ltd.",
      start: "Jan 2026",
      end: "May 2026",
      points: [
        "Contributed to a confidential company project as part of the development team.",
        "Built NeuroSeg-ICH, a ResUNet for brain hemorrhage segmentation in PyTorch, as my major project (graded AA).",
      ],
    },
    {
      role: "Mobile Application Development Intern (Android)",
      company: "Softcolon Technology Pvt. Ltd.",
      start: "Jun 2025",
      end: "Jul 2025",
      points: [
        "Built a cloud-connected Android retail app in Kotlin with Firebase Realtime Database.",
        "Implemented case-insensitive search, real-time cart badges, and tested auth and cart logic in Agile sprints.",
      ],
    },
  ],
  education: {
    degree: "B.Tech in Information Technology",
    school: "Gandhinagar University (Gandhinagar Institute of Technology)",
    start: 2022,
    end: 2026,
    cgpa: 9.12,
    cgpaMax: 10,
    highlights: ["SGPA 9.67 in semester 8"],
  },
  skills: [
    { area: "Web", icon: "globe", items: ["React", "JavaScript", "Node.js", "Flask", "HTML", "CSS", "REST APIs", "JWT Auth"] },
    { area: "Android", icon: "phone", items: ["Kotlin", "Java", "Android Studio", "Firebase Realtime Database", "Firebase Auth"] },
    { area: "Deep Learning", icon: "chip", items: ["Python", "PyTorch", "ResUNet", "Medical Image Segmentation"] },
    { area: "Tools", icon: "wrench", items: ["Git", "SQLite", "C", "OOP", "VS Code", "Cursor"] },
  ],
  certifications: [
    { title: "Best 7th Sem Project Award", by: "Gandhinagar University", year: 2025, icon: "trophy" },
    { title: "Internship Completion, Software Developer (Python)", by: "Multitrade Softech", year: 2026, icon: "award" },
    { title: "Internship, Mobile Application Development", by: "Softcolon Technology", year: 2025, icon: "award" },
    { title: "Software Engineering Job Simulation", by: "JPMorgan Chase", icon: "briefcase" },
  ],
} as const;
