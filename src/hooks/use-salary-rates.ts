import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { salaryRatesService } from "~/api-services/salary-rates.service";
import type { CreatePayrollSalaryRateInput } from "~/api-services/salary-rates.types";
import { HrisApiError } from "~/lib/hris-api-client";
import {
  getEmployeeSalaryRatesQuery,
  salaryRatesKeys,
} from "~/queries/salary-rates";

export const useEmployeeSalaryRates = (
  employeeId: string,
  options?: { enabled?: boolean },
) => useQuery(getEmployeeSalaryRatesQuery(employeeId, options));

export const useCreateEmployeeSalaryRate = (employeeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePayrollSalaryRateInput) =>
      salaryRatesService.createForEmployee(employeeId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: salaryRatesKeys.byEmployee(employeeId),
      });
      toast.success("Salary rate saved");
    },
    onError: (error) => {
      const message =
        error instanceof HrisApiError
          ? error.message
          : "Failed to save salary rate";
      toast.error(message);
    },
  });
};
