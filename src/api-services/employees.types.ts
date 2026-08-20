export interface EmployeeListItem {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
  userImage: string | null;
}

export interface EmployeeListParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface EmployeeListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface EmployeeListResponse {
  data: EmployeeListItem[];
  meta: EmployeeListMeta;
  message?: string;
}

/** Fields used by the payroll employee detail header (subset of HRIS employee). */
export interface EmployeeDetail {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  department: string | null;
  position: string | null;
  employmentStatus: string;
  isActive: boolean;
}

export interface EmployeeLinkedUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface EmployeeDetailData {
  accessLevel: "full" | "public_profile";
  employee: EmployeeDetail;
  hasSalary: boolean;
  linkedUser: EmployeeLinkedUser | null;
}

export interface EmployeeDetailResponse {
  data: EmployeeDetailData;
  message?: string;
}

/** Response from GET /employee201/employees/me (header fields only). */
export interface EmployeeMeResponse {
  data: EmployeeDetail;
  message?: string;
}
