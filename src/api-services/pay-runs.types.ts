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

export interface EmployeeContributionRow {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string | null;
  employmentStatus: string;
  monthlySalary: string | null;
  sssCovered: boolean;
  pagibigCovered: boolean;
  philhealthCovered: boolean;
  sss: string;
  hdmf: string;
  philhealth: string;
}

export interface TaxBracket {
  id: string;
  scheduleId: string;
  minCompensation: string;
  maxCompensation: string | null;
  baseTax: string;
  rateOnExcess: string;
}

export interface TaxSchedule {
  id: string;
  name: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  brackets: TaxBracket[];
}

export interface PayRun {
  id: string;
  periodStart: string;
  periodEnd: string;
  cutoffHalf: CutoffHalf;
  status: PayRunStatus;
  includeThirteenthMonth?: boolean;
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
  /** Present on pay-run payslip list / get when HRIS joins employee201. */
  employeeName?: string | null;
  employeeCode?: string | null;
  /** Enriched on `GET /payroll/payslips/:id` from employee201. */
  department?: string | null;
  position?: string | null;
  employmentStatus?: string | null;
  sssNumber?: string | null;
  hdmfNumber?: string | null;
  pagibigNumber?: string | null;
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
  withholdingTax?: string;
  totalDeductions: string;
  overtimeHours?: string;
  overtimePay?: string;
  nightDiffHours?: string;
  nightDiffPay?: string;
  holidayHours?: string;
  holidayPay?: string;
  paidLeaveDays?: string;
  unpaidLeaveDays?: string;
  leavePay?: string;
  otherAdjustment?: string;
  otherAdjustmentReason?: string | null;
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
  includeThirteenthMonth?: boolean;
}

export interface UpdatePayslipInput {
  overtimePay?: string;
  nightDiffPay?: string;
  holidayPay?: string;
  otherAdjustment?: string;
  reason?: string;
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

export interface ReplaceTaxBracketsInput {
  brackets: Array<{
    minCompensation: string;
    maxCompensation?: string | null;
    baseTax: string;
    rateOnExcess: string;
  }>;
}

export interface ApiListResponse<T> {
  data: T;
  message?: string;
}

export interface PayrollMoneyTotals {
  payslipCount: number;
  grossPay: string;
  totalDeductions: string;
  netPay: string;
  sss: string;
  hdmf: string;
  philhealth: string;
  contributionsTotal: string;
  overtimePay?: string;
  nightDiffPay?: string;
  holidayPay?: string;
  totalAdjustments?: string;
}

export interface PayrollLatestReleasedTotals extends PayrollMoneyTotals {
  payRunId: string;
  periodStart: string;
  periodEnd: string;
  cutoffHalf: CutoffHalf | string;
}

export interface PayrollDashboardSummary {
  released: PayrollMoneyTotals;
  latestReleased: PayrollLatestReleasedTotals | null;
}
