import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Employee, CreateEmployeeDto, UpdateEmployeeDto, EmployeeStatistics } from '../models/employee.model';
import { PagedRequest, PagedResult } from '../models/paged.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/employees`;

  getPaged(request: PagedRequest): Observable<PagedResult<Employee>> {
    let params = new HttpParams()
      .set('pageNumber', request.pageNumber.toString())
      .set('pageSize', request.pageSize.toString());

    if (request.searchTerm && request.searchTerm.trim()) {
      params = params.set('searchTerm', request.searchTerm.trim());
    }
    if (request.departmentId) {
      params = params.set('departmentId', request.departmentId.toString());
    }
    if (request.status) {
      params = params.set('status', request.status.toString());
    }
    if (request.minSalary !== undefined && request.minSalary !== null) {
      params = params.set('minSalary', request.minSalary.toString());
    }
    if (request.maxSalary !== undefined && request.maxSalary !== null) {
      params = params.set('maxSalary', request.maxSalary.toString());
    }
    if (request.sortBy) {
      params = params.set('sortBy', request.sortBy);
      params = params.set('sortDescending', (!!request.sortDescending).toString());
    }

    return this.http.get<PagedResult<Employee>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`);
  }

  getAll(): Observable<PagedResult<Employee>> {
    return this.getPaged({ pageNumber: 1, pageSize: 100 });
  }

  getStatistics(): Observable<EmployeeStatistics> {
    return this.http.get<EmployeeStatistics>(`${this.apiUrl}/statistics`);
  }

  create(dto: CreateEmployeeDto): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateEmployeeDto): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  exportExcel(request: PagedRequest): Observable<Blob> {
    let params = new HttpParams();

    if (request.searchTerm && request.searchTerm.trim()) {
      params = params.set('searchTerm', request.searchTerm.trim());
    }
    if (request.departmentId) {
      params = params.set('departmentId', request.departmentId.toString());
    }
    if (request.status) {
      params = params.set('status', request.status.toString());
    }
    if (request.minSalary !== undefined && request.minSalary !== null) {
      params = params.set('minSalary', request.minSalary.toString());
    }
    if (request.maxSalary !== undefined && request.maxSalary !== null) {
      params = params.set('maxSalary', request.maxSalary.toString());
    }
    if (request.sortBy) {
      params = params.set('sortBy', request.sortBy);
      params = params.set('sortDescending', (!!request.sortDescending).toString());
    }

    return this.http.get(`${this.apiUrl}/export-excel`, {
      params,
      responseType: 'blob'
    });
  }
}
