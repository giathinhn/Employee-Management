import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Attendance,
  AttendancePagedRequest,
  AttendanceStatistics,
  CheckInRequest,
  CheckOutRequest,
  CreateAttendanceDto,
  TodayAttendanceStatus,
  UpdateAttendanceDto
} from '../models/attendance.model';
import { PagedResult } from '../models/paged.model';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/attendance`;

  getPaged(request: AttendancePagedRequest): Observable<PagedResult<Attendance>> {
    let params = new HttpParams()
      .set('pageNumber', request.pageNumber.toString())
      .set('pageSize', request.pageSize.toString());

    if (request.searchTerm && request.searchTerm.trim()) {
      params = params.set('searchTerm', request.searchTerm.trim());
    }
    if (request.departmentId) {
      params = params.set('departmentId', request.departmentId.toString());
    }
    if (request.employeeId) {
      params = params.set('employeeId', request.employeeId.toString());
    }
    if (request.status) {
      params = params.set('status', request.status.toString());
    }
    if (request.startDate) {
      params = params.set('startDate', request.startDate);
    }
    if (request.endDate) {
      params = params.set('endDate', request.endDate);
    }
    if (request.sortBy) {
      params = params.set('sortBy', request.sortBy);
      params = params.set('sortDescending', (!!request.sortDescending).toString());
    }

    return this.http.get<PagedResult<Attendance>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Attendance> {
    return this.http.get<Attendance>(`${this.apiUrl}/${id}`);
  }

  getTodayStatus(employeeId?: number): Observable<TodayAttendanceStatus> {
    let params = new HttpParams();
    if (employeeId) {
      params = params.set('employeeId', employeeId.toString());
    }
    return this.http.get<TodayAttendanceStatus>(`${this.apiUrl}/today-status`, { params });
  }

  getStatistics(month?: number, year?: number, departmentId?: number): Observable<AttendanceStatistics> {
    let params = new HttpParams();
    if (month) {
      params = params.set('month', month.toString());
    }
    if (year) {
      params = params.set('year', year.toString());
    }
    if (departmentId) {
      params = params.set('departmentId', departmentId.toString());
    }
    return this.http.get<AttendanceStatistics>(`${this.apiUrl}/statistics`, { params });
  }

  checkIn(request: CheckInRequest): Observable<Attendance> {
    return this.http.post<Attendance>(`${this.apiUrl}/check-in`, request);
  }

  checkOut(request: CheckOutRequest): Observable<Attendance> {
    return this.http.post<Attendance>(`${this.apiUrl}/check-out`, request);
  }

  create(dto: CreateAttendanceDto): Observable<Attendance> {
    return this.http.post<Attendance>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateAttendanceDto): Observable<Attendance> {
    return this.http.put<Attendance>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
