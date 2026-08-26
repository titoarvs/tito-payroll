export type CutoffHalf = "first" | "second";
export type PayRunStatus = "draft" | "computed" | "released";
export type ContributionKind = "sss" | "hdmf" | "philhealth";

export interface ContributionBracket {
  id: string;
  scheduleId: string;
  minCompensation: string;
  maxCompensation: string | null;
  employeeShare: string;
  employerShare: string;
}

export interface ContributionSchedule {
  id: string;
  kind: ContributionKind;
  name: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  brackets: ContributionBracket[];
}

export interface PayRun {
  id: string;
  periodStart: string;
  periodEnd: string;
  cutoffHalf: CutoffHalf;
  status: PayRunStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payslip {
  id: string;
  payRunId: string;
  employeeId: string;
  hoursWorked: string;
  hourlyRate: string;
  basicPay: string;
  allowance: string;
  grossPay: string;
  sss: string;
  hdmf: string;
  philhealth: string;
  totalDeductions: string;
  netPay: string;
  periodStart?: string;
  periodEnd?: string;
  cutoffHalf?: CutoffHalf;
  status?: PayRunStatus;
}

export interface CreatePayRunInput {
  periodStart: string;
  periodEnd: string;
  cutoffHalf: CutoffHalf;
}

export interface ReplaceBracketsInput {
  brackets: Array<{
    minCompensation: string;
    maxCompensation?: string | null;
    employeeShare: string;
    employerShare?: string;
  }>;
}

export interface ApiListResponse<T> {
  data: T;
  message?: string;
}
