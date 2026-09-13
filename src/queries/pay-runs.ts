import { queryOptions } from "@tanstack/react-query";
import {
  contributionTablesService,
  payRunsService,
  payslipsService,
} from "~/api-services/pay-runs.service";

export const payRunsKeys = {
  all: ["pay-runs"] as const,
  list: () => [...payRunsKeys.all, "list"] as const,
  detail: (id: string) => [...payRunsKeys.all, "detail", id] as const,
  payslips: (id: string) => [...payRunsKeys.all, "payslips", id] as const,
  dashboardSummary: (from = "", to = "") =>
    [...payRunsKeys.all, "dashboard-summary", from, to] as const,
};

export const contributionKeys = {
  all: ["contribution-schedules"] as const,
  list: () => [...contributionKeys.all, "list"] as const,
  detail: (id: string) => [...contributionKeys.all, "detail", id] as const,
  employees: (search = "") =>
    [...contributionKeys.all, "employees", search] as const,
};

export const myPayslipsKeys = {
  all: ["my-payslips"] as const,
  mine: () => [...myPayslipsKeys.all, "mine"] as const,
  allReleased: () => [...myPayslipsKeys.all, "all-released"] as const,
  detail: (id: string) => [...myPayslipsKeys.all, "detail", id] as const,
};

export const getPayRunsQuery = () =>
  queryOptions({
    queryKey: payRunsKeys.list(),
    queryFn: () => payRunsService.list(),
  });

export const getPayrollDashboardSummaryQuery = (from = "", to = "") =>
  queryOptions({
    queryKey: payRunsKeys.dashboardSummary(from, to),
    queryFn: () => payRunsService.dashboardSummary({ from, to }),
    enabled: Boolean(from && to),
  });

export const getPayRunQuery = (id: string) =>
  queryOptions({
    queryKey: payRunsKeys.detail(id),
    queryFn: () => payRunsService.getById(id),
    enabled: Boolean(id),
  });

export const getPayRunPayslipsQuery = (payRunId: string) =>
  queryOptions({
    queryKey: payRunsKeys.payslips(payRunId),
    queryFn: () => payRunsService.listPayslips(payRunId),
    enabled: Boolean(payRunId),
  });

export const getContributionSchedulesQuery = () =>
  queryOptions({
    queryKey: contributionKeys.list(),
    queryFn: () => contributionTablesService.list(),
  });

export const getEmployeeContributionsQuery = (search = "") =>
  queryOptions({
    queryKey: contributionKeys.employees(search),
    queryFn: () => contributionTablesService.listEmployeeContributions(search),
  });

export const getMyPayslipsQuery = () =>
  queryOptions({
    queryKey: myPayslipsKeys.mine(),
    queryFn: () => payslipsService.listMine(),
  });

export const getAllReleasedPayslipsQuery = (enabled = true) =>
  queryOptions({
    queryKey: myPayslipsKeys.allReleased(),
    queryFn: () => payslipsService.listAll(),
    enabled,
  });

export const getPayslipQuery = (id: string) =>
  queryOptions({
    queryKey: myPayslipsKeys.detail(id),
    queryFn: () => payslipsService.getById(id),
    enabled: Boolean(id),
  });

export const getMyPayslipQuery = getPayslipQuery;
