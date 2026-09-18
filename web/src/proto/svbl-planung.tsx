"use client";
import { useDcLogic } from "./dc-runtime";
import { Component as SvblPlanungLogic } from "./svbl-planung.logic";
import { renderSvblPlanung } from "./svbl-planung.view";

/** The whole prototype: login, sidebar shell and all screens, driven by hardcoded demo data. */
export default function SvblPlanung() {
  const vals = useDcLogic(SvblPlanungLogic, {});
  return <div className="sc-host">{renderSvblPlanung(vals)}</div>;
}
