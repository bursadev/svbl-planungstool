import { apiFetch } from "./client";
import type { ApiFetcher } from "./request";

/**
 * The subset of `GET /certificate-types` the Zertifikat dialog needs. The full type and its CRUD
 * live in `certificate-types.ts` (Kataloge slice).
 */
export type CertificateTypeRef = {
  id: string;
  code: string;
  name: string;
  /** `null` = the certificate does not expire. */
  validityYears: number | null;
};

export function listCertificateTypeRefs(fetcher: ApiFetcher = apiFetch): Promise<CertificateTypeRef[]> {
  return fetcher<CertificateTypeRef[]>("/certificate-types");
}
