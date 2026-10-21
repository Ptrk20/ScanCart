import assert from "node:assert/strict";
import test from "node:test";
import { createSession, validateSession } from "../src/lib/shopping/session.ts";
import { calculateBudget } from "../src/lib/shopping/budget.ts";

test("trims store and parses decimal pesos exactly into centavos", () => {
  assert.deepEqual(validateSession({ store: "  SM Supermarket  ", budget: "3000.29" }), {
    ok: true, value: { store: "SM Supermarket", budget: 300029 },
  });
  assert.equal(validateSession({ store: "Store", budget: "0.10" }).value.budget, 10);
});

test("distinguishes an optional budget from an explicit zero", () => {
  assert.equal(validateSession({ store: "Store", budget: "  " }).value.budget, null);
  assert.equal(validateSession({ store: "Store", budget: "0" }).value.budget, 0);
});

test("reports missing store, negative and invalid budgets", () => {
  assert.deepEqual(validateSession({ store: " \t ", budget: "-1" }), {
    ok: false, errors: { store: "Please enter a store name.", budget: "Budget cannot be negative." },
  });
  for (const budget of ["NaN", "Infinity", "abc", "1e3", "3,000", "1.001", ".", "--1", "99999999999999999"]) {
    assert.equal(validateSession({ store: "Store", budget }).ok, false, budget);
  }
});

test("creates a clean active session and supports the requested budget scenarios", () => {
  const result = validateSession({ store: "SM Supermarket", budget: "3000" });
  assert.equal(result.ok, true);
  const session = createSession(result.value, "session-id", "2026-10-21T09:00:00.000Z");
  assert.deepEqual(session, {
    id: "session-id", store: "SM Supermarket", budget: 300000,
    startedAt: "2026-10-21T09:00:00.000Z", status: "active", completedAt: null, items: [],
  });
  assert.equal(calculateBudget(session.budget, session.items).remaining, 300000);
  assert.equal(calculateBudget(session.budget, [{ price: 125000, quantity: 1 }]).remaining, 175000);
  assert.equal(calculateBudget(session.budget, [{ price: 315000, quantity: 1 }]).overBudgetBy, 15000);
});
