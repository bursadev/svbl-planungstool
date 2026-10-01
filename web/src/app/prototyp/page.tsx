"use client";
import dynamic from "next/dynamic";
import "@/proto/proto.css";

// The prototype keeps all state in the browser and reads the clock, so it is rendered client-side only.
const SvblPlanung = dynamic(() => import("@/proto/svbl-planung"), { ssr: false });

/** Hardcoded prototype for demos. Its styles are scoped under `.proto` (see proto.css). */
export default function PrototypPage() {
  return (
    <div className="proto">
      <SvblPlanung />
    </div>
  );
}
