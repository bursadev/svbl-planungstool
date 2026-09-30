"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { setAuthTokenGetter } from "@/lib/api";

/**
 * Registers Clerk's `getToken` with the API client so requests to the backend
 * carry the session token. Renders nothing.
 */
export function AuthTokenBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);
  return null;
}
