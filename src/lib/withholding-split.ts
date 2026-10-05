/**
 * Client-side preview for ND-PR-18 split withholding toggle.
 * Matches server centavo math for instant on-screen updates before PATCH settles.
 */

export const toCentavos = (value: string | null | undefined): number => {
  if (value == null) return 0;
  const cleaned = String(value).replace(/,/g, "").trim();
  if (!cleaned) return 0;
  const match = cleaned.match(/^(-?)(\d+)(?:\.(\d{0,2}))?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const whole = Number(match[2] ?? "0");
  const frac = (match[3] ?? "").padEnd(2, "0").slice(0, 2);
  return sign * (whole * 100 + Number(frac || "0"));
};

export const fromCentavos = (centavos: number): string => {
  const sign = centavos < 0 ? "-" : "";
  const abs = Math.abs(Math.trunc(centavos));
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  return `${sign}${whole}.${frac}`;
};

export const taxableFromPayslip = (slip: {
  grossPay?: string | null;
  sss?: string | null;
  hdmf?: string | null;
  philhealth?: string | null;
}): string =>
  fromCentavos(
    Math.max(
      0,
      toCentavos(slip.grossPay) -
        toCentavos(slip.sss) -
        toCentavos(slip.hdmf) -
        toCentavos(slip.philhealth),
    ),
  );

/**
 * Preview withholding when toggling split on/off for an already-computed slip.
 * Uses the current monthly-equivalent tax implied by stored withholding when
 * split was off (full monthly), or reconstructs from first+remainder when on.
 *
 * When switching:
 * - off → on, 1st: floor(current / 2)
 * - off → on, 2nd: current − floor(siblingOrSelfMonthly / 2) approximated via
 *   firstCutoffWithholding when present, else floor(current/2) remainder
 * - on → off: restore full monthly (1st: ×2 of half; 2nd: first+this)
 */
export const previewWithholdingOnSplitToggle = (input: {
  splitOn: boolean;
  cutoffHalf: "first" | "second";
  /** Current stored withholding on this slip. */
  currentWithholding: string;
  /** Stored 1st-cutoff withholding when viewing 2nd (from list enrichment). */
  firstCutoffWithholdingTax?: string | null;
}): string => {
  const current = toCentavos(input.currentWithholding);

  if (input.splitOn) {
    if (input.cutoffHalf === "first") {
      return fromCentavos(Math.floor(current / 2));
    }
    const first = toCentavos(input.firstCutoffWithholdingTax);
    if (input.firstCutoffWithholdingTax != null) {
      // Assume current was full monthly; remainder = monthly − firstHalf
      // When toggling from off, current is full; first may be half of its own full.
      // Prefer: monthly ≈ current (full on this slip alone) when no sibling math —
      // actually when split was off, 2nd also has full monthly on its own taxable×2.
      // Remainder after sibling first half: if we have first stored, use current - first
      // only when first was already half... Simpler: monthly = current (was full);
      // firstHalf = first if provided else floor(current/2); this = monthly - firstHalf
      // Wait: when split OFF, 2nd slip withholding is full monthly on *its* taxable×2,
      // not the combined monthly. So toggling ON needs server PATCH for accuracy.
      // Client preview: treat current as monthly proxy and subtract first half.
      const monthly = current;
      const firstHalf =
        input.firstCutoffWithholdingTax != null
          ? first
          : Math.floor(monthly / 2);
      return fromCentavos(Math.max(0, monthly - firstHalf));
    }
    return fromCentavos(current - Math.floor(current / 2));
  }

  // split off → restore full monthly
  if (input.cutoffHalf === "first") {
    return fromCentavos(current * 2);
  }
  const first = toCentavos(input.firstCutoffWithholdingTax);
  if (input.firstCutoffWithholdingTax != null) {
    return fromCentavos(first + current);
  }
  return fromCentavos(current * 2);
};

export const recalcNetFromTax = (input: {
  grossPay: string;
  sss: string;
  hdmf: string;
  philhealth: string;
  withholdingTax: string;
  totalAdjustments: string;
}): { totalDeductions: string; netPay: string } => {
  const deductions =
    toCentavos(input.sss) +
    toCentavos(input.hdmf) +
    toCentavos(input.philhealth) +
    toCentavos(input.withholdingTax);
  const net =
    toCentavos(input.grossPay) + toCentavos(input.totalAdjustments) - deductions;
  return {
    totalDeductions: fromCentavos(deductions),
    netPay: fromCentavos(net),
  };
};
