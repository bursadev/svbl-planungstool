/** Roles Clerk stores in `publicMetadata.role`; the backend enforces them, the UI only hides. */
export const USER_ROLES = ["planner", "sales", "management", "instructor", "trainer", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

/** Reads the role from Clerk's `publicMetadata`; `undefined` when unset or unknown. */
export function roleFromMetadata(metadata: Record<string, unknown> | null | undefined): UserRole | undefined {
  const role = metadata?.role;
  return isUserRole(role) ? role : undefined;
}
