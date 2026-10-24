export enum AttendanceStatus {
  Present = 1,          // Đúng giờ
  Late = 2,             // Đi muộn
  EarlyLeave = 3,       // Về sớm
  LateAndEarlyLeave = 4,// Đi muộn & Về sớm
  Absent = 5,           // Vắng mặt
  OnLeave = 6           // Nghỉ phép
}

export interface Attendance {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeEmail: string;
  employeePosition: string;
  departmentId: number;
  departmentName: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  workingHours?: number;
  status: AttendanceStatus;
  statusText: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CheckInRequest {
  employeeId?: number;
  notes?: string;
}

export interface CheckOutRequest {
  employeeId?: number;
  notes?: string;
}

export interface CreateAttendanceDto {
  employeeId: number;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  workingHours?: number;
  status: AttendanceStatus;
  notes?: string;
}

export interface UpdateAttendanceDto {
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  workingHours?: number;
  status: AttendanceStatus;
  notes?: string;
}

export interface AttendancePagedRequest {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  departmentId?: number;
  employeeId?: number;
  status?: AttendanceStatus;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface AttendanceStatistics {
  totalRecords: number;
  presentCount: number;
  lateCount: number;
  earlyLeaveCount: number;
  absentCount: number;
  onLeaveCount: number;
  totalWorkingHours: number;
  averageHoursPerDay: number;
  onTimeRate: number;
}

export interface TodayAttendanceStatus {
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  employeeId?: number;
  employeeName?: string;
  attendance?: Attendance;
}
