import { hrisApi } from "~/lib/hris-api-client";
import type {
  AddDraftTaxBracketInput,
  ImportDraftTaxBracketsInput,
  UpdateDraftTaxBracketInput,
  ApiListResponse,
  ContributionSchedule,
  CreateCorrectionPayRunInput,
  CreatePayRunInput,
  EmployeeContributionRow,
  PayRun,
  PayrollDashboardSummary,
  Payslip,
  ReplaceBracketsInput,
  ReplaceTaxBracketsInput,
  TaxSchedule,
  UpdatePayRunInput,
  UpdatePayslipInput,
  PayRunReadiness,
} from "./pay-runs.types";

const PAY_RUNS = "/payroll/pay-runs";
const SCHEDULES = "/payroll/contribution-schedules";
const TAX_SCHEDULES = "/payroll/tax-schedules";
const PAYSLIPS = "/payroll/payslips";
const DASHBOARD = "/payroll/dashboard";

export const payRunsService = {
  list: () => hrisApi.get<ApiListResponse<PayRun[]>>(PAY_RUNS),
  getById: (id: string) =>
    hrisApi.get<ApiListResponse<PayRun>>(`${PAY_RUNS}/${encodeURIComponent(id)}`),
  getReadiness: (id: string) =>
    hrisApi.get<ApiListResponse<PayRunReadiness>>(
      `${PAY_RUNS}/${encodeURIComponent(id)}/readiness`,
    ),
  create: (input: CreatePayRunInput) =>
    hrisApi.post<ApiListResponse<PayRun>>(PAY_RUNS, input),
  update: (id: string, input: UpdatePayRunInput) =>
    hrisApi.patch<
      ApiListResponse<{ payRun: PayRun; payslips: Payslip[] } | PayRun>
    >(`${PAY_RUNS}/${encodeURIComponent(id)}`, input),
  createCorrection: (sourceId: string, input: CreateCorrectionPayRunInput) =>
    hrisApi.post<ApiListResponse<PayRun>>(
      `${PAY_RUNS}/${encodeURIComponent(sourceId)}/corrections`,
      input,
    ),
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

export const taxTablesService = {
  list: () => hrisApi.get<ApiListResponse<TaxSchedule[]>>(TAX_SCHEDULES),
  getById: (id: string) =>
    hrisApi.get<ApiListResponse<TaxSchedule>>(
      `${TAX_SCHEDULES}/${encodeURIComponent(id)}`,
    ),
  replaceBrackets: (id: string, input: ReplaceTaxBracketsInput) =>
    hrisApi.put<ApiListResponse<TaxSchedule>>(
      `${TAX_SCHEDULES}/${encodeURIComponent(id)}/brackets`,
      input,
    ),
  addDraftBracket: (input: AddDraftTaxBracketInput) =>
    hrisApi.post<ApiListResponse<TaxSchedule>>(
      `${TAX_SCHEDULES}/draft/brackets`,
      input,
    ),
  updateDraftBracket: (bracketId: string, input: UpdateDraftTaxBracketInput) =>
    hrisApi.patch<ApiListResponse<TaxSchedule>>(
      `${TAX_SCHEDULES}/draft/brackets/${encodeURIComponent(bracketId)}`,
      input,
    ),
  deleteDraftBracket: (bracketId: string) =>
    hrisApi.delete<ApiListResponse<TaxSchedule>>(
      `${TAX_SCHEDULES}/draft/brackets/${encodeURIComponent(bracketId)}`,
    ),
  importDraftBrackets: (input: ImportDraftTaxBracketsInput) =>
    hrisApi.post<ApiListResponse<TaxSchedule>>(
      `${TAX_SCHEDULES}/draft/import`,
      input,
    ),
  publishDraft: () =>
    hrisApi.post<ApiListResponse<TaxSchedule>>(
      `${TAX_SCHEDULES}/draft/publish`,
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
