const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export type MoneyInputResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

function decimalToCentavos(decimal: string): number {
  const [coefficient, exponent = "0"] = decimal.split("e");
  const [whole, fraction = ""] = coefficient.split(".");
  const digits = whole + fraction;
  const shift = Number(exponent) + 2 - fraction.length;
  const end = digits.length + shift;
  // Round half-up in decimal text, before any binary floating-point arithmetic.
  const integer = shift >= 0 ? digits + "0".repeat(shift) : digits.slice(0, Math.max(0, end));
  const roundUp = shift < 0 && end >= 0 && Number(digits[end]) >= 5;
  const centavos = Number(integer || "0") + (roundUp ? 1 : 0);
  assertCentavos(centavos);
  return centavos;
}

export function toCentavos(pesos: number): number {
  if (!Number.isFinite(pesos) || pesos < 0) {
    throw new RangeError("Peso amounts must be finite and nonnegative.");
  }
  return decimalToCentavos(pesos.toString());
}

export function fromCentavos(centavos: number): number {
  assertCentavos(centavos);
  return centavos / 100;
}

export function parseMoneyInput(input: string, label: "Price" | "Budget"): MoneyInputResult {
  const amount = input.trim();
  if (/^-\d+(?:\.\d+)?$/.test(amount) && Number(amount) < 0) {
    return { ok: false, error: `${label} cannot be negative.` };
  }
  const pattern = label === "Price" ? /^\d+(?:\.\d+)?$/ : /^\d+(?:\.\d{1,2})?$/;
  if (!pattern.test(amount)) {
    return { ok: false, error: `Please enter a valid ${label.toLowerCase()}.` };
  }
  try {
    return { ok: true, value: decimalToCentavos(amount) };
  } catch (error) {
    if (error instanceof RangeError) {
      return { ok: false, error: `Please enter a smaller ${label.toLowerCase()}.` };
    }
    throw error;
  }
}

export function moneyInputValue(centavos: number): string {
  assertCentavos(centavos);
  return `${Math.trunc(centavos / 100)}.${String(centavos % 100).padStart(2, "0")}`;
}

export function assertCentavos(value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError("Amounts must be safe integer centavos.");
  }
}

export function formatCurrency(centavos: number): string {
  assertCentavos(centavos);
  const whole = Math.trunc(centavos / 100) || (centavos < 0 ? -0 : 0);
  const fraction = String(Math.abs(centavos % 100)).padStart(2, "0");
  return pesoFormatter.formatToParts(whole).map((part) => part.type === "fraction" ? fraction : part.value).join("");
}

export function assertQuantity(quantity: number): void {
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw new RangeError("Quantity must be a positive whole number.");
  }
}

export function itemSubtotal(price: number, quantity: number): number {
  assertCentavos(price);
  if (price < 0) {
    throw new RangeError("Price cannot be negative.");
  }
  assertQuantity(quantity);
  const subtotal = price * quantity;
  assertCentavos(subtotal);
  return subtotal;
}
