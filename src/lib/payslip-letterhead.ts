/** Company letterhead for printed payslips (matches current paper layout). */
export const PAYSLIP_COMPANY = {
  name: "TITO SOLUTIONS PHILIPPINES INC",
  address: "UNIT 5A HOLLYWOOD SQUARE BUILDING, WEST AVENUE QUEZON CITY",
  vatLine: "VAT REGISTERED 010-611-990-00000",
} as const;

export const formatPayslipMoney = (value: string | null | undefined): string => {
  if (value == null || value === "") return "—";
  const cleaned = String(value).replace(/,/g, "").trim();
  const amount = Number(cleaned);
  if (!Number.isFinite(amount)) return value;
  if (amount === 0) return "—";
  return amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatPayslipPeriod = (isoDate: string | undefined): string => {
  if (!isoDate) return "—";
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatPayslipHours = (value: string | null | undefined): string => {
  if (value == null || value === "" || Number(value) === 0) return "—";
  return String(value);
};
