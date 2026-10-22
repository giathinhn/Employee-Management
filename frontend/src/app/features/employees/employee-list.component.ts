import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { EmployeeService } from '../../core/services/employee.service';
import { DepartmentService } from '../../core/services/department.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Employee, EmployeeStatus } from '../../core/models/employee.model';
import { Department } from '../../core/models/department.model';
import { PagedRequest, PagedResult } from '../../core/models/paged.model';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

// Custom validator for age >= 18
export function minimumAgeValidator(minAge: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const dob = new Date(control.value);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age < minAge ? { minimumAge: { requiredAge: minAge, actualAge: age } } : null;
  };
}

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaginationComponent, ConfirmModalComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Quản lý Nhân Viên</h1>
          <p class="page-subtitle">Tìm kiếm, lọc, phân trang và quản lý hồ sơ nhân sự theo tiêu chuẩn</p>
        </div>
        <div class="header-actions" *ngIf="authService.isManager">
          <button class="btn btn-primary" (click)="openCreateModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Thêm Nhân Viên
          </button>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="filter-card">
        <div class="filter-grid">
          <!-- Search input -->
          <div class="filter-group span-2">
            <label class="filter-label">Tìm kiếm</label>
            <div class="search-input-wrap">
              <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" 
                     class="form-control with-icon" 
                     placeholder="Tìm theo tên, email, số điện thoại, chức vụ..."
                     [value]="pagedRequest.searchTerm || ''"
                     (input)="onSearchChanged($event)">
            </div>
          </div>

          <!-- Department dropdown filter -->
          <div class="filter-group">
            <label class="filter-label">Phòng ban</label>
            <select class="form-control" [value]="pagedRequest.departmentId || ''" (change)="onDepartmentFilter($event)">
              <option value="">Tất cả phòng ban</option>
              <option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</option>
            </select>
          </div>

          <!-- Status dropdown filter -->
          <div class="filter-group">
            <label class="filter-label">Trạng thái</label>
            <select class="form-control" [value]="pagedRequest.status || ''" (change)="onStatusFilter($event)">
              <option value="">Tất cả trạng thái</option>
              <option [value]="EmployeeStatus.Active">Đang làm việc (Active)</option>
              <option [value]="EmployeeStatus.OnLeave">Nghỉ phép (On Leave)</option>
              <option [value]="EmployeeStatus.Terminated">Đã thôi việc (Terminated)</option>
            </select>
          </div>

          <!-- Min Salary -->
          <div class="filter-group">
            <label class="filter-label">Lương tối thiểu (VNĐ)</label>
            <input type="number" 
                   class="form-control" 
                   placeholder="VD: 15000000"
                   [value]="pagedRequest.minSalary || ''"
                   (change)="onMinSalaryFilter($event)">
          </div>

          <!-- Reset Filter Button -->
          <div class="filter-group filter-actions-group">
            <label class="filter-label">&nbsp;</label>
            <button class="btn btn-outline-secondary w-100" (click)="resetFilters()" title="Xóa tất cả bộ lọc">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
              Đặt lại lọc
            </button>
          </div>
        </div>
      </div>

      <!-- Employees Table Card -->
      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th (click)="sort('name')" class="sortable">
                  Họ và Tên
                  <span class="sort-icon">{{ getSortIcon('name') }}</span>
                </th>
                <th>Thông tin liên hệ</th>
                <th (click)="sort('department')" class="sortable">
                  Phòng ban
                  <span class="sort-icon">{{ getSortIcon('department') }}</span>
                </th>
                <th (click)="sort('position')" class="sortable">
                  Chức vụ
                  <span class="sort-icon">{{ getSortIcon('position') }}</span>
                </th>
                <th (click)="sort('salary')" class="sortable" style="text-align: right;">
                  Mức lương
                  <span class="sort-icon">{{ getSortIcon('salary') }}</span>
                </th>
                <th (click)="sort('status')" class="sortable" style="text-align: center;">
                  Trạng thái
                  <span class="sort-icon">{{ getSortIcon('status') }}</span>
                </th>
                <th style="width: 140px; text-align: right;">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let emp of pagedResult?.items">
                <td>
                  <div class="emp-profile-cell">
                    <div class="emp-avatar">{{ emp.firstName.charAt(0) }}{{ emp.lastName.charAt(0) }}</div>
                    <div>
                      <strong class="emp-name" (click)="openDetailModal(emp)">{{ emp.fullName }}</strong>
                      <span class="emp-meta">Ngày vào: {{ emp.hireDate | date:'dd/MM/yyyy' }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="contact-cell">
                    <span class="emp-email">{{ emp.email }}</span>
                    <span class="emp-phone" *ngIf="emp.phoneNumber">{{ emp.phoneNumber }}</span>
                  </div>
                </td>
                <td>
                  <span class="badge-dept">{{ emp.departmentName }}</span>
                </td>
                <td>
                  <span class="emp-position">{{ emp.position }}</span>
                </td>
                <td style="text-align: right;">
                  <strong class="salary-val">{{ emp.salary | number:'1.0-0' }} đ</strong>
                </td>
                <td style="text-align: center;">
                  <span class="status-pill" [ngClass]="'status-' + emp.status">
                    {{ emp.status === 1 ? 'Đang làm việc' : emp.status === 2 ? 'Nghỉ phép' : 'Đã thôi việc' }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div class="table-actions">
                    <button class="btn-icon text-info" (click)="openDetailModal(emp)" title="Xem chi tiết">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </button>
                    <button class="btn-icon text-primary" *ngIf="authService.isManager" (click)="openEditModal(emp)" title="Chỉnh sửa">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-icon text-danger" *ngIf="authService.isAdmin" (click)="confirmDelete(emp)" title="Xóa nhân viên">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="pagedResult?.items?.length === 0 && !isLoading">
                <td colspan="7" class="empty-cell">
                  Không tìm thấy nhân viên nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
              <tr *ngIf="isLoading">
                <td colspan="7" class="empty-cell">
                  Đang tải dữ liệu nhân viên...
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <app-pagination 
          [totalCount]="pagedResult?.totalCount || 0"
          [pageSize]="pagedRequest.pageSize"
          [currentPage]="pagedRequest.pageNumber"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)">
        </app-pagination>
      </div>

      <!-- Add / Edit Modal -->
      <div class="modal-backdrop" *ngIf="isModalOpen" (click)="closeModal()">
        <div class="modal-card modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ isEditing ? 'Cập nhật Nhân Viên' : 'Thêm Nhân Viên Mới' }}</h3>
            <button class="modal-close-btn" (click)="closeModal()">×</button>
          </div>

          <form [formGroup]="empForm" (ngSubmit)="onSubmit()">
            <div class="modal-body modal-grid-2">
              <div class="form-group">
                <label for="firstName" class="form-label required">Họ đệm</label>
                <input id="firstName" 
                       type="text" 
                       class="form-control" 
                       formControlName="firstName" 
                       placeholder="VD: Nguyễn Văn"
                       [class.is-invalid]="f['firstName'].touched && f['firstName'].invalid">
                <div class="invalid-feedback" *ngIf="f['firstName'].touched && f['firstName'].invalid">
                  <span *ngIf="f['firstName'].errors?.['required']">Họ đệm là bắt buộc.</span>
                </div>
              </div>

              <div class="form-group">
                <label for="lastName" class="form-label required">Tên</label>
                <input id="lastName" 
                       type="text" 
                       class="form-control" 
                       formControlName="lastName" 
                       placeholder="VD: An"
                       [class.is-invalid]="f['lastName'].touched && f['lastName'].invalid">
                <div class="invalid-feedback" *ngIf="f['lastName'].touched && f['lastName'].invalid">
                  <span *ngIf="f['lastName'].errors?.['required']">Tên là bắt buộc.</span>
                </div>
              </div>

              <div class="form-group">
                <label for="email" class="form-label required">Địa chỉ Email</label>
                <input id="email" 
                       type="email" 
                       class="form-control" 
                       formControlName="email" 
                       placeholder="VD: an.nguyen@company.com"
                       [class.is-invalid]="f['email'].touched && f['email'].invalid">
                <div class="invalid-feedback" *ngIf="f['email'].touched && f['email'].invalid">
                  <span *ngIf="f['email'].errors?.['required']">Email là bắt buộc.</span>
                  <span *ngIf="f['email'].errors?.['email']">Email không đúng định dạng.</span>
                </div>
              </div>

              <div class="form-group">
                <label for="phoneNumber" class="form-label">Số điện thoại</label>
                <input id="phoneNumber" 
                       type="text" 
                       class="form-control" 
                       formControlName="phoneNumber" 
                       placeholder="VD: 0912345678"
                       [class.is-invalid]="f['phoneNumber'].touched && f['phoneNumber'].invalid">
                <div class="invalid-feedback" *ngIf="f['phoneNumber'].touched && f['phoneNumber'].invalid">
                  <span *ngIf="f['phoneNumber'].errors?.['pattern']">Số điện thoại Việt Nam (VD: 0912345678 hoặc +84912345678).</span>
                </div>
              </div>

              <div class="form-group">
                <label for="dateOfBirth" class="form-label required">Ngày sinh (≥ 18 tuổi)</label>
                <input id="dateOfBirth" 
                       type="date" 
                       class="form-control" 
                       formControlName="dateOfBirth"
                       [class.is-invalid]="f['dateOfBirth'].touched && f['dateOfBirth'].invalid">
                <div class="invalid-feedback" *ngIf="f['dateOfBirth'].touched && f['dateOfBirth'].invalid">
                  <span *ngIf="f['dateOfBirth'].errors?.['required']">Ngày sinh là bắt buộc.</span>
                  <span *ngIf="f['dateOfBirth'].errors?.['minimumAge']">Nhân viên phải đủ từ 18 tuổi trở lên.</span>
                </div>
              </div>

              <div class="form-group">
                <label for="hireDate" class="form-label required">Ngày vào làm</label>
                <input id="hireDate" 
                       type="date" 
                       class="form-control" 
                       formControlName="hireDate"
                       [class.is-invalid]="f['hireDate'].touched && f['hireDate'].invalid">
                <div class="invalid-feedback" *ngIf="f['hireDate'].touched && f['hireDate'].invalid">
                  <span *ngIf="f['hireDate'].errors?.['required']">Ngày vào làm là bắt buộc.</span>
                </div>
              </div>

              <div class="form-group">
                <label for="departmentId" class="form-label required">Phòng ban</label>
                <select id="departmentId" 
                        class="form-control" 
                        formControlName="departmentId"
                        [class.is-invalid]="f['departmentId'].touched && f['departmentId'].invalid">
                  <option value="">Chọn phòng ban</option>
                  <option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</option>
                </select>
                <div class="invalid-feedback" *ngIf="f['departmentId'].touched && f['departmentId'].invalid">
                  <span *ngIf="f['departmentId'].errors?.['required']">Vui lòng chọn phòng ban.</span>
                </div>
              </div>

              <div class="form-group">
                <label for="position" class="form-label required">Chức vụ / Vị trí</label>
                <input id="position" 
                       type="text" 
                       class="form-control" 
                       formControlName="position" 
                       placeholder="VD: Chuyên viên Frontend Angular"
                       [class.is-invalid]="f['position'].touched && f['position'].invalid">
                <div class="invalid-feedback" *ngIf="f['position'].touched && f['position'].invalid">
                  <span *ngIf="f['position'].errors?.['required']">Chức vụ là bắt buộc.</span>
                </div>
              </div>

              <div class="form-group">
                <label for="salary" class="form-label required">Mức lương (VNĐ)</label>
                <input id="salary" 
                       type="number" 
                       class="form-control" 
                       formControlName="salary" 
                       placeholder="VD: 25000000"
                       [class.is-invalid]="f['salary'].touched && f['salary'].invalid">
                <div class="invalid-feedback" *ngIf="f['salary'].touched && f['salary'].invalid">
                  <span *ngIf="f['salary'].errors?.['required']">Mức lương là bắt buộc.</span>
                  <span *ngIf="f['salary'].errors?.['min']">Mức lương tối thiểu 1.000.000 VNĐ.</span>
                </div>
              </div>

              <div class="form-group">
                <label for="status" class="form-label required">Trạng thái làm việc</label>
                <select id="status" class="form-control" formControlName="status">
                  <option [value]="EmployeeStatus.Active">Đang làm việc (Active)</option>
                  <option [value]="EmployeeStatus.OnLeave">Nghỉ phép (On Leave)</option>
                  <option [value]="EmployeeStatus.Terminated">Đã thôi việc (Terminated)</option>
                </select>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Hủy</button>
              <button type="submit" class="btn btn-primary" [disabled]="empForm.invalid || isSubmitting">
                {{ isSubmitting ? 'Đang lưu...' : (isEditing ? 'Lưu thay đổi' : 'Thêm nhân viên') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Employee Details Modal -->
      <div class="modal-backdrop" *ngIf="isDetailModalOpen" (click)="isDetailModalOpen = false">
        <div class="modal-card modal-md" (click)="$event.stopPropagation()" *ngIf="selectedEmployee as emp">
          <div class="modal-header">
            <h3 class="modal-title">Hồ sơ chi tiết Nhân Viên</h3>
            <button class="modal-close-btn" (click)="isDetailModalOpen = false">×</button>
          </div>
          <div class="modal-body">
            <div class="profile-header-card">
              <div class="profile-avatar">{{ emp.firstName.charAt(0) }}{{ emp.lastName.charAt(0) }}</div>
              <div>
                <h3 class="profile-name">{{ emp.fullName }}</h3>
                <span class="profile-position">{{ emp.position }}</span>
                <span class="status-pill mt-1" [ngClass]="'status-' + emp.status">
                  {{ emp.status === 1 ? 'Đang làm việc' : emp.status === 2 ? 'Nghỉ phép' : 'Đã thôi việc' }}
                </span>
              </div>
            </div>

            <div class="profile-details-grid">
              <div class="detail-row">
                <span class="detail-label">Phòng ban:</span>
                <span class="detail-value"><strong>{{ emp.departmentName }}</strong> ({{ emp.departmentCode }})</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email công việc:</span>
                <span class="detail-value">{{ emp.email }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Số điện thoại:</span>
                <span class="detail-value">{{ emp.phoneNumber || 'Chưa cập nhật' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Ngày sinh:</span>
                <span class="detail-value">{{ emp.dateOfBirth | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Ngày vào làm:</span>
                <span class="detail-value">{{ emp.hireDate | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Mức lương cơ bản:</span>
                <span class="detail-value text-primary font-bold">{{ emp.salary | number:'1.0-0' }} VNĐ</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Ngày tạo hồ sơ:</span>
                <span class="detail-value">{{ emp.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" (click)="isDetailModalOpen = false">Đóng</button>
            <button type="button" class="btn btn-primary" *ngIf="authService.isManager" (click)="isDetailModalOpen = false; openEditModal(emp)">
              Chỉnh sửa hồ sơ
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <app-confirm-modal 
        [isOpen]="isDeleteModalOpen"
        [title]="'Xác nhận xóa nhân viên: ' + (empToDelete?.fullName || '')"
        [message]="'Bạn có chắc chắn muốn xóa nhân viên ' + (empToDelete?.fullName || '') + ' (' + (empToDelete?.email || '') + ') khỏi hệ thống? Thao tác này không thể hoàn tác.'"
        [confirmText]="'Xóa nhân viên'"
        (confirm)="onConfirmDelete()"
        (cancel)="isDeleteModalOpen = false">
      </app-confirm-modal>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 32px 24px;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .page-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 6px 0;
    }
    .page-subtitle {
      color: #6b7280;
      font-size: 0.95rem;
      margin: 0;
    }
    .filter-card {
      background: #ffffff;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      align-items: flex-end;
    }
    .span-2 {
      grid-column: span 2;
    }
    @media (max-width: 768px) {
      .span-2 { grid-column: span 1; }
    }
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .filter-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #4b5563;
    }
    .search-input-wrap {
      position: relative;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
    }
    .with-icon {
      padding-left: 38px;
    }
    .table-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .table-responsive {
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }
    .data-table th {
      background: #f9fafb;
      padding: 14px 18px;
      font-weight: 600;
      color: #4b5563;
      border-bottom: 1px solid #e5e7eb;
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .data-table th.sortable {
      cursor: pointer;
      user-select: none;
    }
    .data-table th.sortable:hover {
      background: #f3f4f6;
      color: #111827;
    }
    .sort-icon {
      margin-left: 4px;
      font-size: 0.8rem;
      color: #3b82f6;
    }
    .data-table td {
      padding: 14px 18px;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: middle;
      color: #374151;
    }
    .data-table tr:hover {
      background: #f9fafb;
    }
    .emp-profile-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .emp-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      font-weight: 600;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .emp-name {
      color: #111827;
      cursor: pointer;
      display: block;
      transition: color 0.15s;
    }
    .emp-name:hover {
      color: #2563eb;
      text-decoration: underline;
    }
    .emp-meta {
      font-size: 0.75rem;
      color: #9ca3af;
    }
    .contact-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .emp-email {
      color: #374151;
      font-size: 0.85rem;
    }
    .emp-phone {
      color: #6b7280;
      font-size: 0.78rem;
    }
    .badge-dept {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      background: #f3f4f6;
      color: #374151;
      font-weight: 500;
      font-size: 0.82rem;
    }
    .emp-position {
      color: #4b5563;
      font-size: 0.875rem;
    }
    .salary-val {
      color: #059669;
      font-weight: 600;
    }
    .status-pill {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .status-1 { background: #ecfdf5; color: #065f46; } /* Active */
    .status-2 { background: #fffbeb; color: #92400e; } /* OnLeave */
    .status-3 { background: #fef2f2; color: #991b1b; } /* Terminated */

    .table-actions {
      display: flex;
      justify-content: flex-end;
      gap: 6px;
    }
    .btn-icon {
      background: none;
      border: none;
      padding: 6px;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }
    .btn-icon:hover { background: #f3f4f6; }
    .text-info { color: #0284c7; }
    .text-primary { color: #2563eb; }
    .text-danger { color: #dc2626; }
    .empty-cell {
      text-align: center;
      padding: 48px !important;
      color: #6b7280;
      font-style: italic;
    }

    /* Modal styles */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(17, 24, 39, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
      overflow-y: auto;
    }
    .modal-card {
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      width: 100%;
      margin: auto;
      overflow: hidden;
    }
    .modal-md { max-width: 520px; }
    .modal-lg { max-width: 680px; }
    .modal-header {
      padding: 18px 24px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
    .modal-close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #9ca3af;
      cursor: pointer;
    }
    .modal-body {
      padding: 24px;
    }
    .modal-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 600px) {
      .modal-grid-2 { grid-template-columns: 1fr; }
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }

    /* Profile view */
    .profile-header-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-bottom: 18px;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 18px;
    }
    .profile-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      font-weight: 700;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .profile-name {
      margin: 0 0 2px 0;
      font-size: 1.2rem;
      color: #111827;
    }
    .profile-position {
      color: #6b7280;
      font-size: 0.9rem;
      display: block;
    }
    .profile-details-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      padding-bottom: 8px;
      border-bottom: 1px dashed #f3f4f6;
    }
    .detail-label { color: #6b7280; }
    .detail-value { color: #111827; }
    .mt-1 { margin-top: 4px; }
    .font-bold { font-weight: 700; }
  `]
})
export class EmployeeListComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private empService = inject(EmployeeService);
  private deptService = inject(DepartmentService);
  private toastService = inject(ToastService);
  authService = inject(AuthService);

  EmployeeStatus = EmployeeStatus;

  departments: Department[] = [];
  pagedResult: PagedResult<Employee> | null = null;
  pagedRequest: PagedRequest = {
    pageNumber: 1,
    pageSize: 10,
    searchTerm: '',
    sortBy: 'id',
    sortDescending: true
  };

  isLoading = false;
  isSubmitting = false;

  // Search debounce
  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  // Modals
  isModalOpen = false;
  isEditing = false;
  editingId: number | null = null;
  empForm!: FormGroup;

  isDetailModalOpen = false;
  selectedEmployee: Employee | null = null;

  isDeleteModalOpen = false;
  empToDelete: Employee | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadDepartments();
    this.loadEmployees();

    this.searchSub = this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(term => {
      this.pagedRequest.searchTerm = term;
      this.pagedRequest.pageNumber = 1;
      this.loadEmployees();
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  get f() {
    return this.empForm.controls;
  }

  private initForm(): void {
    this.empForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      phoneNumber: ['', [Validators.pattern(/^(\+84|0)[3|5|7|8|9][0-9]{8}$/)]],
      dateOfBirth: ['', [Validators.required, minimumAgeValidator(18)]],
      hireDate: ['', [Validators.required]],
      position: ['', [Validators.required, Validators.maxLength(100)]],
      salary: [15000000, [Validators.required, Validators.min(1000000)]],
      status: [EmployeeStatus.Active, [Validators.required]],
      departmentId: ['', [Validators.required]]
    });
  }

  loadDepartments(): void {
    this.deptService.getAll().subscribe({
      next: res => this.departments = res,
      error: () => {}
    });
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.empService.getPaged(this.pagedRequest).subscribe({
      next: res => {
        this.pagedResult = res;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  onSearchChanged(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
  }

  onDepartmentFilter(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pagedRequest.departmentId = select.value ? parseInt(select.value, 10) : undefined;
    this.pagedRequest.pageNumber = 1;
    this.loadEmployees();
  }

  onStatusFilter(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pagedRequest.status = select.value ? parseInt(select.value, 10) as EmployeeStatus : undefined;
    this.pagedRequest.pageNumber = 1;
    this.loadEmployees();
  }

  onMinSalaryFilter(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.pagedRequest.minSalary = input.value ? parseFloat(input.value) : undefined;
    this.pagedRequest.pageNumber = 1;
    this.loadEmployees();
  }

  resetFilters(): void {
    this.pagedRequest = {
      pageNumber: 1,
      pageSize: 10,
      searchTerm: '',
      sortBy: 'id',
      sortDescending: true
    };
    this.loadEmployees();
  }

  sort(column: string): void {
    if (this.pagedRequest.sortBy === column) {
      this.pagedRequest.sortDescending = !this.pagedRequest.sortDescending;
    } else {
      this.pagedRequest.sortBy = column;
      this.pagedRequest.sortDescending = false;
    }
    this.loadEmployees();
  }

  getSortIcon(column: string): string {
    if (this.pagedRequest.sortBy !== column) return '↕';
    return this.pagedRequest.sortDescending ? '↓' : '↑';
  }

  onPageChange(page: number): void {
    this.pagedRequest.pageNumber = page;
    this.loadEmployees();
  }

  onPageSizeChange(size: number): void {
    this.pagedRequest.pageSize = size;
    this.pagedRequest.pageNumber = 1;
    this.loadEmployees();
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.empForm.reset({
      salary: 15000000,
      status: EmployeeStatus.Active,
      hireDate: new Date().toISOString().substring(0, 10)
    });
    this.isModalOpen = true;
  }

  openEditModal(emp: Employee): void {
    this.isEditing = true;
    this.editingId = emp.id;
    this.empForm.patchValue({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phoneNumber: emp.phoneNumber || '',
      dateOfBirth: emp.dateOfBirth.substring(0, 10),
      hireDate: emp.hireDate.substring(0, 10),
      position: emp.position,
      salary: emp.salary,
      status: emp.status,
      departmentId: emp.departmentId
    });
    this.isModalOpen = true;
  }

  openDetailModal(emp: Employee): void {
    this.selectedEmployee = emp;
    this.isDetailModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.empForm.reset();
  }

  onSubmit(): void {
    if (this.empForm.invalid) {
      this.empForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formVal = { ...this.empForm.value };
    formVal.departmentId = parseInt(formVal.departmentId, 10);
    formVal.status = parseInt(formVal.status, 10);
    formVal.salary = parseFloat(formVal.salary);

    if (this.isEditing && this.editingId) {
      this.empService.update(this.editingId, formVal).subscribe({
        next: () => {
          this.toastService.success('Đã cập nhật hồ sơ nhân viên thành công.');
          this.isSubmitting = false;
          this.closeModal();
          this.loadEmployees();
        },
        error: () => this.isSubmitting = false
      });
    } else {
      this.empService.create(formVal).subscribe({
        next: () => {
          this.toastService.success('Đã tạo mới nhân viên thành công.');
          this.isSubmitting = false;
          this.closeModal();
          this.loadEmployees();
        },
        error: () => this.isSubmitting = false
      });
    }
  }

  confirmDelete(emp: Employee): void {
    this.empToDelete = emp;
    this.isDeleteModalOpen = true;
  }

  onConfirmDelete(): void {
    if (!this.empToDelete) return;
    this.empService.delete(this.empToDelete.id).subscribe({
      next: () => {
        this.toastService.success(`Đã xóa nhân viên "${this.empToDelete?.fullName}" thành công.`);
        this.isDeleteModalOpen = false;
        this.empToDelete = null;
        this.loadEmployees();
      },
      error: () => {
        this.isDeleteModalOpen = false;
      }
    });
  }
}
