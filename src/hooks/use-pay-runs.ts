import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  contributionTablesService,
  payRunsService,
  payslipsService,
  taxTablesService,
} from "~/api-services/pay-runs.service";
import type {
  AddDraftTaxBracketInput,
  CreateCorrectionPayRunInput,
  CreatePayRunInput,
  ImportDraftTaxBracketsInput,
  ReplaceBracketsInput,
  ReplaceTaxBracketsInput,
  UpdateDraftTaxBracketInput,
  UpdatePayRunInput,
  UpdatePayslipInput,
} from "~/api-services/pay-runs.types";
import {
  contributionKeys,
  getAllReleasedPayslipsQuery,
  getContributionSchedulesQuery,
  getEmployeeContributionsQuery,
  getMyPayslipsQuery,
  getPayRunPayslipsQuery,
  getPayRunQuery,
  getPayRunReadinessQuery,
  getPayRunsQuery,
  getPayrollDashboardSummaryQuery,
  getPayslipQuery,
  getTaxSchedulesQuery,
  myPayslipsKeys,
  payRunsKeys,
  taxKeys,
} from "~/queries/pay-runs";

export const usePayRuns = () => useQuery(getPayRunsQuery());

export const usePayrollDashboardSummary = (from = "", to = "") =>
  useQuery(getPayrollDashboardSummaryQuery(from, to));

export const usePayRun = (id: string) => useQuery(getPayRunQuery(id));

export const usePayRunPayslips = (payRunId: string) =>
  useQuery(getPayRunPayslipsQuery(payRunId));

export const usePayRunReadiness = (payRunId: string, enabled = true) =>
  useQuery(getPayRunReadinessQuery(payRunId, enabled));

export const useCreatePayRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePayRunInput) => payRunsService.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: payRunsKeys.all });
    },
  });
};

export const useCreateCorrectionPayRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sourceId,
      input,
    }: {
      sourceId: string;
      input: CreateCorrectionPayRunInput;
    }) => payRunsService.createCorrection(sourceId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: payRunsKeys.all });
    },
  });
};

export const useSyncEmployeeEmployment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      employeeId,
    }: {
      employeeId: string;
      payRunId: string;
    }) => payRunsService.syncEmployment(employeeId),
    onSuccess: async (_data, { payRunId }) => {
      await queryClient.invalidateQueries({
        queryKey: payRunsKeys.readiness(payRunId),
      });
    },
  });
};

export const useComputePayRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payRunsService.compute(id),
    onSuccess: async (_data, id) => {
      await queryClient.invalidateQueries({ queryKey: payRunsKeys.all });
      await queryClient.invalidateQueries({ queryKey: payRunsKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: payRunsKeys.payslips(id) });
      await queryClient.invalidateQueries({
        queryKey: payRunsKeys.readiness(id),
      });
    },
  });
};

export const useReleasePayRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payRunsService.release(id),
    onSuccess: async (_data, id) => {
      await queryClient.invalidateQueries({ queryKey: payRunsKeys.all });
      await queryClient.invalidateQueries({ queryKey: payRunsKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: myPayslipsKeys.all });
    },
  });
};

export const useUpdatePayRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePayRunInput }) =>
      payRunsService.update(id, input),
    onSuccess: async (_data, { id }) => {
      await queryClient.invalidateQueries({ queryKey: payRunsKeys.all });
      await queryClient.invalidateQueries({ queryKey: payRunsKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: payRunsKeys.payslips(id) });
    },
  });
};

export const useContributionSchedules = () =>
  useQuery(getContributionSchedulesQuery());

export const useEmployeeContributions = (search = "") =>
  useQuery(getEmployeeContributionsQuery(search));

export const useReplaceBrackets = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: ReplaceBracketsInput;
    }) => contributionTablesService.replaceBrackets(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contributionKeys.all });
    },
  });
};

export const useTaxSchedules = () => useQuery(getTaxSchedulesQuery());

export const useReplaceTaxBrackets = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: ReplaceTaxBracketsInput;
    }) => taxTablesService.replaceBrackets(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taxKeys.all });
    },
  });
};

export const useAddDraftTaxBracket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddDraftTaxBracketInput) =>
      taxTablesService.addDraftBracket(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taxKeys.all });
    },
  });
};

export const useUpdateDraftTaxBracket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bracketId,
      input,
    }: {
      bracketId: string;
      input: UpdateDraftTaxBracketInput;
    }) => taxTablesService.updateDraftBracket(bracketId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taxKeys.all });
    },
  });
};

export const useDeleteDraftTaxBracket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bracketId: string) =>
      taxTablesService.deleteDraftBracket(bracketId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taxKeys.all });
    },
  });
};

export const useImportDraftTaxBrackets = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ImportDraftTaxBracketsInput) =>
      taxTablesService.importDraftBrackets(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taxKeys.all });
    },
  });
};

export const usePublishTaxDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => taxTablesService.publishDraft(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taxKeys.all });
    },
  });
};

export const useMyPayslips = (enabled = true) =>
  useQuery({ ...getMyPayslipsQuery(), enabled });

export const useAllReleasedPayslips = (enabled = true) =>
  useQuery(getAllReleasedPayslipsQuery(enabled));

export const usePayslip = (id: string) => useQuery(getPayslipQuery(id));

export const useMyPayslip = (id: string) => useQuery(getPayslipQuery(id));

export const useUpdatePayslip = (payRunId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdatePayslipInput;
    }) => payslipsService.update(id, input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: payRunsKeys.payslips(payRunId),
      });
      await queryClient.invalidateQueries({
        queryKey: myPayslipsKeys.detail(variables.id),
      });
    },
  });
};
