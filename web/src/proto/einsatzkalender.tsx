"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderEinsatzkalender } from "./einsatzkalender.view";

/** Shared assignment calendar (instructor detail and «Meine Einsätze»). Pure template over its props. */
export function Einsatzkalender(props: {
  cal: any;
  rows: any[];
  leadCount: number;
  backupCount: number;
  empty: boolean;
}) {
  return <>{renderEinsatzkalender(props)}</>;
}
