"use client";
import dynamic from "next/dynamic";

// The prototype keeps all state in the browser and reads the clock, so it is rendered client-side only.
const SvblPlanung = dynamic(() => import("@/proto/svbl-planung"), { ssr: false });

export default function Home() {
  return <SvblPlanung />;
}
