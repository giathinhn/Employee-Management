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
    <div class="view-wrapper">
      <!-- Breadcrumb & Header -->
      <div class="view-header">
        <div>
          <div class="view-breadcrumb">
            <span>Tổ chức</span>
            <span class="sep">/</span>
            <span class="current">Danh bạ nhân sự</span>
          </div>
          <h1 class="view-title">Hồ Sơ Nhân Sự</h1>
          <p class="view-desc">Quản lý danh sách nhân viên, thông tin hợp đồng và phân công bộ phận</p>
        </div>

        <div class="view-actions" *ngIf="authService.isManager">
          <button class="btn btn-secondary btn-sm" (click)="loadEmployees()" title="Làm mới danh sách">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path></svg>
            Làm mới
          </button>
          <button class="btn btn-primary btn-sm" (click)="openCreateModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Thêm nhân viên mới
          </button>
        </div>
      </div>

      <!-- Integrated Control Toolbar -->
      <div class="toolbar-box">
        <div class="search-cell">
          <svg class="search-svg" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" 
                 class="search-text-input" 
                 placeholder="Tìm theo họ tên, email, số điện thoại, chức vụ..."
                 [value]="pagedRequest.searchTerm || ''"
                 (input)="onSearchChanged($event)">
          <span class="search-key-hint">/</span>
        </div>

        <div class="filters-cell">
          <!-- Dept Filter -->
          <div class="select-wrapper">
            <select class="filter-dropdown" [value]="pagedRequest.departmentId || ''" (change)="onDepartmentFilter($event)">
              <option value="">Phòng ban: Tất cả</option>
              <option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div class="select-wrapper">
            <select class="filter-dropdown" [value]="pagedRequest.status || ''" (change)="onStatusFilter($event)">
              <option value="">Trạng thái: Tất cả</option>
              <option [value]="EmployeeStatus.Active">Đang làm việc</option>
              <option [value]="EmployeeStatus.OnLeave">Nghỉ phép</option>
              <option [value]="EmployeeStatus.Terminated">Đã thôi việc</option>
            </select>
          </div>

          <!-- Min Salary -->
          <div class="salary-input-wrapper">
            <input type="number" 
                   class="filter-salary-input" 
                   placeholder="Lương tối thiểu"
                   [value]="pagedRequest.minSalary || ''"
                   (change)="onMinSalaryFilter($event)">
          </div>

          <!-- Reset Filter -->
          <button *ngIf="hasActiveFilters()" 
                  class="btn-clear-filter" 
                  (click)="resetFilters()" 
                  title="Xóa bộ lọc">
            ✕ Bỏ lọc
          </button>
        </div>
      </div>

      <!-- Main Data Table Container -->
      <div class="data-container">
        <div class="table-scroll">
          <table class="grid-table">
            <thead>
              <tr>
                <th (click)="sort('name')" class="col-sortable">
                  <span class="th-content">Nhân viên <span class="sort-glyph">{{ getSortIcon('name') }}</span></span>
                </th>
                <th>Liên hệ</th>
                <th (click)="sort('department')" class="col-sortable">
                  <span class="th-content">Phòng ban <span class="sort-glyph">{{ getSortIcon('department') }}</span></span>
                </th>
                <th (click)="sort('position')" class="col-sortable">
                  <span class="th-content">Chức danh <span class="sort-glyph">{{ getSortIcon('position') }}</span></span>
                </th>
                <th (click)="sort('salary')" class="col-sortable text-right">
                  <span class="th-content justify-end">Mức lương <span class="sort-glyph">{{ getSortIcon('salary') }}</span></span>
                </th>
                <th (click)="sort('status')" class="col-sortable" style="text-align: center;">
                  <span class="th-content justify-center">Trạng thái <span class="sort-glyph">{{ getSortIcon('status') }}</span></span>
                </th>
                <th style="width: 110px; text-align: right;">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let emp of pagedResult?.items" class="table-row">
                <!-- Employee Column -->
                <td>
                  <div class="person-cell">
                    <div class="person-avatar">{{ getInitials(emp) }}</div>
                    <div class="person-info">
                      <span class="person-name" (click)="openDetailModal(emp)">{{ emp.fullName }}</span>
                      <span class="person-meta">Vào làm: {{ emp.hireDate | date:'dd/MM/yyyy' }}</span>
                    </div>
                  </div>
                </td>

                <!-- Contact Column -->
                <td>
                  <div class="contact-info">
                    <span class="contact-email">{{ emp.email }}</span>
                    <span class="contact-phone" *ngIf="emp.phoneNumber">{{ emp.phoneNumber }}</span>
                  </div>
                </td>

                <!-- Department Column -->
                <td>
                  <span class="dept-pill">{{ emp.departmentName }}</span>
                </td>

                <!-- Position Column -->
                <td>
                  <span class="position-text">{{ emp.position }}</span>
                </td>

                <!-- Salary Column -->
                <td style="text-align: right;">
                  <span class="salary-mono">{{ emp.salary | number:'1.0-0' }} ₫</span>
                </td>

                <!-- Status Column with Human-crafted dot -->
                <td style="text-align: center;">
                  <span class="status-indicator" [ngClass]="'status-' + (emp.status === 1 ? 'active' : emp.status === 2 ? 'onleave' : 'terminated')">
                    {{ emp.status === 1 ? 'Đang làm việc' : emp.status === 2 ? 'Nghỉ phép' : 'Đã thôi việc' }}
                  </span>
                </td>

                <!-- Action Column -->
                <td style="text-align: right;">
                  <div class="action-buttons">
                    <button class="icon-action-btn" (click)="openDetailModal(emp)" title="Xem hồ sơ">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </button>
                    <button class="icon-action-btn" *ngIf="authService.isManager" (click)="openEditModal(emp)" title="Chỉnh sửa">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
                    </button>
                    <button class="icon-action-btn text-danger-hover" *ngIf="authService.isAdmin" (click)="confirmDelete(emp)" title="Xóa nhân sự">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Empty state -->
              <tr *ngIf="pagedResult?.items?.length === 0 && !isLoading">
                <td colspan="7" class="empty-state-cell">
                  <div class="empty-state-inner">
                    <span class="empty-title">Không tìm thấy nhân sự phù hợp</span>
                    <span class="empty-desc">Thử thay đổi từ khóa tìm kiếm hoặc bỏ các tiêu chí lọc phòng ban/lương.</span>
                    <button *ngIf="hasActiveFilters()" class="btn btn-secondary btn-sm mt-3" (click)="resetFilters()">Đặt lại bộ lọc</button>
                  </div>
                </td>
              </tr>

              <!-- Loading state -->
              <tr *ngIf="isLoading">
                <td colspan="7" class="empty-state-cell">
                  <div class="loading-state">
                    <span class="spinner"></span>
                    <span>Đang tải danh bạ nhân sự...</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Server-side Pagination -->
        <app-pagination 
          [totalCount]="pagedResult?.totalCount || 0"
          [pageSize]="pagedRequest.pageSize"
          [currentPage]="pagedRequest.pageNumber"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)">
        </app-pagination>
      </div>

      <!-- Add / Edit Modal Drawer -->
      <div class="modal-layer" *ngIf="isModalOpen" (click)="closeModal()">
        <div class="modal-window modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-top">
            <div>
              <h3 class="modal-heading">{{ isEditing ? 'Cập Nhật Hồ Sơ Nhân Viên' : 'Tiếp Nhận Nhân Sự Mới' }}</h3>
              <p class="modal-subheading">Nhập thông tin nhân sự theo hồ sơ lao động chính thức</p>
            </div>
            <button class="modal-x-btn" (click)="closeModal()">✕</button>
          </div>

          <form [formGroup]="empForm" (ngSubmit)="onSubmit()">
            <div class="modal-scroll-body form-grid">
              <div class="form-group">
                <label for="firstName" class="form-label required">Họ và tên đệm</label>
                <input id="firstName" 
                       type="text" 
                       class="form-control" 
                       formControlName="firstName" 
                       placeholder="VD: Nguyễn Văn"
                       [class.is-invalid]="f['firstName'].touched && f['firstName'].invalid">
                <div class="invalid-feedback" *ngIf="f['firstName'].touched && f['firstName'].invalid">
                  Vui lòng nhập họ và tên đệm.
                </div>
              </div>

              <div class="form-group">
                <label for="lastName" class="form-label required">Tên chính</label>
                <input id="lastName" 
                       type="text" 
                       class="form-control" 
                       formControlName="lastName" 
                       placeholder="VD: An"
                       [class.is-invalid]="f['lastName'].touched && f['lastName'].invalid">
                <div class="invalid-feedback" *ngIf="f['lastName'].touched && f['lastName'].invalid">
                  Vui lòng nhập tên chính.
                </div>
              </div>

              <div class="form-group">
                <label for="email" class="form-label required">Email cơ quan</label>
                <input id="email" 
                       type="email" 
                       class="form-control" 
                       formControlName="email" 
                       placeholder="an.nguyen@company.com"
                       [class.is-invalid]="f['email'].touched && f['email'].invalid">
                <div class="invalid-feedback" *ngIf="f['email'].touched && f['email'].invalid">
                  Email không hợp lệ hoặc bị bỏ trống.
                </div>
              </div>

              <div class="form-group">
                <label for="phoneNumber" class="form-label">Điện thoại liên hệ</label>
                <input id="phoneNumber" 
                       type="text" 
                       class="form-control" 
                       formControlName="phoneNumber" 
                       placeholder="0912345678"
                       [class.is-invalid]="f['phoneNumber'].touched && f['phoneNumber'].invalid">
                <div class="invalid-feedback" *ngIf="f['phoneNumber'].touched && f['phoneNumber'].invalid">
                  Số điện thoại Việt Nam (VD: 0912345678).
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
                  <span *ngIf="f['dateOfBirth'].errors?.['required']">Vui lòng chọn ngày sinh.</span>
                  <span *ngIf="f['dateOfBirth'].errors?.['minimumAge']">Nhân viên phải từ 18 tuổi trở lên.</span>
                </div>
              </div>

              <div class="form-group">
                <label for="hireDate" class="form-label required">Ngày bắt đầu công tác</label>
                <input id="hireDate" 
                       type="date" 
                       class="form-control" 
                       formControlName="hireDate"
                       [class.is-invalid]="f['hireDate'].touched && f['hireDate'].invalid">
                <div class="invalid-feedback" *ngIf="f['hireDate'].touched && f['hireDate'].invalid">
                  Vui lòng chọn ngày vào làm.
                </div>
              </div>

              <div class="form-group">
                <label for="departmentId" class="form-label required">Phòng ban phân công</label>
                <select id="departmentId" 
                        class="form-control" 
                        formControlName="departmentId"
                        [class.is-invalid]="f['departmentId'].touched && f['departmentId'].invalid">
                  <option value="">Chọn phòng ban trực thuộc</option>
                  <option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</option>
                </select>
                <div class="invalid-feedback" *ngIf="f['departmentId'].touched && f['departmentId'].invalid">
                  Vui lòng chọn phòng ban.
                </div>
              </div>

              <div class="form-group">
                <label for="position" class="form-label required">Chức danh công việc</label>
                <input id="position" 
                       type="text" 
                       class="form-control" 
                       formControlName="position" 
                       placeholder="VD: Senior Software Engineer"
                       [class.is-invalid]="f['position'].touched && f['position'].invalid">
                <div class="invalid-feedback" *ngIf="f['position'].touched && f['position'].invalid">
                  Chức vụ là bắt buộc.
                </div>
              </div>

              <div class="form-group">
                <label for="salary" class="form-label required">Mức lương thỏa thuận (VNĐ)</label>
                <input id="salary" 
                       type="number" 
                       class="form-control" 
                       formControlName="salary" 
                       placeholder="VD: 30000000"
                       [class.is-invalid]="f['salary'].touched && f['salary'].invalid">
                <div class="invalid-feedback" *ngIf="f['salary'].touched && f['salary'].invalid">
                  Mức lương từ 1.000.000 VNĐ trở lên.
                </div>
              </div>

              <div class="form-group">
                <label for="status" class="form-label required">Trạng thái công tác</label>
                <select id="status" class="form-control" formControlName="status">
                  <option [value]="EmployeeStatus.Active">Đang làm việc (Active)</option>
                  <option [value]="EmployeeStatus.OnLeave">Nghỉ phép (On Leave)</option>
                  <option [value]="EmployeeStatus.Terminated">Đã thôi việc (Terminated)</option>
                </select>
              </div>
            </div>

            <div class="modal-bottom">
              <button type="button" class="btn btn-secondary btn-sm" (click)="closeModal()">Đóng</button>
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="empForm.invalid || isSubmitting">
                {{ isSubmitting ? 'Đang lưu hồ sơ...' : (isEditing ? 'Lưu thay đổi' : 'Lưu nhân viên') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Employee Details Modal -->
      <div class="modal-layer" *ngIf="isDetailModalOpen" (click)="isDetailModalOpen = false">
        <div class="modal-window modal-md" (click)="$event.stopPropagation()" *ngIf="selectedEmployee as emp">
          <div class="modal-top">
            <div>
              <h3 class="modal-heading">Hồ Sơ Nhân Sự</h3>
              <p class="modal-subheading">Mã hồ sơ #{{ emp.id }}</p>
            </div>
            <button class="modal-x-btn" (click)="isDetailModalOpen = false">✕</button>
          </div>

          <div class="modal-scroll-body">
            <div class="profile-card-top">
              <div class="profile-lg-avatar">{{ getInitials(emp) }}</div>
              <div>
                <h4 class="profile-title">{{ emp.fullName }}</h4>
                <span class="profile-sub">{{ emp.position }} • {{ emp.departmentName }}</span>
                <div class="mt-2">
                  <span class="status-indicator" [ngClass]="'status-' + (emp.status === 1 ? 'active' : emp.status === 2 ? 'onleave' : 'terminated')">
                    {{ emp.status === 1 ? 'Đang làm việc' : emp.status === 2 ? 'Nghỉ phép' : 'Đã thôi việc' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="profile-meta-list">
              <div class="meta-item">
                <span class="meta-label">Phòng ban:</span>
                <span class="meta-val"><strong>{{ emp.departmentName }}</strong> ({{ emp.departmentCode }})</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Email cơ quan:</span>
                <span class="meta-val">{{ emp.email }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Điện thoại liên hệ:</span>
                <span class="meta-val">{{ emp.phoneNumber || 'Chưa cung cấp' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Ngày sinh:</span>
                <span class="meta-val">{{ emp.dateOfBirth | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Ngày vào cơ quan:</span>
                <span class="meta-val">{{ emp.hireDate | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Mức lương cơ bản:</span>
                <span class="meta-val salary-mono">{{ emp.salary | number:'1.0-0' }} VNĐ</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Cập nhật lần cuối:</span>
                <span class="meta-val text-muted">{{ (emp.updatedAt || emp.createdAt) | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            </div>
          </div>

          <div class="modal-bottom">
            <button type="button" class="btn btn-secondary btn-sm" (click)="isDetailModalOpen = false">Đóng</button>
            <button type="button" class="btn btn-primary btn-sm" *ngIf="authService.isManager" (click)="isDetailModalOpen = false; openEditModal(emp)">
              Chỉnh sửa hồ sơ
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <app-confirm-modal 
        [isOpen]="isDeleteModalOpen"
        [title]="'Xác nhận xóa nhân sự: ' + (empToDelete?.fullName || '')"
        [message]="'Bạn có chắc chắn muốn xóa nhân sự này khỏi hệ thống? Dữ liệu nhân viên sẽ được lưu trữ và thu hồi quyền truy cập.'"
        [confirmText]="'Xóa hồ sơ'"
        (confirm)="onConfirmDelete()"
        (cancel)="isDeleteModalOpen = false">
      </app-confirm-modal>
    </div>
  `,
  styles: [`
    .view-wrapper {
      max-width: 1320px;
      margin: 0 auto;
      padding: 28px 24px 48px;
    }
    .view-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .view-breadcrumb {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      color: #64748b;
      margin-bottom: 6px;
    }
    .view-breadcrumb .sep { color: #cbd5e1; }
    .view-breadcrumb .current { color: #0f172a; font-weight: 500; }
    .view-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #0f172a;
      letter-spacing: -0.025em;
      margin: 0 0 4px 0;
    }
    .view-desc {
      color: #64748b;
      font-size: 0.85rem;
      margin: 0;
    }
    .view-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Toolbar box */
    .toolbar-box {
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 16px;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02);
    }
    .search-cell {
      position: relative;
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 260px;
      max-width: 440px;
    }
    .search-svg {
      position: absolute;
      left: 10px;
      color: #94a3b8;
    }
    .search-text-input {
      width: 100%;
      font-family: inherit;
      font-size: 0.84rem;
      padding: 6px 32px 6px 32px;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-sm);
      outline: none;
      background: #f8fafc;
      color: #0f172a;
      transition: all 0.15s ease;
    }
    .search-text-input:focus {
      background: #ffffff;
      border-color: #0f172a;
      box-shadow: 0 0 0 1px #0f172a;
    }
    .search-key-hint {
      position: absolute;
      right: 10px;
      font-size: 0.7rem;
      color: #94a3b8;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 3px;
      padding: 1px 5px;
      line-height: 1.2;
    }
    .filters-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .filter-dropdown {
      font-family: inherit;
      font-size: 0.8rem;
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-sm);
      background: #ffffff;
      color: #334155;
      outline: none;
      cursor: pointer;
    }
    .filter-dropdown:focus {
      border-color: #0f172a;
    }
    .filter-salary-input {
      font-family: inherit;
      font-size: 0.8rem;
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-sm);
      background: #ffffff;
      color: #334155;
      outline: none;
      width: 130px;
    }
    .filter-salary-input:focus {
      border-color: #0f172a;
    }
    .btn-clear-filter {
      background: none;
      border: none;
      font-size: 0.78rem;
      color: #dc2626;
      cursor: pointer;
      padding: 6px 8px;
      font-weight: 500;
      border-radius: 4px;
    }
    .btn-clear-filter:hover {
      background: #fef2f2;
    }

    /* Table container */
    .data-container {
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.03);
      overflow: hidden;
    }
    .table-scroll {
      overflow-x: auto;
    }
    .grid-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.84rem;
    }
    .grid-table th {
      background: #fafafa;
      padding: 10px 16px;
      font-size: 0.72rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border-subtle);
      user-select: none;
    }
    .col-sortable {
      cursor: pointer;
    }
    .col-sortable:hover {
      color: #0f172a;
      background: #f4f4f5;
    }
    .th-content {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .justify-end { justify-content: flex-end; }
    .justify-center { justify-content: center; }
    .text-right { text-align: right; }
    .sort-glyph {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .table-row {
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.1s ease;
    }
    .table-row:hover {
      background: #fafafa;
    }
    .table-row td {
      padding: 12px 16px;
      vertical-align: middle;
      color: #334155;
    }

    /* Person Column */
    .person-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .person-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #334155;
      font-size: 0.75rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 1px solid #cbd5e1;
    }
    .person-info {
      display: flex;
      flex-direction: column;
    }
    .person-name {
      font-weight: 500;
      color: #0f172a;
      cursor: pointer;
      transition: color 0.12s;
    }
    .person-name:hover {
      color: var(--accent);
    }
    .person-meta {
      font-size: 0.72rem;
      color: #94a3b8;
    }

    /* Contact info */
    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .contact-email {
      font-size: 0.8rem;
      color: #334155;
    }
    .contact-phone {
      font-size: 0.74rem;
      color: #94a3b8;
    }

    /* Dept & Position */
    .dept-pill {
      display: inline-block;
      font-size: 0.76rem;
      padding: 2px 8px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #e2e8f0;
    }
    .position-text {
      color: #475569;
      font-size: 0.82rem;
    }
    .salary-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.82rem;
      font-weight: 500;
      color: #0f172a;
    }

    /* Actions */
    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 4px;
    }
    .icon-action-btn {
      background: none;
      border: none;
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      cursor: pointer;
      transition: all 0.12s ease;
    }
    .icon-action-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .text-danger-hover:hover {
      background: #fef2f2;
      color: #dc2626;
    }

    /* Empty & Loading state */
    .empty-state-cell {
      padding: 48px 16px !important;
      text-align: center;
    }
    .empty-state-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .empty-title {
      font-weight: 600;
      color: #0f172a;
      font-size: 0.95rem;
    }
    .empty-desc {
      color: #64748b;
      font-size: 0.82rem;
    }
    .mt-3 { margin-top: 12px; }
    .loading-state {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: #64748b;
      font-size: 0.85rem;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #e2e8f0;
      border-top-color: #0f172a;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Modal System */
    .modal-layer {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 16px;
    }
    .modal-window {
      background: #ffffff;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-overlay);
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .modal-md { max-width: 480px; }
    .modal-lg { max-width: 620px; }
    .modal-top {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }
    .modal-heading {
      font-size: 1.05rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
    }
    .modal-subheading {
      font-size: 0.75rem;
      color: #64748b;
      margin: 2px 0 0 0;
    }
    .modal-x-btn {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 1rem;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
    }
    .modal-x-btn:hover { color: #0f172a; }
    .modal-scroll-body {
      padding: 20px;
      overflow-y: auto;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    @media (max-width: 600px) {
      .form-grid { grid-template-columns: 1fr; }
    }
    .modal-bottom {
      padding: 12px 20px;
      background: #fafafa;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    /* Detail Modal Profile */
    .profile-card-top {
      display: flex;
      align-items: center;
      gap: 14px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f1f5f9;
      margin-bottom: 16px;
    }
    .profile-lg-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #0f172a;
      color: #ffffff;
      font-weight: 600;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .profile-title {
      font-size: 1.05rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
    }
    .profile-sub {
      font-size: 0.8rem;
      color: #64748b;
    }
    .mt-2 { margin-top: 6px; }
    .profile-meta-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .meta-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.82rem;
      padding-bottom: 6px;
      border-bottom: 1px dashed #f1f5f9;
    }
    .meta-label { color: #64748b; }
    .meta-val { color: #0f172a; }
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

  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

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

  getInitials(emp: Employee): string {
    const f = emp.firstName ? emp.firstName.trim().charAt(0) : '';
    const l = emp.lastName ? emp.lastName.trim().charAt(0) : '';
    return (f + l).toUpperCase() || 'NV';
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

  hasActiveFilters(): boolean {
    return !!(this.pagedRequest.searchTerm || 
              this.pagedRequest.departmentId || 
              this.pagedRequest.status || 
              this.pagedRequest.minSalary);
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
          this.toastService.success('Đã cập nhật hồ sơ nhân sự thành công.');
          this.isSubmitting = false;
          this.closeModal();
          this.loadEmployees();
        },
        error: () => this.isSubmitting = false
      });
    } else {
      this.empService.create(formVal).subscribe({
        next: () => {
          this.toastService.success('Đã tiếp nhận hồ sơ nhân sự mới.');
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
        this.toastService.success(`Đã thu hồi hồ sơ nhân sự "${this.empToDelete?.fullName}".`);
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
