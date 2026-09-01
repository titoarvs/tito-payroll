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
  releasedBy?: string | null;
  releasedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payslip {
  id: string;
  payRunId: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  position?: string | null;
  employmentStatus?: string;
  sssNumber?: string | null;
  hdmfNumber?: string | null;
  philhealthNumber?: string | null;
  tinNumber?: string | null;
  monthlyRate?: string;
  hoursWorked: string;
  hourlyRate: string;
  basicPay: string;
  allowance: string;
  grossPay: string;
  sss: string;
  hdmf: string;
  philhealth: string;
  totalDeductions: string;
  overtimeHours?: string;
  overtimePay?: string;
  nightDiffHours?: string;
  nightDiffPay?: string;
  holidayHours?: string;
  holidayPay?: string;
  otherAdjustment?: string;
  thirteenthMonthPay?: string;
  totalAdjustments?: string;
  netPay: string;
  preparedByName?: string | null;
  periodStart?: string;
  periodEnd?: string;
  cutoffHalf?: CutoffHalf;
  status?: PayRunStatus;
  releasedBy?: string | null;
  releasedAt?: string | null;
}

export interface CreatePayRunInput {
  periodStart: string;
  periodEnd: string;
  cutoffHalf: CutoffHalf;
}

export interface UpdatePayslipInput {
  overtimePay?: string;
  nightDiffPay?: string;
  holidayPay?: string;
  otherAdjustment?: string;
  thirteenthMonthPay?: string;
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
