import { EmployeeStatus } from './employee.model';

export interface PagedRequest {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  departmentId?: number;
  status?: EmployeeStatus;
  minSalary?: number;
  maxSalary?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
