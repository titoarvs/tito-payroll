import { hrisApi } from "~/lib/hris-api-client";
import type {
  ApiListResponse,
  ContributionSchedule,
  CreatePayRunInput,
  EmployeeContributionRow,
  PayRun,
  PayrollDashboardSummary,
  Payslip,
  ReplaceBracketsInput,
  UpdatePayslipInput,
} from "./pay-runs.types";

const PAY_RUNS = "/payroll/pay-runs";
const SCHEDULES = "/payroll/contribution-schedules";
const PAYSLIPS = "/payroll/payslips";
const DASHBOARD = "/payroll/dashboard";

export const payRunsService = {
  list: () => hrisApi.get<ApiListResponse<PayRun[]>>(PAY_RUNS),
  getById: (id: string) =>
    hrisApi.get<ApiListResponse<PayRun>>(`${PAY_RUNS}/${encodeURIComponent(id)}`),
  create: (input: CreatePayRunInput) =>
    hrisApi.post<ApiListResponse<PayRun>>(PAY_RUNS, input),
  compute: (id: string) =>
    hrisApi.post<ApiListResponse<{ payRun: PayRun; payslipCount: number }>>(
      `${PAY_RUNS}/${encodeURIComponent(id)}/compute`,
    ),
  release: (id: string) =>
    hrisApi.post<ApiListResponse<PayRun>>(
      `${PAY_RUNS}/${encodeURIComponent(id)}/release`,
    ),
  listPayslips: (payRunId: string) =>
    hrisApi.get<ApiListResponse<Payslip[]>>(
      `${PAY_RUNS}/${encodeURIComponent(payRunId)}/payslips`,
    ),
  dashboardSummary: (params?: { from?: string; to?: string }) => {
    const search = new URLSearchParams();
    if (params?.from) search.set("from", params.from);
    if (params?.to) search.set("to", params.to);
    const query = search.toString();
    return hrisApi.get<ApiListResponse<PayrollDashboardSummary>>(
      `${DASHBOARD}/summary${query ? `?${query}` : ""}`,
    );
  },
};

export const contributionTablesService = {
  list: () =>
    hrisApi.get<ApiListResponse<ContributionSchedule[]>>(SCHEDULES),
  getById: (id: string) =>
    hrisApi.get<ApiListResponse<ContributionSchedule>>(
      `${SCHEDULES}/${encodeURIComponent(id)}`,
    ),
  listEmployeeContributions: (search?: string) => {
    const params = new URLSearchParams();
    if (search?.trim()) params.set("search", search.trim());
    const query = params.toString();
    return hrisApi.get<ApiListResponse<EmployeeContributionRow[]>>(
      `${SCHEDULES}/employee-contributions${query ? `?${query}` : ""}`,
    );
  },
  replaceBrackets: (id: string, input: ReplaceBracketsInput) =>
    hrisApi.put<ApiListResponse<ContributionSchedule>>(
      `${SCHEDULES}/${encodeURIComponent(id)}/brackets`,
      input,
    ),
};

export const payslipsService = {
  listMine: () => hrisApi.get<ApiListResponse<Payslip[]>>(`${PAYSLIPS}/me`),
  listAll: () => hrisApi.get<ApiListResponse<Payslip[]>>(PAYSLIPS),
  getById: (id: string) =>
    hrisApi.get<ApiListResponse<Payslip>>(
      `${PAYSLIPS}/${encodeURIComponent(id)}`,
    ),
  update: (id: string, input: UpdatePayslipInput) =>
    hrisApi.patch<ApiListResponse<Payslip>>(
      `${PAYSLIPS}/${encodeURIComponent(id)}`,
      input,
    ),
};
