import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { AttendanceService } from '../../core/services/attendance.service';
import { DepartmentService } from '../../core/services/department.service';
import { EmployeeService } from '../../core/services/employee.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Attendance, AttendancePagedRequest, AttendanceStatistics, AttendanceStatus, TodayAttendanceStatus } from '../../core/models/attendance.model';
import { Department } from '../../core/models/department.model';
import { Employee } from '../../core/models/employee.model';
import { PagedResult } from '../../core/models/paged.model';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent, ConfirmModalComponent],
  providers: [DatePipe],
  template: `
    <div class="view-wrapper">
      <!-- Header -->
      <div class="view-header">
        <div>
          <div class="view-breadcrumb">
            <span>Tổ chức</span>
            <span class="sep">/</span>
            <span class="current">Chấm công & Điểm danh</span>
          </div>
          <h1 class="view-title">Quản Lý Chấm Công</h1>
          <p class="view-desc">Theo dõi thời gian làm việc, chuyên cần, giờ vào/ra và thống kê công nhân sự</p>
        </div>

        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" (click)="exportToExcel()" [disabled]="isExporting" title="Xuất dữ liệu chấm công ra file Excel">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line></svg>
            {{ isExporting ? 'Đang xuất...' : 'Xuất Excel' }}
          </button>
          <button class="btn btn-secondary btn-sm" (click)="loadAllData()" title="Làm mới dữ liệu">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path></svg>
            Làm mới
          </button>
          <button class="btn btn-primary btn-sm" *ngIf="authService.isManager" (click)="openCreateModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Chấm công thủ công
          </button>
        </div>
      </div>

      <!-- Quick Check-In / Hero Card -->
      <div class="checkin-hero-card">
        <div class="clock-col">
          <div class="live-clock-badge">
            <span class="clock-dot"></span>
            <span>Đồng hồ thời gian thực</span>
          </div>
          <div class="live-clock-time">{{ liveTime }}</div>
          <div class="live-clock-date">{{ liveDate }}</div>
        </div>

        <div class="divider-hero"></div>

        <div class="checkin-action-col">
          <div class="checkin-meta-row">
            <div class="user-info-area">
              <span class="checkin-label">Chấm công cho:</span>
              <div class="emp-select-wrap" *ngIf="authService.isManager; else selfOnly">
                <select class="emp-select-box" [value]="selectedEmployeeId || ''" (change)="onEmployeeSelectionChange($event)">
                  <option *ngFor="let emp of allEmployees" [value]="emp.id">
                    {{ emp.fullName }} ({{ emp.position }} - {{ emp.departmentName || 'Phòng ban' }})
                  </option>
                </select>
              </div>
              <ng-template #selfOnly>
                <strong class="self-name">{{ todayStatus?.employeeName || authService.currentUser?.username || 'Nhân viên' }}</strong>
              </ng-template>
            </div>

            <!-- Current Day Status Indicator -->
            <div class="today-status-badge">
              <span class="status-indicator-dot" [ngClass]="getTodayIndicatorClass()"></span>
              <span class="status-indicator-text">{{ getTodayStatusDescription() }}</span>
            </div>
          </div>

          <!-- Note input for quick check-in -->
          <div class="quick-note-row">
            <input type="text" 
                   class="quick-note-input" 
                   [(ngModel)]="quickNote" 
                   placeholder="Ghi chú (tùy chọn: Làm việc từ xa, lý do đi muộn, v.v.)..." />
          </div>

          <!-- Check In / Check Out buttons -->
          <div class="quick-btn-group">
            <button class="btn btn-checkin" 
                    [disabled]="isCheckingIn || todayStatus?.hasCheckedIn" 
                    (click)="handleCheckIn()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>{{ todayStatus?.hasCheckedIn ? 'Đã chấm công vào' : 'Chấm Công Vào (Check-In)' }}</span>
            </button>

            <button class="btn btn-checkout" 
                    [disabled]="isCheckingOut || !todayStatus?.hasCheckedIn || todayStatus?.hasCheckedOut" 
                    (click)="handleCheckOut()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              <span>{{ todayStatus?.hasCheckedOut ? 'Đã hoàn tất tan ca' : 'Chấm Công Ra (Check-Out)' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="metrics-row" *ngIf="stats">
        <div class="metric-card">
          <span class="metric-label">Tổng lượt chấm công</span>
          <div class="metric-main">
            <span class="metric-number">{{ stats.totalRecords }}</span>
            <span class="metric-tag tag-primary">Lượt ghi nhận</span>
          </div>
          <span class="metric-sub">Dữ liệu chấm công toàn hệ thống</span>
        </div>

        <div class="metric-card">
          <span class="metric-label">Đúng giờ (On-Time)</span>
          <div class="metric-main">
            <span class="metric-number text-success">{{ stats.presentCount }}</span>
            <span class="metric-tag tag-success">{{ stats.onTimeRate }}% chuyên cần</span>
          </div>
          <span class="metric-sub">Tỷ lệ nhân sự có mặt đúng giờ</span>
        </div>

        <div class="metric-card">
          <span class="metric-label">Đi muộn / Về sớm</span>
          <div class="metric-main">
            <span class="metric-number text-warning">{{ stats.lateCount + stats.earlyLeaveCount }}</span>
            <span class="metric-tag tag-warning">{{ stats.lateCount }} muộn • {{ stats.earlyLeaveCount }} về sớm</span>
          </div>
          <span class="metric-sub">Cần nhắc nhở và quản trị giờ giấc</span>
        </div>

        <div class="metric-card">
          <span class="metric-label">Tổng giờ làm việc</span>
          <div class="metric-main">
            <span class="metric-number text-info">{{ stats.totalWorkingHours }}h</span>
            <span class="metric-tag tag-info">TB {{ stats.averageHoursPerDay }}h/lượt</span>
          </div>
          <span class="metric-sub">Tổng tích lũy giờ lao động</span>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="toolbar-box">
        <div class="search-cell">
          <svg class="search-svg" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" 
                 class="search-text-input" 
                 placeholder="Tìm theo tên nhân sự, email, phòng ban, ghi chú..."
                 [value]="pagedRequest.searchTerm || ''"
                 (input)="onSearchChanged($event)">
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
              <option [value]="AttendanceStatus.Present">Đúng giờ</option>
              <option [value]="AttendanceStatus.Late">Đi muộn</option>
              <option [value]="AttendanceStatus.EarlyLeave">Về sớm</option>
              <option [value]="AttendanceStatus.LateAndEarlyLeave">Đi muộn & Về sớm</option>
              <option [value]="AttendanceStatus.Absent">Vắng mặt</option>
              <option [value]="AttendanceStatus.OnLeave">Nghỉ phép</option>
            </select>
          </div>

          <!-- Date Quick Filter -->
          <div class="select-wrapper">
            <select class="filter-dropdown" (change)="onDatePresetFilter($event)">
              <option value="all">Thời gian: Tất cả</option>
              <option value="today">Hôm nay</option>
              <option value="last7days">7 ngày qua</option>
              <option value="thismonth">Tháng này</option>
            </select>
          </div>

          <!-- Reset Filter -->
          <button *ngIf="hasActiveFilters()" 
                  class="btn btn-secondary btn-sm" 
                  (click)="resetFilters()" 
                  title="Xóa toàn bộ bộ lọc">
            ✕ Bỏ lọc
          </button>
        </div>
      </div>

      <!-- Main Table Card -->
      <div class="table-card">
        <div class="table-card-header">
          <div class="table-count-info">
            <span class="count-badge">{{ pagedResult?.totalCount || 0 }}</span>
            <span class="count-text">Bản ghi chấm công</span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Phòng ban</th>
                <th (click)="sort('date')" class="sortable-th">
                  <div class="th-content">
                    <span>Ngày</span>
                    <span class="sort-icon" [ngClass]="getSortClass('date')">↕</span>
                  </div>
                </th>
                <th>Giờ vào</th>
                <th>Giờ ra</th>
                <th (click)="sort('workinghours')" class="sortable-th">
                  <div class="th-content">
                    <span>Số giờ</span>
                    <span class="sort-icon" [ngClass]="getSortClass('workinghours')">↕</span>
                  </div>
                </th>
                <th (click)="sort('status')" class="sortable-th">
                  <div class="th-content">
                    <span>Trạng thái</span>
                    <span class="sort-icon" [ngClass]="getSortClass('status')">↕</span>
                  </div>
                </th>
                <th>Ghi chú</th>
                <th class="text-right" *ngIf="authService.isManager">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <!-- Data rows -->
              <tr *ngFor="let item of pagedResult?.items">
                <td>
                  <div class="emp-profile-cell">
                    <div class="emp-avatar">{{ getInitials(item.employeeName) }}</div>
                    <div>
                      <div class="emp-name">{{ item.employeeName }}</div>
                      <div class="emp-sub">{{ item.employeePosition }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="dept-tag">{{ item.departmentName }}</span>
                </td>
                <td>
                  <div class="date-cell">
                    <strong>{{ item.date | date:'dd/MM/yyyy' }}</strong>
                  </div>
                </td>
                <td>
                  <div class="time-cell" *ngIf="item.checkInTime; else noCheckIn">
                    <span class="dot-green"></span>
                    <span>{{ item.checkInTime | date:'HH:mm' }}</span>
                  </div>
                  <ng-template #noCheckIn>
                    <span class="text-muted">—</span>
                  </ng-template>
                </td>
                <td>
                  <div class="time-cell" *ngIf="item.checkOutTime; else noCheckOut">
                    <span class="dot-blue"></span>
                    <span>{{ item.checkOutTime | date:'HH:mm' }}</span>
                  </div>
                  <ng-template #noCheckOut>
                    <span class="text-muted">Chưa ra</span>
                  </ng-template>
                </td>
                <td>
                  <span class="hours-tag" *ngIf="item.workingHours != null">
                    {{ item.workingHours }}h
                  </span>
                  <span class="text-muted" *ngIf="item.workingHours == null">—</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="getStatusBadgeClass(item.status)">
                    {{ item.statusText }}
                  </span>
                </td>
                <td>
                  <span class="note-text" [title]="item.notes || ''">{{ item.notes || '—' }}</span>
                </td>
                <td class="text-right" *ngIf="authService.isManager">
                  <div class="row-actions">
                    <button class="action-btn action-edit" (click)="openEditModal(item)" title="Chỉnh sửa bản ghi">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </button>
                    <button class="action-btn action-delete" *ngIf="authService.isAdmin" (click)="openDeleteConfirm(item)" title="Xóa bản ghi">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Empty state -->
              <tr *ngIf="!isLoading && (!pagedResult?.items || pagedResult?.items?.length === 0)">
                <td [attr.colspan]="authService.isManager ? 9 : 8" class="empty-state-cell">
                  <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <p class="empty-title">Không tìm thấy dữ liệu chấm công</p>
                    <p class="empty-desc">Thử điều chỉnh lại bộ lọc hoặc thực hiện chấm công mới</p>
                  </div>
                </td>
              </tr>

              <!-- Loading state -->
              <tr *ngIf="isLoading">
                <td [attr.colspan]="authService.isManager ? 9 : 8" class="empty-state-cell">
                  <div class="loading-state">
                    <span class="spinner"></span>
                    <span>Đang tải dữ liệu chấm công...</span>
                  </div>
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

      <!-- Add / Edit Attendance Modal -->
      <div class="modal-layer" *ngIf="isModalOpen" (click)="closeModal()">
        <div class="modal-window modal-md" (click)="$event.stopPropagation()">
          <div class="modal-top">
            <div>
              <h3 class="modal-heading">{{ isEditing ? 'Điều Chỉnh Bản Ghi Chấm Công' : 'Thêm Chấm Công Thủ Công' }}</h3>
              <p class="modal-subheading">Ghi nhận hoặc điều chỉnh giờ công, trạng thái và giải trình lý do</p>
            </div>
            <button class="modal-x-btn" (click)="closeModal()">✕</button>
          </div>

          <form [formGroup]="attForm" (ngSubmit)="onSubmitModal()">
            <div class="modal-scroll-body form-grid">
              <!-- Employee (only on create) -->
              <div class="form-group full-width" *ngIf="!isEditing">
                <label class="form-label required">Nhân viên</label>
                <select class="form-control" formControlName="employeeId">
                  <option value="" disabled>-- Chọn nhân viên --</option>
                  <option *ngFor="let emp of allEmployees" [value]="emp.id">
                    {{ emp.fullName }} ({{ emp.position }} - {{ emp.departmentName || 'Phòng ban' }})
                  </option>
                </select>
                <div class="invalid-feedback" *ngIf="f['employeeId']?.touched && f['employeeId']?.invalid">
                  Vui lòng chọn nhân viên.
                </div>
              </div>

              <!-- Date -->
              <div class="form-group">
                <label class="form-label required">Ngày chấm công</label>
                <input type="date" class="form-control" formControlName="date">
                <div class="invalid-feedback" *ngIf="f['date']?.touched && f['date']?.invalid">
                  Vui lòng chọn ngày làm việc.
                </div>
              </div>

              <!-- Status -->
              <div class="form-group">
                <label class="form-label required">Trạng thái</label>
                <select class="form-control" formControlName="status">
                  <option [value]="AttendanceStatus.Present">Đúng giờ</option>
                  <option [value]="AttendanceStatus.Late">Đi muộn</option>
                  <option [value]="AttendanceStatus.EarlyLeave">Về sớm</option>
                  <option [value]="AttendanceStatus.LateAndEarlyLeave">Đi muộn & Về sớm</option>
                  <option [value]="AttendanceStatus.Absent">Vắng mặt</option>
                  <option [value]="AttendanceStatus.OnLeave">Nghỉ phép</option>
                </select>
              </div>

              <!-- Check-In Time -->
              <div class="form-group">
                <label class="form-label">Giờ vào (HH:mm)</label>
                <input type="time" class="form-control" formControlName="checkInTime">
              </div>

              <!-- Check-Out Time -->
              <div class="form-group">
                <label class="form-label">Giờ ra (HH:mm)</label>
                <input type="time" class="form-control" formControlName="checkOutTime">
              </div>

              <!-- Working Hours -->
              <div class="form-group">
                <label class="form-label">Số giờ công (tùy chọn tự tính)</label>
                <input type="number" step="0.25" min="0" max="24" class="form-control" formControlName="workingHours" placeholder="VD: 8.0">
              </div>

              <!-- Notes -->
              <div class="form-group full-width">
                <label class="form-label">Ghi chú / Giải trình</label>
                <textarea class="form-control" rows="2" formControlName="notes" placeholder="VD: Quên quẹt thẻ do họp khách hàng..."></textarea>
              </div>
            </div>

            <div class="modal-footer-btns">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Hủy bỏ</button>
              <button type="submit" class="btn btn-primary" [disabled]="isSubmitting || attForm.invalid">
                {{ isSubmitting ? 'Đang lưu...' : (isEditing ? 'Cập nhật bản ghi' : 'Tạo mới bản ghi') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Confirm Delete Modal -->
      <app-confirm-modal
        [isOpen]="isDeleteModalOpen"
        title="Xóa Bản Ghi Chấm Công"
        [message]="deleteModalMessage"
        confirmButtonText="Xác nhận xóa"
        
        (confirm)="handleDeleteConfirm()"
        (cancel)="isDeleteModalOpen = false">
      </app-confirm-modal>
    </div>
  `,
  styles: [`
    .checkin-hero-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 20px 24px;
      margin-bottom: 20px;
      box-shadow: var(--shadow-card);
      display: flex;
      align-items: center;
      gap: 28px;
    }

    .clock-col {
      min-width: 200px;
    }

    .live-clock-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
    }

    .clock-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #10b981;
      animation: pulse-dot 1.5s infinite;
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.2); }
    }

    .live-clock-time {
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary);
      font-variant-numeric: tabular-nums;
      line-height: 1.1;
    }

    .live-clock-date {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .divider-hero {
      width: 1px;
      align-self: stretch;
      background-color: var(--border-color);
    }

    .checkin-action-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .checkin-meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .user-info-area {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .checkin-label {
      font-size: 0.82rem;
      color: var(--text-muted);
    }

    .emp-select-wrap {
      min-width: 240px;
    }

    .emp-select-box {
      width: 100%;
      padding: 6px 10px;
      font-size: 0.84rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background-color: #f8fafc;
      color: var(--text-main);
      font-family: inherit;
      outline: none;
    }

    .self-name {
      font-size: 0.95rem;
      color: var(--text-main);
    }

    .today-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 6px 12px;
      border-radius: 999px;
      background-color: #f1f5f9;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .status-indicator-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .dot-not-checked { background-color: #94a3b8; }
    .dot-working { background-color: #10b981; animation: pulse-dot 1.5s infinite; }
    .dot-completed { background-color: #2563eb; }

    .quick-note-row {
      width: 100%;
    }

    .quick-note-input {
      width: 100%;
      padding: 7px 12px;
      font-size: 0.82rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background-color: #fafbfc;
      outline: none;
      transition: all 0.15s ease;
    }

    .quick-note-input:focus {
      border-color: var(--accent);
      background-color: #ffffff;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
    }

    .quick-btn-group {
      display: flex;
      gap: 12px;
    }

    .btn-checkin {
      flex: 1;
      background-color: #059669;
      color: #ffffff;
      border: 1px solid #059669;
      padding: 9px 16px;
      font-weight: 600;
    }

    .btn-checkin:hover:not(:disabled) {
      background-color: #047857;
    }

    .btn-checkout {
      flex: 1;
      background-color: #d97706;
      color: #ffffff;
      border: 1px solid #d97706;
      padding: 9px 16px;
      font-weight: 600;
    }

    .btn-checkout:hover:not(:disabled) {
      background-color: #b45309;
    }

    .dot-green {
      display: inline-block;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background-color: #10b981;
      margin-right: 6px;
    }

    .dot-blue {
      display: inline-block;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background-color: #2563eb;
      margin-right: 6px;
    }

    .time-cell {
      display: flex;
      align-items: center;
      font-variant-numeric: tabular-nums;
      font-weight: 500;
    }

    .date-cell strong {
      font-variant-numeric: tabular-nums;
      color: var(--text-main);
    }

    .hours-tag {
      display: inline-block;
      padding: 2px 7px;
      border-radius: var(--radius-sm);
      background-color: #f1f5f9;
      font-weight: 600;
      font-size: 0.8rem;
      color: #334155;
    }

    .tag-primary {
      background-color: #eff6ff;
      color: #1d4ed8;
    }

    .text-info {
      color: #0284c7;
    }

    .tag-info {
      background-color: #f0f9ff;
      color: #0369a1;
    }

    .badge-present {
      background-color: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }

    .badge-late {
      background-color: #fffbeb;
      color: #92400e;
      border: 1px solid #fde68a;
    }

    .badge-early {
      background-color: #f5f3ff;
      color: #5b21b6;
      border: 1px solid #ddd6fe;
    }

    .badge-late-early {
      background-color: #fff1f2;
      color: #9f1239;
      border: 1px solid #fecdd3;
    }

    .badge-absent {
      background-color: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    .badge-onleave {
      background-color: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    .emp-profile-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .emp-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: #e2e8f0;
      color: #1e293b;
      font-size: 0.76rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .emp-name {
      font-weight: 500;
      color: var(--text-main);
      font-size: 0.86rem;
    }

    .emp-sub {
      font-size: 0.74rem;
      color: var(--text-muted);
    }

    .dept-tag {
      display: inline-block;
      font-size: 0.76rem;
      color: #475569;
      background: #f8fafc;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      border: 1px solid #e2e8f0;
    }

    .note-text {
      max-width: 180px;
      display: inline-block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.8rem;
      color: #64748b;
    }

    .modal-md {
      max-width: 540px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      padding: 20px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    @media (max-width: 900px) {
      .checkin-hero-card {
        flex-direction: column;
        align-items: stretch;
      }
      .divider-hero {
        height: 1px;
        width: 100%;
      }
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AttendanceListComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private attendanceService = inject(AttendanceService);
  private departmentService = inject(DepartmentService);
  private employeeService = inject(EmployeeService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private datePipe = inject(DatePipe);

  // Enums for template
  AttendanceStatus = AttendanceStatus;

  // Real-time clock
  liveTime = '';
  liveDate = '';
  private timerInterval?: any;

  // Today Status & Quick Check-in
  todayStatus: TodayAttendanceStatus | null = null;
  selectedEmployeeId: number | null = null;
  quickNote = '';
  isCheckingIn = false;
  isCheckingOut = false;
  isExporting = false;

  // Data & Statistics
  pagedResult: PagedResult<Attendance> | null = null;
  stats: AttendanceStatistics | null = null;
  departments: Department[] = [];
  allEmployees: Employee[] = [];
  isLoading = false;

  // Filter & Pagination
  pagedRequest: AttendancePagedRequest = {
    pageNumber: 1,
    pageSize: 10,
    sortBy: 'date',
    sortDescending: true
  };
  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  // Modal Create/Edit
  isModalOpen = false;
  isEditing = false;
  editingId?: number;
  isSubmitting = false;
  attForm!: FormGroup;

  // Delete Confirm
  isDeleteModalOpen = false;
  isDeleting = false;
  itemToDelete?: Attendance;
  deleteModalMessage = '';

  ngOnInit(): void {
    this.initClock();
    this.initForm();
    this.initSearchDebounce();
    this.loadDepartments();
    this.loadEmployeesList();
    this.loadAllData();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.searchSub?.unsubscribe();
  }

  private initClock(): void {
    const updateTime = () => {
      const now = new Date();
      this.liveTime = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = days[now.getDay()];
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      this.liveDate = `${dayName}, ${day}/${month}/${year}`;
    };
    updateTime();
    this.timerInterval = setInterval(updateTime, 1000);
  }

  private initForm(): void {
    const todayStr = new Date().toISOString().substring(0, 10);
    this.attForm = this.fb.group({
      employeeId: ['', Validators.required],
      date: [todayStr, Validators.required],
      checkInTime: ['08:30'],
      checkOutTime: ['17:30'],
      workingHours: [8],
      status: [AttendanceStatus.Present, Validators.required],
      notes: ['']
    });
  }

  get f() {
    return this.attForm.controls;
  }

  private initSearchDebounce(): void {
    this.searchSub = this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(term => {
      this.pagedRequest.searchTerm = term;
      this.pagedRequest.pageNumber = 1;
      this.loadAttendances();
    });
  }

  exportToExcel(): void {
    this.isExporting = true;
    this.toastService.info("Đang chuẩn bị dữ liệu xuất Excel...");
    this.attendanceService.exportExcel(this.pagedRequest).subscribe({
      next: (blob: Blob) => {
        this.isExporting = false;
        const now = new Date();
        const timestamp = now.getFullYear() +
          String(now.getMonth() + 1).padStart(2, "0") +
          String(now.getDate()).padStart(2, "0") + "_" +
          String(now.getHours()).padStart(2, "0") +
          String(now.getMinutes()).padStart(2, "0");
        const fileName = `Bang_Cham_Cong_${timestamp}.xlsx`;
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.toastService.success("Xuất file Excel bảng chấm công thành công!");
      },
      error: () => {
        this.isExporting = false;
        this.toastService.error("Có lỗi xảy ra khi xuất file Excel.");
      }
    });
  }

  loadAllData(): void {
    this.loadAttendances();
    this.loadStatistics();
    this.loadTodayStatus();
  }

  loadAttendances(): void {
    this.isLoading = true;
    this.attendanceService.getPaged(this.pagedRequest).subscribe({
      next: res => {
        this.pagedResult = res;
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.toastService.error('Không thể tải danh sách chấm công.');
      }
    });
  }

  loadStatistics(): void {
    const now = new Date();
    this.attendanceService.getStatistics(now.getMonth() + 1, now.getFullYear(), this.pagedRequest.departmentId).subscribe({
      next: res => {
        this.stats = res;
      },
      error: () => {}
    });
  }

  loadTodayStatus(): void {
    this.attendanceService.getTodayStatus(this.selectedEmployeeId || undefined).subscribe({
      next: res => {
        this.todayStatus = res;
        if (!this.selectedEmployeeId && res.employeeId) {
          this.selectedEmployeeId = res.employeeId;
        }
      },
      error: () => {}
    });
  }

  loadDepartments(): void {
    this.departmentService.getAll().subscribe({
      next: depts => this.departments = depts,
      error: () => {}
    });
  }

  loadEmployeesList(): void {
    this.employeeService.getAll().subscribe({
      next: res => {
        this.allEmployees = res.items || [];
        if (!this.selectedEmployeeId && this.allEmployees.length > 0) {
          this.selectedEmployeeId = this.allEmployees[0].id;
          this.loadTodayStatus();
        }
      },
      error: () => {}
    });
  }

  onEmployeeSelectionChange(event: any): void {
    const val = event.target.value;
    this.selectedEmployeeId = val ? parseInt(val, 10) : null;
    this.loadTodayStatus();
  }

  handleCheckIn(): void {
    this.isCheckingIn = true;
    this.attendanceService.checkIn({
      employeeId: this.selectedEmployeeId || undefined,
      notes: this.quickNote.trim() || undefined
    }).subscribe({
      next: () => {
        this.isCheckingIn = false;
        this.quickNote = '';
        this.toastService.success('Chấm công vào thành công!');
        this.loadAllData();
      },
      error: err => {
        this.isCheckingIn = false;
        const msg = err.error?.detail || err.error?.message || 'Chấm công vào thất bại.';
        this.toastService.error(msg);
      }
    });
  }

  handleCheckOut(): void {
    this.isCheckingOut = true;
    this.attendanceService.checkOut({
      employeeId: this.selectedEmployeeId || undefined,
      notes: this.quickNote.trim() || undefined
    }).subscribe({
      next: () => {
        this.isCheckingOut = false;
        this.quickNote = '';
        this.toastService.success('Chấm công ra thành công! Đã ghi nhận số giờ công.');
        this.loadAllData();
      },
      error: err => {
        this.isCheckingOut = false;
        const msg = err.error?.detail || err.error?.message || 'Chấm công ra thất bại.';
        this.toastService.error(msg);
      }
    });
  }

  getTodayIndicatorClass(): string {
    if (!this.todayStatus?.hasCheckedIn) return 'dot-not-checked';
    if (this.todayStatus.hasCheckedIn && !this.todayStatus.hasCheckedOut) return 'dot-working';
    return 'dot-completed';
  }

  getTodayStatusDescription(): string {
    if (!this.todayStatus?.hasCheckedIn) {
      return 'Chưa chấm công hôm nay';
    }
    if (this.todayStatus.hasCheckedIn && !this.todayStatus.hasCheckedOut) {
      const inTime = this.todayStatus.attendance?.checkInTime;
      const formatted = inTime ? this.datePipe.transform(inTime, 'HH:mm') : '';
      return `Đang làm việc • Vào lúc ${formatted}`;
    }
    const outTime = this.todayStatus?.attendance?.checkOutTime;
    const formattedOut = outTime ? this.datePipe.transform(outTime, 'HH:mm') : '';
    const hours = this.todayStatus?.attendance?.workingHours || 0;
    return `Đã tan ca lúc ${formattedOut} (${hours}h)`;
  }

  // Filter actions
  onSearchChanged(event: any): void {
    this.searchSubject.next(event.target.value);
  }

  onDepartmentFilter(event: any): void {
    const val = event.target.value;
    this.pagedRequest.departmentId = val ? parseInt(val, 10) : undefined;
    this.pagedRequest.pageNumber = 1;
    this.loadAllData();
  }

  onStatusFilter(event: any): void {
    const val = event.target.value;
    this.pagedRequest.status = val ? parseInt(val, 10) : undefined;
    this.pagedRequest.pageNumber = 1;
    this.loadAttendances();
  }

  onDatePresetFilter(event: any): void {
    const preset = event.target.value;
    const today = new Date();
    if (preset === 'today') {
      const todayStr = today.toISOString().substring(0, 10);
      this.pagedRequest.startDate = todayStr;
      this.pagedRequest.endDate = todayStr;
    } else if (preset === 'last7days') {
      const past7 = new Date();
      past7.setDate(today.getDate() - 7);
      this.pagedRequest.startDate = past7.toISOString().substring(0, 10);
      this.pagedRequest.endDate = today.toISOString().substring(0, 10);
    } else if (preset === 'thismonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      this.pagedRequest.startDate = firstDay.toISOString().substring(0, 10);
      this.pagedRequest.endDate = today.toISOString().substring(0, 10);
    } else {
      this.pagedRequest.startDate = undefined;
      this.pagedRequest.endDate = undefined;
    }
    this.pagedRequest.pageNumber = 1;
    this.loadAttendances();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.pagedRequest.searchTerm ||
      this.pagedRequest.departmentId ||
      this.pagedRequest.status ||
      this.pagedRequest.startDate ||
      this.pagedRequest.endDate
    );
  }

  resetFilters(): void {
    this.pagedRequest = {
      pageNumber: 1,
      pageSize: 10,
      sortBy: 'date',
      sortDescending: true
    };
    this.loadAllData();
  }

  // Sorting & Paging
  sort(column: string): void {
    if (this.pagedRequest.sortBy === column) {
      this.pagedRequest.sortDescending = !this.pagedRequest.sortDescending;
    } else {
      this.pagedRequest.sortBy = column;
      this.pagedRequest.sortDescending = true;
    }
    this.loadAttendances();
  }

  getSortClass(column: string): string {
    if (this.pagedRequest.sortBy !== column) return '';
    return this.pagedRequest.sortDescending ? 'sort-desc' : 'sort-asc';
  }

  onPageChange(page: number): void {
    this.pagedRequest.pageNumber = page;
    this.loadAttendances();
  }

  onPageSizeChange(size: number): void {
    this.pagedRequest.pageSize = size;
    this.pagedRequest.pageNumber = 1;
    this.loadAttendances();
  }

  // Modal open/close
  openCreateModal(): void {
    this.isEditing = false;
    this.editingId = undefined;
    const todayStr = new Date().toISOString().substring(0, 10);
    this.attForm.reset({
      employeeId: this.selectedEmployeeId || '',
      date: todayStr,
      checkInTime: '08:30',
      checkOutTime: '17:30',
      workingHours: 8,
      status: AttendanceStatus.Present,
      notes: ''
    });
    this.isModalOpen = true;
  }

  openEditModal(item: Attendance): void {
    this.isEditing = true;
    this.editingId = item.id;
    const dateStr = item.date ? item.date.substring(0, 10) : '';
    const inTime = item.checkInTime ? this.datePipe.transform(item.checkInTime, 'HH:mm') : '';
    const outTime = item.checkOutTime ? this.datePipe.transform(item.checkOutTime, 'HH:mm') : '';

    this.attForm.reset({
      employeeId: item.employeeId,
      date: dateStr,
      checkInTime: inTime,
      checkOutTime: outTime,
      workingHours: item.workingHours,
      status: item.status,
      notes: item.notes || ''
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isSubmitting = false;
  }

  onSubmitModal(): void {
    if (this.attForm.invalid) {
      this.attForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formVal = this.attForm.value;
    const dateVal = formVal.date;

    let checkInDateTime: string | undefined = undefined;
    if (formVal.checkInTime) {
      checkInDateTime = `${dateVal}T${formVal.checkInTime}:00Z`;
    }

    let checkOutDateTime: string | undefined = undefined;
    if (formVal.checkOutTime) {
      checkOutDateTime = `${dateVal}T${formVal.checkOutTime}:00Z`;
    }

    if (this.isEditing && this.editingId) {
      this.attendanceService.update(this.editingId, {
        date: dateVal,
        checkInTime: checkInDateTime,
        checkOutTime: checkOutDateTime,
        workingHours: formVal.workingHours ? parseFloat(formVal.workingHours) : undefined,
        status: parseInt(formVal.status, 10),
        notes: formVal.notes || undefined
      }).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.closeModal();
          this.toastService.success('Đã cập nhật bản ghi chấm công.');
          this.loadAllData();
        },
        error: err => {
          this.isSubmitting = false;
          const msg = err.error?.detail || err.error?.message || 'Cập nhật thất bại.';
          this.toastService.error(msg);
        }
      });
    } else {
      this.attendanceService.create({
        employeeId: parseInt(formVal.employeeId, 10),
        date: dateVal,
        checkInTime: checkInDateTime,
        checkOutTime: checkOutDateTime,
        workingHours: formVal.workingHours ? parseFloat(formVal.workingHours) : undefined,
        status: parseInt(formVal.status, 10),
        notes: formVal.notes || undefined
      }).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.closeModal();
          this.toastService.success('Đã thêm bản ghi chấm công mới.');
          this.loadAllData();
        },
        error: err => {
          this.isSubmitting = false;
          const msg = err.error?.detail || err.error?.message || 'Thêm bản ghi thất bại.';
          this.toastService.error(msg);
        }
      });
    }
  }

  // Delete Confirm
  openDeleteConfirm(item: Attendance): void {
    this.itemToDelete = item;
    const dateStr = this.datePipe.transform(item.date, 'dd/MM/yyyy');
    this.deleteModalMessage = `Bạn có chắc chắn muốn xóa bản ghi chấm công ngày ${dateStr} của nhân viên "${item.employeeName}"?`;
    this.isDeleteModalOpen = true;
  }

  handleDeleteConfirm(): void {
    if (!this.itemToDelete) return;
    this.isDeleting = true;
    this.attendanceService.delete(this.itemToDelete.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.isDeleteModalOpen = false;
        this.itemToDelete = undefined;
        this.toastService.success('Đã xóa bản ghi chấm công.');
        this.loadAllData();
      },
      error: err => {
        this.isDeleting = false;
        const msg = err.error?.detail || err.error?.message || 'Không thể xóa bản ghi.';
        this.toastService.error(msg);
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return 'NV';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getStatusBadgeClass(status: AttendanceStatus): string {
    switch (status) {
      case AttendanceStatus.Present: return 'badge-present';
      case AttendanceStatus.Late: return 'badge-late';
      case AttendanceStatus.EarlyLeave: return 'badge-early';
      case AttendanceStatus.LateAndEarlyLeave: return 'badge-late-early';
      case AttendanceStatus.Absent: return 'badge-absent';
      case AttendanceStatus.OnLeave: return 'badge-onleave';
      default: return '';
    }
  }
}
