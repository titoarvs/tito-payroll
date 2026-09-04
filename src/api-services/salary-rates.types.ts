export interface PayrollSalaryRate {
  id: string;
  userId: string;
  monthlySalary: string;
  dailyRate: string | null;
  hourlyRate: string | null;
  workingDaysPerMonth: number;
  hoursPerDay: number;
  salaryType: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PayrollSalaryRateEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string | null;
  userId: string | null;
  salary: string | null;
  hourlyRate: string | null;
  allowance: string | null;
}

export interface PayrollSalaryRatesData {
  rates: PayrollSalaryRate[];
  employee: PayrollSalaryRateEmployee;
}

export interface PayrollSalaryRatesResponse {
  data: PayrollSalaryRatesData;
  message?: string;
}

export interface CreatePayrollSalaryRateInput {
  monthlySalary: string;
  hourlyRate: string;
  allowance?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

export interface CreatePayrollSalaryRateResponse {
  data: {
    rate: PayrollSalaryRate;
    employee: PayrollSalaryRateEmployee;
  };
  message?: string;
}
