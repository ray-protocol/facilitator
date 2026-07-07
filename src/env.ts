import type { X402FacilitatorClientVariables } from "./middlewares/x402-facilitator-client";

export type Variables = X402FacilitatorClientVariables;

export interface Env {
  Bindings: CloudflareBindings;
  Variables: Variables;
}
