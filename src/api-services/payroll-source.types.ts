export interface EmployeeCompensationReveal {
  salary: string | null;
  hourlyRate: string | null;
  allowance: string | null;
}

export interface EmployeeCompensationRevealResponse {
  data: EmployeeCompensationReveal;
  message?: string;
}

export interface PayrollEmployeeBenefits {
  employmentStatus: string;
  withHmo: boolean;
  hmoProvider: string | null;
  hmoMemberNumber: string | null;
  sssCovered: boolean;
  philhealthCovered: boolean;
  pagibigCovered: boolean;
  withholdingTaxCovered: boolean;
  civilStatus: string | null;
}

export interface LeaveRequestPayrollItem {
  id: string;
  employeeId: string;
  status: string;
  startDate: string;
  endDate: string | null;
  dayPart: string;
  totalDays: string;
  paidDays: string | null;
  unpaidDays: string | null;
  leaveTypeCode: string;
  leaveTypeName: string;
  isPaid: boolean;
}

export interface LeaveRequestsListResponse {
  data: LeaveRequestPayrollItem[];
  message?: string;
}

export interface LeaveRequestsListParams {
  scope?: string;
  employeeId?: string;
  status?: string;
  from?: string;
  to?: string;
}

export interface HolidayInstancePayrollItem {
  id: string;
  year: number;
  holidayDate: string;
  name: string;
  type: string;
  premiumPercent: string;
  status: string;
  source: string;
  isActive: boolean;
}

export interface HolidaysListResponse {
  data: HolidayInstancePayrollItem[];
  message?: string;
}

export interface HolidaysListParams {
  from?: string;
  to?: string;
}
