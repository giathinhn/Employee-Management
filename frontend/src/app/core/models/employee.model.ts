export enum EmployeeStatus {
  Active = 1,
  OnLeave = 2,
  Terminated = 3
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth: string;
  hireDate: string;
  position: string;
  salary: number;
  status: EmployeeStatus;
  statusName: string;
  departmentId: number;
  departmentName: string;
  departmentCode: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth: string;
  hireDate: string;
  position: string;
  salary: number;
  status: EmployeeStatus;
  departmentId: number;
}

export interface UpdateEmployeeDto extends CreateEmployeeDto {}

export interface EmployeeStatistics {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  terminatedEmployees: number;
  totalDepartments: number;
}
