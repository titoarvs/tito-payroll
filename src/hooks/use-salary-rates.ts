import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreatePayrollSalaryRateInput } from "~/api-services/salary-rates.types";
import { salaryRatesService } from "~/api-services/salary-rates.service";
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
    mutationFn: (body: CreatePayrollSalaryRateInput) =>
      salaryRatesService.createForEmployee(employeeId, body),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: salaryRatesKeys.byEmployee(employeeId),
      });
      toast.success(response.message ?? "Salary rate saved");
    },
    onError: (error) => {
      toast.error(
        error instanceof HrisApiError
          ? error.message
          : "Failed to save salary rate",
      );
    },
  });
};
