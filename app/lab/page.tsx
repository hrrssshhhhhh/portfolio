import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LabLoader from "@/components/lab/LabLoader";

export const metadata: Metadata = { title: "Lab", robots: { index: false } };

// Look development for the key frames (PLAN.md Step 16). Dev only.
export default function LabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="flex-1">
      <LabLoader />
    </main>
  );
}
