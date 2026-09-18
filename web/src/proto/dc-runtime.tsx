"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/immutability */
// The React Compiler lint rules above are disabled on purpose: the logic instance is a
// deliberately mutable store (state, props, pending callbacks), mirroring the prototype runtime.
// Minimal React port of the prototype's design-component runtime: a logic
// class with setState() and renderVals(), plus the helpers the generated
// views call. Templates render against `{ ...props, ...logic.renderVals() }`.
import React, { useEffect, useReducer, useRef, useState } from "react";

type Host = {
  setLogicState: (update: any, cb?: () => void) => void;
  forceUpdate: () => void;
};

export class DCLogic {
  props: any;
  state: any = {};
  __host?: Host;
  constructor(props?: any) {
    this.props = props || {};
  }
  setState(update: any, cb?: () => void) {
    this.__host?.setLogicState(update, cb);
  }
  forceUpdate() {
    this.__host?.forceUpdate();
  }
  componentDidMount() {}
  componentDidUpdate() {}
  componentWillUnmount() {}
  /** The flat object the template renders against (merged over props). */
  renderVals(): any {
    return {};
  }
}

export function useDcLogic(Logic: new (props: any) => DCLogic, props: any) {
  const [, bump] = useReducer((x: number) => x + 1, 0);
  // The logic instance is an intentionally mutable store (like the prototype runtime's
  // host component); it is created once and re-rendered through the reducer above.
  const [logic] = useState(() => {
    const instance = new Logic(props) as DCLogic & { __pending: Array<() => void> };
    instance.__pending = [];
    instance.__host = {
      setLogicState(update, cb) {
        const prev = instance.state;
        const patch = typeof update === "function" ? update(prev) : update;
        instance.state = { ...prev, ...patch };
        if (cb) instance.__pending.push(cb);
        bump();
      },
      forceUpdate: () => bump(),
    };
    return instance;
  });
  const mounted = useRef(false);
  useEffect(() => {
    logic.props = props;
    if (!mounted.current) {
      mounted.current = true;
      logic.componentDidMount();
    } else {
      logic.componentDidUpdate();
    }
    const pending = logic.__pending;
    logic.__pending = [];
    pending.forEach((cb) => cb());
  });
  useEffect(() => () => logic.componentWillUnmount(), [logic]);
  let vals: any = props;
  try {
    vals = { ...props, ...(logic.renderVals() || {}) };
  } catch (e) {
    console.error(e);
  }
  return vals;
}

const kebabToCamel = (s: string) => s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/** Inline style string -> React style object (same rules as the prototype runtime). */
export function cssToObj(css: string): React.CSSProperties {
  const o: Record<string, string> = {};
  for (const decl of String(css).split(";")) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    o[prop.startsWith("--") ? prop : kebabToCamel(prop)] = decl.slice(i + 1).trim();
  }
  return o as React.CSSProperties;
}

export const dcList = (x: any): any[] => (Array.isArray(x) ? x : []);

export const dcText = (v: any) => {
  if (v === null || v === undefined || typeof v === "boolean") return null;
  if (React.isValidElement(v) || Array.isArray(v)) return v;
  return String(v);
};

export const dcVal = (v: any, key: string) => (v === undefined ? (key === "checked" ? false : "") : v);

export const dcStr = (v: any) => (v === null || v === undefined ? "" : v);
