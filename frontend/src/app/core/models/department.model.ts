export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  location?: string;
  employeeCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDepartmentDto {
  name: string;
  code: string;
  description?: string;
  location?: string;
}

export interface UpdateDepartmentDto extends CreateDepartmentDto {}
