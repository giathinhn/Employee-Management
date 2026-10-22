import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmployeeService } from '../../core/services/employee.service';
import { DepartmentService } from '../../core/services/department.service';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeStatistics } from '../../core/models/employee.model';
import { Department } from '../../core/models/department.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Bảng điều khiển tổng quan</h1>
          <p class="page-subtitle">Hệ thống theo dõi nhân sự, cơ cấu phòng ban và trạng thái làm việc</p>
        </div>
        <div class="header-actions" *ngIf="authService.isManager">
          <a routerLink="/employees" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
            Quản lý Nhân viên
          </a>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon bg-blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">Tổng số Nhân viên</span>
            <div class="stat-value">{{ stats?.totalEmployees ?? '...' }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-green">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">Đang làm việc (Active)</span>
            <div class="stat-value text-green">{{ stats?.activeEmployees ?? '...' }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-amber">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">Nghỉ phép (On Leave)</span>
            <div class="stat-value text-amber">{{ stats?.onLeaveEmployees ?? '...' }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-red">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">Đã thôi việc (Terminated)</span>
            <div class="stat-value text-red">{{ stats?.terminatedEmployees ?? '...' }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-purple">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">Số Phòng ban</span>
            <div class="stat-value">{{ stats?.totalDepartments ?? '...' }}</div>
          </div>
        </div>
      </div>

      <!-- Quick links and Departments Grid -->
      <div class="dashboard-grid">
        <div class="content-card">
          <div class="card-header">
            <h2 class="card-title">Cơ cấu Phòng ban</h2>
            <a routerLink="/departments" class="btn btn-outline-primary btn-sm">Xem tất cả</a>
          </div>
          <div class="card-body">
            <div class="dept-list" *ngIf="departments.length > 0; else noDepts">
              <div class="dept-item" *ngFor="let dept of departments">
                <div class="dept-info">
                  <span class="dept-code">{{ dept.code }}</span>
                  <div>
                    <h4 class="dept-name">{{ dept.name }}</h4>
                    <span class="dept-loc">{{ dept.location || 'Chưa cập nhật vị trí' }}</span>
                  </div>
                </div>
                <div class="dept-badge">
                  <strong>{{ dept.employeeCount }}</strong> nhân sự
                </div>
              </div>
            </div>
            <ng-template #noDepts>
              <div class="empty-placeholder">Đang tải dữ liệu phòng ban...</div>
            </ng-template>
          </div>
        </div>

        <div class="content-card">
          <div class="card-header">
            <h2 class="card-title">Thông tin hệ thống & Quyền hạn</h2>
          </div>
          <div class="card-body">
            <div class="info-list">
              <div class="info-row">
                <span class="info-key">Kiến trúc công nghệ:</span>
                <span class="info-val">Angular 18 + ASP.NET Core 8 Web API + PostgreSQL</span>
              </div>
              <div class="info-row">
                <span class="info-key">Trạng thái đăng nhập:</span>
                <span class="info-val" *ngIf="authService.currentUser$ | async as u; else notLogin">
                  Đã đăng nhập với quyền <strong>{{ u.role }}</strong> ({{ u.username }})
                </span>
                <ng-template #notLogin>
                  <span class="info-val text-amber">Chưa đăng nhập (Khách xem)</span>
                </ng-template>
              </div>
              <div class="info-row">
                <span class="info-key">Phân quyền chức năng:</span>
                <span class="info-val">
                  • <strong>Admin</strong>: Toàn quyền CRUD nhân viên, phòng ban, phân quyền.<br>
                  • <strong>Manager</strong>: Thêm mới, chỉnh sửa nhân viên & phòng ban.<br>
                  • <strong>Employee / Khách</strong>: Xem danh sách, tìm kiếm, lọc, phân trang.
                </span>
              </div>
            </div>

            <div class="banner-box">
              <h4>Bắt đầu thao tác nhanh:</h4>
              <div class="btn-group-wrap">
                <a routerLink="/employees" class="btn btn-primary btn-sm">Danh sách Nhân viên</a>
                <a routerLink="/departments" class="btn btn-outline-secondary btn-sm">Danh sách Phòng ban</a>
                <a *ngIf="!authService.isAuthenticated" routerLink="/login" class="btn btn-outline-primary btn-sm">Đăng nhập Quản trị</a>
              </div>
            </div>
          </div>
        </div>
      </div>
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
      margin-bottom: 28px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .page-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 6px 0;
      letter-spacing: -0.02em;
    }
    .page-subtitle {
      color: #6b7280;
      font-size: 0.95rem;
      margin: 0;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .bg-blue { background: #eff6ff; color: #2563eb; }
    .bg-green { background: #ecfdf5; color: #059669; }
    .bg-amber { background: #fffbeb; color: #d97706; }
    .bg-red { background: #fef2f2; color: #dc2626; }
    .bg-purple { background: #f5f3ff; color: #7c3aed; }

    .stat-content {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 0.8rem;
      font-weight: 500;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      line-height: 1;
    }
    .text-green { color: #059669; }
    .text-amber { color: #d97706; }
    .text-red { color: #dc2626; }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }
    .content-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .card-header {
      padding: 18px 24px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .card-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
    .card-body {
      padding: 24px;
    }
    .dept-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .dept-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #f3f4f6;
    }
    .dept-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .dept-code {
      background: #e0e7ff;
      color: #4338ca;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .dept-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 2px 0;
    }
    .dept-loc {
      font-size: 0.8rem;
      color: #6b7280;
    }
    .dept-badge {
      font-size: 0.85rem;
      color: #4b5563;
    }
    .dept-badge strong {
      color: #111827;
    }
    .info-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }
    .info-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.9rem;
    }
    .info-key {
      font-weight: 600;
      color: #374151;
    }
    .info-val {
      color: #4b5563;
      line-height: 1.5;
    }
    .banner-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 16px;
    }
    .banner-box h4 {
      margin: 0 0 12px 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: #166534;
    }
    .btn-group-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private departmentService = inject(DepartmentService);
  authService = inject(AuthService);

  stats: EmployeeStatistics | null = null;
  departments: Department[] = [];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.employeeService.getStatistics().subscribe({
      next: res => this.stats = res,
      error: () => {}
    });

    this.departmentService.getAll().subscribe({
      next: res => this.departments = res.slice(0, 5),
      error: () => {}
    });
  }
}
