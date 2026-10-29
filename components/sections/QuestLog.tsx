"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";

type Job = {
  role: string;
  company: string;
  start: string;
  end: string;
  points: readonly string[];
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky";

// Experience as a game quest log: one entry open at a time, the current job open first.
export default function QuestLog({ jobs }: { jobs: readonly Job[] }) {
  const [open, setOpen] = useState(0);

  return (
    <ol className="space-y-3">
      {jobs.map((job, i) => {
        const isOpen = open === i;
        const active = job.end === "Present";
        return (
          <li
            key={job.role + job.start}
            className={`border-2 bg-night-2 transition-colors duration-200 ${isOpen ? "border-(--bit) shadow-[4px_4px_0_var(--bit)]" : "border-line hover:border-haze/50"}`}
          >
            <h4>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`quest-${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className={`flex w-full cursor-pointer items-center gap-4 p-4 text-left ${focusRing}`}
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center border-2 transition-colors duration-200 ${isOpen ? "border-(--bit) bg-(--bit) text-night" : "border-line text-haze"}`}
                >
                  <Icon name="briefcase" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{job.role}</span>
                  <span className="block text-sm text-haze">
                    {job.company} · {job.start} – {job.end}
                  </span>
                </span>
                {active && (
                  <span className="hidden border border-(--bit) px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-(--bit) sm:block">
                    Active
                  </span>
                )}
                <Icon
                  name="chevron"
                  className={`size-5 shrink-0 text-haze transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
            </h4>
            <div id={`quest-${i}`} hidden={!isOpen} className="px-4 pb-5 pl-[4.5rem]">
              <ul className="space-y-2 leading-relaxed text-haze">
                {job.points.map((pt) => (
                  <li key={pt} className="flex gap-3">
                    <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rotate-45 bg-(--bit)" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
