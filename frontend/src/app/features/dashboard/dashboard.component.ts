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
    <div class="view-wrapper">
      <!-- Breadcrumb & Page Header -->
      <div class="view-header">
        <div>
          <div class="view-breadcrumb">
            <span>Tổ chức</span>
            <span class="sep">/</span>
            <span class="current">Báo cáo & Tổng quan</span>
          </div>
          <h1 class="view-title">Tổng Quan Nguồn Nhân Lực</h1>
          <p class="view-desc">Số liệu tổng hợp về quy mô nhân sự, phân bổ phòng ban và tình trạng làm việc</p>
        </div>

        <div class="view-actions">
          <a routerLink="/attendance" class="btn btn-secondary btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Chấm công vào / ra
          </a>
          <a routerLink="/employees" class="btn btn-secondary btn-sm">
            Tra cứu nhân sự
          </a>
          <a routerLink="/employees" class="btn btn-primary btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Thêm nhân viên
          </a>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="metrics-row">
        <div class="metric-card">
          <span class="metric-label">Tổng số nhân sự</span>
          <div class="metric-main">
            <span class="metric-number">{{ stats?.totalEmployees ?? '—' }}</span>
            <span class="metric-tag">Chính thức</span>
          </div>
          <span class="metric-sub">Phân bổ trên {{ stats?.totalDepartments ?? 0 }} đơn vị phòng ban</span>
        </div>

        <div class="metric-card">
          <span class="metric-label">Đang làm việc (Active)</span>
          <div class="metric-main">
            <span class="metric-number text-success">{{ stats?.activeEmployees ?? '—' }}</span>
            <span class="metric-tag tag-success">
              {{ getActiveRate() }}%
            </span>
          </div>
          <span class="metric-sub">Tỷ lệ hiện diện thực tế tại cơ quan</span>
        </div>

        <div class="metric-card">
          <span class="metric-label">Nghỉ phép / Nghỉ chế độ</span>
          <div class="metric-main">
            <span class="metric-number text-warning">{{ stats?.onLeaveEmployees ?? '—' }}</span>
            <span class="metric-tag tag-warning">Tạm vắng</span>
          </div>
          <span class="metric-sub">Nhân sự đang bảo lưu chế độ phép</span>
        </div>

        <div class="metric-card">
          <span class="metric-label">Đã thôi việc (Terminated)</span>
          <div class="metric-main">
            <span class="metric-number text-muted">{{ stats?.terminatedEmployees ?? '—' }}</span>
            <span class="metric-tag tag-muted">Lưu trữ</span>
          </div>
          <span class="metric-sub">Hồ sơ đã hoàn tất thủ tục bàn giao</span>
        </div>
      </div>

      <!-- Content Split Grid -->
      <div class="main-grid">
        <!-- Left: Department Headcount Breakdown -->
        <div class="card-section">
          <div class="card-header">
            <div>
              <h2 class="card-title">Cơ cấu & Quy mô phòng ban</h2>
              <p class="card-subtitle">Thống kê số lượng nhân sự trực thuộc các đơn vị</p>
            </div>
            <a routerLink="/departments" class="btn btn-secondary btn-sm">Xem tất cả</a>
          </div>

          <div class="card-body">
            <div class="dept-table-wrapper" *ngIf="departments.length > 0; else noDepts">
              <table class="dept-summary-table">
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Tên phòng ban</th>
                    <th>Vị trí văn phòng</th>
                    <th style="text-align: right;">Nhân sự</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let dept of departments">
                    <td>
                      <span class="dept-code-tag">{{ dept.code }}</span>
                    </td>
                    <td>
                      <strong class="dept-name-text">{{ dept.name }}</strong>
                    </td>
                    <td>
                      <span class="text-muted text-sm">{{ dept.location || 'Chưa cập nhật' }}</span>
                    </td>
                    <td style="text-align: right;">
                      <div class="headcount-badge">
                        <span>{{ dept.employeeCount }}</span>
                        <span class="headcount-unit">người</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <ng-template #noDepts>
              <div class="loading-box">Đang tải dữ liệu phòng ban...</div>
            </ng-template>
          </div>
        </div>

        <!-- Right: Governance & Quick Actions -->
        <div class="card-section">
          <div class="card-header">
            <div>
              <h2 class="card-title">Quyền hạn & Quản trị</h2>
              <p class="card-subtitle">Phân quyền theo vai trò trong hệ thống</p>
            </div>
          </div>

          <div class="card-body">
            <div class="gov-card">
              <div class="role-item">
                <div class="role-badge-pill role-admin">ADMIN</div>
                <div class="role-desc">
                  <strong>Toàn quyền quản trị</strong>
                  <p>Thêm, sửa, xóa nhân viên và phòng ban, quản lý toàn bộ hệ thống.</p>
                </div>
              </div>

              <div class="role-item">
                <div class="role-badge-pill role-manager">MANAGER</div>
                <div class="role-desc">
                  <strong>Quản lý nghiệp vụ</strong>
                  <p>Tạo mới và cập nhật thông tin nhân viên, điều chỉnh cơ cấu phòng ban.</p>
                </div>
              </div>

              <div class="role-item">
                <div class="role-badge-pill role-employee">EMPLOYEE</div>
                <div class="role-desc">
                  <strong>Xem và tra cứu</strong>
                  <p>Tìm kiếm, lọc danh bạ nhân sự nội bộ và xem thông tin chi tiết.</p>
                </div>
              </div>
            </div>

            <div class="quick-links-panel">
              <span class="quick-label">Lối tắt thao tác:</span>
              <div class="quick-buttons">
                <a routerLink="/employees" class="btn btn-secondary btn-sm">Danh bạ nhân viên</a>
                <a routerLink="/departments" class="btn btn-secondary btn-sm">Cơ cấu phòng ban</a>
                <a *ngIf="!authService.isAuthenticated" routerLink="/login" class="btn btn-primary btn-sm">Đăng nhập tài khoản</a>
              </div>
            </div>
          </div>
        </div>
      </div>
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
      margin-bottom: 24px;
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
    .view-breadcrumb .sep {
      color: #cbd5e1;
    }
    .view-breadcrumb .current {
      color: #0f172a;
      font-weight: 500;
    }
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

    /* Metric cards */
    .metrics-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .metric-card {
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 18px 20px;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
    }
    .metric-label {
      font-size: 0.76rem;
      font-weight: 500;
      color: #64748b;
      display: block;
      margin-bottom: 6px;
    }
    .metric-main {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-bottom: 6px;
    }
    .metric-number {
      font-size: 1.75rem;
      font-weight: 600;
      color: #0f172a;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.03em;
    }
    .metric-tag {
      font-size: 0.7rem;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #475569;
    }
    .tag-success { background: #ecfdf5; color: #047857; }
    .tag-warning { background: #fffbeb; color: #b45309; }
    .tag-muted { background: #f1f5f9; color: #64748b; }
    .text-success { color: #047857; }
    .text-warning { color: #b45309; }
    .text-muted { color: #64748b; }
    .metric-sub {
      font-size: 0.75rem;
      color: #94a3b8;
      display: block;
    }

    /* Split Grid */
    .main-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 20px;
    }
    @media (max-width: 900px) {
      .main-grid { grid-template-columns: 1fr; }
    }
    .card-section {
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
      overflow: hidden;
    }
    .card-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .card-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
    }
    .card-subtitle {
      font-size: 0.75rem;
      color: #64748b;
      margin: 2px 0 0 0;
    }
    .card-body {
      padding: 16px 20px;
    }

    /* Clean dept summary table */
    .dept-summary-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.84rem;
    }
    .dept-summary-table th {
      text-align: left;
      font-size: 0.72rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 8px 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    .dept-summary-table td {
      padding: 12px;
      border-bottom: 1px solid #f8fafc;
      color: #334155;
    }
    .dept-summary-table tr:last-child td {
      border-bottom: none;
    }
    .dept-code-tag {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #0f172a;
      border: 1px solid #e2e8f0;
    }
    .dept-name-text {
      color: #0f172a;
      font-weight: 500;
    }
    .text-sm {
      font-size: 0.78rem;
    }
    .headcount-badge {
      display: inline-flex;
      align-items: baseline;
      gap: 3px;
      font-weight: 600;
      color: #0f172a;
    }
    .headcount-unit {
      font-size: 0.72rem;
      font-weight: 400;
      color: #64748b;
    }

    /* Governance panel */
    .gov-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }
    .role-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 10px 12px;
      background: #f8fafc;
      border-radius: var(--radius-sm);
      border: 1px solid #f1f5f9;
    }
    .role-badge-pill {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .role-admin { background: #fef2f2; color: #b91c1c; }
    .role-manager { background: #fffbeb; color: #b45309; }
    .role-employee { background: #f0fdf4; color: #15803d; }
    .role-desc strong {
      display: block;
      font-size: 0.82rem;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 1px;
    }
    .role-desc p {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0;
      line-height: 1.35;
    }
    .quick-links-panel {
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
    }
    .quick-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: #64748b;
      display: block;
      margin-bottom: 8px;
    }
    .quick-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .loading-box {
      text-align: center;
      padding: 32px;
      color: #94a3b8;
      font-size: 0.85rem;
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

  getActiveRate(): number {
    if (!this.stats || this.stats.totalEmployees === 0) return 0;
    return Math.round((this.stats.activeEmployees / this.stats.totalEmployees) * 100);
  }
}
