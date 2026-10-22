import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Department, CreateDepartmentDto, UpdateDepartmentDto } from '../models/department.model';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/departments`;

  getAll(searchTerm?: string): Observable<Department[]> {
    let params = new HttpParams();
    if (searchTerm && searchTerm.trim()) {
      params = params.set('search', searchTerm.trim());
    }
    return this.http.get<Department[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Department> {
    return this.http.get<Department>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateDepartmentDto): Observable<Department> {
    return this.http.post<Department>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateDepartmentDto): Observable<Department> {
    return this.http.put<Department>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
