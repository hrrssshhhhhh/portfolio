"use client";

import dynamic from "next/dynamic";

// WebGL only runs in the browser.
const Lab = dynamic(() => import("./Lab"), { ssr: false });

export default function LabLoader() {
  return <Lab />;
}
