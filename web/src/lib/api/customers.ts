import { apiFetch } from "./client";
import { withQuery } from "./query";
import type { ApiFetcher } from "./request";
import { fetchPage, type ListPageParams, type Page } from "./tabular";
import type { Language } from "../format";

/** An adult course participant, optionally sent by a Kunde. */
export type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  language: Language;
  notes: string | null;
  customer: { id: string; name: string } | null;
};

/** One row of `GET /customers`. */
export type CustomerRow = {
  id: string;
  name: string;
  addressLine: string | null;
  postalCode: string | null;
  city: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  /** Reference in Abacus, the leading system for invoicing. */
  externalRefAbacus: string | null;
  externalRefOdaorg: string | null;
  active: boolean;
  participantCount: number;
  siteCount: number;
};

/** `GET /customers/:id`: the row plus its Teilnehmende and Kundenstandorte. */
export type Customer = CustomerRow & {
  participants: Participant[];
  /** Customer sites: locations with `kind = customer_site` of this customer. */
  sites: { id: string; code: string; name: string; city: string | null; active: boolean }[];
};

export type CreateCustomer = {
  name: string;
  addressLine?: string | null;
  postalCode?: string | null;
  city?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  externalRefAbacus?: string | null;
  externalRefOdaorg?: string | null;
  active?: boolean;
};

export type UpdateCustomer = Partial<CreateCustomer>;

export type CreateParticipant = {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  language: Language;
  customerId?: string | null;
  notes?: string | null;
};

export type UpdateParticipant = Partial<CreateParticipant>;

/** Filters of `GET /customers` and its CSV export; `q` matches name, address, contact and the external refs. */
export type CustomerFilters = ListPageParams & {
  q?: string;
};

/** Filters of `GET /participants` and its CSV export. Teilnehmende cannot be archived, so `archive` is ignored. */
export type ParticipantFilters = Omit<ListPageParams, "archive"> & {
  /** Matches first and last name, e-mail and the Kunde's name. */
  q?: string;
  customerId?: string;
};

export const CUSTOMERS_PATH = "/customers";
export const PARTICIPANTS_PATH = "/participants";

/** The filters as API query parameters (also for «Gefilterte Ansicht exportieren»). */
export function customerQuery(filters: CustomerFilters = {}): Record<string, string | number | undefined> {
  return { ...filters };
}

/** The filters as API query parameters (also for «Gefilterte Ansicht exportieren»). */
export function participantQuery(filters: ParticipantFilters = {}): Record<string, string | number | undefined> {
  return { ...filters };
}

/**
 * Kunden sorted by name, all of them unless `page` is set. Defaults to the browser client;
 * Server Components pass `serverApiFetch` from `@/lib/api/server`.
 */
export function listCustomers(filters: CustomerFilters = {}, fetcher: ApiFetcher = apiFetch): Promise<CustomerRow[]> {
  return fetcher<CustomerRow[]>(withQuery(CUSTOMERS_PATH, customerQuery(filters)));
}

/** One page of Kunden with the total number of matches. */
export function listCustomersPage(filters: CustomerFilters, fetcher: ApiFetcher = apiFetch): Promise<Page<CustomerRow>> {
  return fetchPage<CustomerRow>(withQuery(CUSTOMERS_PATH, customerQuery(filters)), fetcher);
}

/** One Kunde with Teilnehmenden and Standorten; throws `ApiError` 404 when it does not exist. */
export function getCustomer(id: string, fetcher: ApiFetcher = apiFetch): Promise<Customer> {
  return fetcher<Customer>(`/customers/${encodeURIComponent(id)}`);
}

export function createCustomer(dto: CreateCustomer, fetcher: ApiFetcher = apiFetch): Promise<Customer> {
  return fetcher<Customer>("/customers", { method: "POST", body: dto });
}

export function updateCustomer(id: string, dto: UpdateCustomer, fetcher: ApiFetcher = apiFetch): Promise<Customer> {
  return fetcher<Customer>(`/customers/${encodeURIComponent(id)}`, { method: "PATCH", body: dto });
}

/** Hard delete; 409 with a message while participants or sites still reference the customer. */
export function deleteCustomer(id: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(`/customers/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Teilnehmende sorted by last name, all of them unless `page` is set. */
export function listParticipants(
  filters: ParticipantFilters = {},
  fetcher: ApiFetcher = apiFetch,
): Promise<Participant[]> {
  return fetcher<Participant[]>(withQuery(PARTICIPANTS_PATH, participantQuery(filters)));
}

/** One page of Teilnehmende with the total number of matches. */
export function listParticipantsPage(
  filters: ParticipantFilters,
  fetcher: ApiFetcher = apiFetch,
): Promise<Page<Participant>> {
  return fetchPage<Participant>(withQuery(PARTICIPANTS_PATH, participantQuery(filters)), fetcher);
}

export function createParticipant(dto: CreateParticipant, fetcher: ApiFetcher = apiFetch): Promise<Participant> {
  return fetcher<Participant>("/participants", { method: "POST", body: dto });
}

export function updateParticipant(
  id: string,
  dto: UpdateParticipant,
  fetcher: ApiFetcher = apiFetch,
): Promise<Participant> {
  return fetcher<Participant>(`/participants/${encodeURIComponent(id)}`, { method: "PATCH", body: dto });
}

/** Hard delete; 409 with a message while enrollments still reference the participant. */
export function deleteParticipant(id: string, fetcher: ApiFetcher = apiFetch): Promise<void> {
  return fetcher<void>(`/participants/${encodeURIComponent(id)}`, { method: "DELETE" });
}
