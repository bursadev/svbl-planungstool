"use client";

import { useEffect } from "react";
import Userback from "@userback/widget";

const USERBACK_ACCESS_TOKEN = "A-4ZpPPe5LczvdcxjtN7NR41Dct";

/**
 * Initializes the Userback feedback widget once the app has mounted.
 *
 * Rendered from the root layout, so it runs once per page load. The loader
 * de-duplicates concurrent calls, which keeps React Strict Mode's double
 * effect harmless. The widget is deliberately not destroyed on unmount: the
 * root layout lives for the whole session, and destroying a shared pending
 * load would tear the widget down for the surviving effect.
 *
 * Once the app has authentication, identify the logged-in user by passing
 * `{ user_data: { id, info: { name, email } } }` as the second argument.
 */
export function UserbackWidget() {
  useEffect(() => {
    Userback(USERBACK_ACCESS_TOKEN).catch((error: unknown) => {
      console.warn("Userback widget failed to initialize", error);
    });
  }, []);

  return null;
}
