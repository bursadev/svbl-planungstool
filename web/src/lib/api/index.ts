export {
  apiFetch,
  ApiError,
  API_BASE_URL,
  type ApiFetchOptions,
  type ApiFetcher,
  type ApiFieldError,
} from "./client";
export { setAuthTokenGetter } from "./auth-token";
export { withQuery } from "./query";
export { getMe, type Me } from "./me";
export * from "./locations";
export * from "./devices";
// `serverApiFetch` is deliberately not re-exported here: import it from "@/lib/api/server" so the
// Clerk server module never ends up in a client bundle.
export * from "./skills";
export * from "./certificate-types";
export * from "./device-types";
export * from "./instructors";
export * from "./course-types";
export * from "./curriculum";
export * from "./vocational-schools";
export * from "./apprentices";
export * from "./training-companies";
export * from "./customers";
export * from "./users";
export * from "./settings";
