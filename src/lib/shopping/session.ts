import type { ActiveShoppingSession, Money } from "../../types/models";
import { parseMoneyInput } from "../utils/money.ts";

export interface SessionDraft {
  store: string;
  budget: string;
}

export interface SessionErrors {
  store?: string;
  budget?: string;
  form?: string;
}

export type SessionValidation =
  | { ok: true; value: { store: string; budget: Money | null } }
  | { ok: false; errors: SessionErrors };

export function validateSession(draft: SessionDraft): SessionValidation {
  const errors: SessionErrors = {};
  const store = draft.store.trim();
  const amount = draft.budget.trim();
  let budget: Money | null = null;
  if (!store) errors.store = "Please enter a store name.";
  if (amount) {
    const result = parseMoneyInput(amount, "Budget");
    if (result.ok) budget = result.value;
    else errors.budget = result.error;
  }
  return Object.keys(errors).length
    ? { ok: false, errors }
    : { ok: true, value: { store, budget } };
}

export function createSession(
  value: Extract<SessionValidation, { ok: true }>["value"],
  id: string,
  startedAt: string,
): ActiveShoppingSession {
  return { ...value, id, startedAt, status: "active", completedAt: null, items: [] };
}
