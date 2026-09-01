import { hrisApi } from "~/lib/hris-api-client";
import type {
  ApiListResponse,
  ContributionSchedule,
  CreatePayRunInput,
  PayRun,
  Payslip,
  ReplaceBracketsInput,
  UpdatePayslipInput,
} from "./pay-runs.types";

const PAY_RUNS = "/payroll/pay-runs";
const SCHEDULES = "/payroll/contribution-schedules";
const PAYSLIPS = "/payroll/payslips";

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
};

export const contributionTablesService = {
  list: () =>
    hrisApi.get<ApiListResponse<ContributionSchedule[]>>(SCHEDULES),
  getById: (id: string) =>
    hrisApi.get<ApiListResponse<ContributionSchedule>>(
      `${SCHEDULES}/${encodeURIComponent(id)}`,
    ),
  replaceBrackets: (id: string, input: ReplaceBracketsInput) =>
    hrisApi.put<ApiListResponse<ContributionSchedule>>(
      `${SCHEDULES}/${encodeURIComponent(id)}/brackets`,
      input,
    ),
};

export const payslipsService = {
  listMine: () => hrisApi.get<ApiListResponse<Payslip[]>>(`${PAYSLIPS}/me`),
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
