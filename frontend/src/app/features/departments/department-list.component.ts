import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentService } from '../../core/services/department.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Department } from '../../core/models/department.model';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmModalComponent],
  template: `
    <div class="view-wrapper">
      <!-- Breadcrumb & Header -->
      <div class="view-header">
        <div>
          <div class="view-breadcrumb">
            <span>Tổ chức</span>
            <span class="sep">/</span>
            <span class="current">Cơ cấu phòng ban</span>
          </div>
          <h1 class="view-title">Đơn Vị & Phòng Ban</h1>
          <p class="view-desc">Quản lý cơ cấu tổ chức, trụ sở làm việc và định biên nhân sự các bộ phận</p>
        </div>

        <div class="view-actions" *ngIf="authService.isManager">
          <button class="btn btn-secondary btn-sm" (click)="loadDepartments()" title="Làm mới">
            Làm mới
          </button>
          <button class="btn btn-primary btn-sm" (click)="openCreateModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Thêm phòng ban mới
          </button>
        </div>
      </div>

      <!-- Integrated Search Toolbar -->
      <div class="toolbar-box">
        <div class="search-cell">
          <svg class="search-svg" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" 
                 class="search-text-input" 
                 placeholder="Tìm theo tên phòng ban, mã số, hoặc vị trí..."
                 [value]="searchTerm"
                 (input)="onSearchInput($event)">
        </div>
        <div class="toolbar-meta">
          <span class="text-muted text-sm">Tổng cộng <strong>{{ departments.length }}</strong> đơn vị</span>
        </div>
      </div>

      <!-- Department Table -->
      <div class="data-container">
        <div class="table-scroll">
          <table class="grid-table">
            <thead>
              <tr>
                <th style="width: 110px;">Mã đơn vị</th>
                <th>Tên phòng ban</th>
                <th>Vị trí văn phòng</th>
                <th>Mô tả chức năng</th>
                <th style="width: 140px; text-align: center;">Định biên nhân sự</th>
                <th style="width: 110px; text-align: right;" *ngIf="authService.isManager">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let dept of departments" class="table-row">
                <td>
                  <span class="code-mono">{{ dept.code }}</span>
                </td>
                <td>
                  <div class="dept-name-cell">
                    <strong class="dept-title">{{ dept.name }}</strong>
                    <span class="dept-date">Khởi tạo: {{ dept.createdAt | date:'dd/MM/yyyy' }}</span>
                  </div>
                </td>
                <td>
                  <span class="text-slate">{{ dept.location || '—' }}</span>
                </td>
                <td>
                  <span class="desc-clamp" [title]="dept.description">{{ dept.description || 'Chưa cập nhật mô tả' }}</span>
                </td>
                <td style="text-align: center;">
                  <span class="headcount-pill" [class.pill-empty]="dept.employeeCount === 0">
                    {{ dept.employeeCount }} nhân sự
                  </span>
                </td>
                <td style="text-align: right;" *ngIf="authService.isManager">
                  <div class="action-buttons">
                    <button class="icon-action-btn" (click)="openEditModal(dept)" title="Chỉnh sửa thông tin">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
                    </button>
                    <button class="icon-action-btn text-danger-hover" 
                            *ngIf="authService.isAdmin" 
                            (click)="confirmDelete(dept)" 
                            title="Xóa phòng ban">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="departments.length === 0 && !isLoading">
                <td [attr.colspan]="authService.isManager ? 6 : 5" class="empty-state-cell">
                  <div class="empty-state-inner">
                    <span class="empty-title">Không tìm thấy phòng ban nào</span>
                    <span class="empty-desc">Không có kết quả khớp với từ khóa tìm kiếm.</span>
                  </div>
                </td>
              </tr>

              <tr *ngIf="isLoading">
                <td [attr.colspan]="authService.isManager ? 6 : 5" class="empty-state-cell">
                  <div class="loading-state">
                    <span class="spinner"></span>
                    <span>Đang tải danh sách phòng ban...</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add / Edit Modal -->
      <div class="modal-layer" *ngIf="isModalOpen" (click)="closeModal()">
        <div class="modal-window modal-md" (click)="$event.stopPropagation()">
          <div class="modal-top">
            <div>
              <h3 class="modal-heading">{{ isEditing ? 'Cập Nhật Phòng Ban' : 'Thành Lập Phòng Ban Mới' }}</h3>
              <p class="modal-subheading">Khai báo thông tin đơn vị tổ chức trong doanh nghiệp</p>
            </div>
            <button class="modal-x-btn" (click)="closeModal()">✕</button>
          </div>

          <form [formGroup]="deptForm" (ngSubmit)="onSubmit()">
            <div class="modal-scroll-body">
              <div class="form-group mb-3">
                <label for="deptName" class="form-label required">Tên phòng ban</label>
                <input id="deptName" 
                       type="text" 
                       class="form-control" 
                       formControlName="name" 
                       placeholder="VD: Phòng Công Nghệ Thông Tin"
                       [class.is-invalid]="f['name'].touched && f['name'].invalid">
                <div class="invalid-feedback" *ngIf="f['name'].touched && f['name'].invalid">
                  Vui lòng nhập tên phòng ban (từ 2 đến 100 ký tự).
                </div>
              </div>

              <div class="form-group mb-3">
                <label for="deptCode" class="form-label required">Mã ký hiệu đơn vị</label>
                <input id="deptCode" 
                       type="text" 
                       class="form-control text-uppercase" 
                       formControlName="code" 
                       placeholder="VD: IT, HR, FIN"
                       [class.is-invalid]="f['code'].touched && f['code'].invalid">
                <div class="invalid-feedback" *ngIf="f['code'].touched && f['code'].invalid">
                  Chỉ chứa chữ hoa, số hoặc gạch nối (VD: IT, RND).
                </div>
              </div>

              <div class="form-group mb-3">
                <label for="deptLocation" class="form-label">Địa điểm / Văn phòng</label>
                <input id="deptLocation" 
                       type="text" 
                       class="form-control" 
                       formControlName="location" 
                       placeholder="VD: Tầng 5, Tòa nhà Innovation">
              </div>

              <div class="form-group">
                <label for="deptDescription" class="form-label">Mô tả chức năng nhiệm vụ</label>
                <textarea id="deptDescription" 
                          rows="3" 
                          class="form-control" 
                          formControlName="description" 
                          placeholder="Tóm tắt chức năng và vai trò của đơn vị..."></textarea>
              </div>
            </div>

            <div class="modal-bottom">
              <button type="button" class="btn btn-secondary btn-sm" (click)="closeModal()">Hủy</button>
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="deptForm.invalid || isSubmitting">
                {{ isSubmitting ? 'Đang lưu...' : (isEditing ? 'Lưu thay đổi' : 'Tạo phòng ban') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <app-confirm-modal 
        [isOpen]="isDeleteModalOpen"
        [title]="'Xóa đơn vị: ' + (deptToDelete?.name || '')"
        [message]="deptToDelete?.employeeCount ? 'Không thể xóa đơn vị này vì đang có ' + deptToDelete?.employeeCount + ' nhân viên trực thuộc. Cần điều chuyển nhân sự trước.' : 'Bạn có chắc chắn muốn giải thể/xóa đơn vị này khỏi cơ cấu tổ chức?'"
        [confirmText]="'Xác nhận xóa'"
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

    /* Toolbar */
    .toolbar-box {
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02);
    }
    .search-cell {
      position: relative;
      display: flex;
      align-items: center;
      flex: 1;
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
      padding: 6px 12px 6px 32px;
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
    .text-sm { font-size: 0.8rem; }
    .text-muted { color: #64748b; }
    .text-muted strong { color: #0f172a; font-weight: 600; }

    /* Table */
    .data-container {
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.03);
      overflow: hidden;
    }
    .table-scroll { overflow-x: auto; }
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
    }
    .table-row {
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.1s ease;
    }
    .table-row:hover { background: #fafafa; }
    .table-row td {
      padding: 12px 16px;
      vertical-align: middle;
      color: #334155;
    }

    .code-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #0f172a;
      border: 1px solid #e2e8f0;
    }
    .dept-name-cell {
      display: flex;
      flex-direction: column;
    }
    .dept-title {
      font-weight: 500;
      color: #0f172a;
    }
    .dept-date {
      font-size: 0.72rem;
      color: #94a3b8;
    }
    .text-slate { color: #475569; }
    .desc-clamp {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      color: #64748b;
      font-size: 0.8rem;
      max-width: 320px;
    }
    .headcount-pill {
      display: inline-block;
      font-size: 0.76rem;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 4px;
      background: #ecfdf5;
      color: #047857;
    }
    .pill-empty {
      background: #f1f5f9;
      color: #64748b;
    }

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
    .icon-action-btn:hover { background: #f1f5f9; color: #0f172a; }
    .text-danger-hover:hover { background: #fef2f2; color: #dc2626; }

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
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    .modal-md { max-width: 480px; }
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
    }
    .modal-scroll-body { padding: 20px; }
    .mb-3 { margin-bottom: 14px; }
    .modal-bottom {
      padding: 12px 20px;
      background: #fafafa;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .text-uppercase { text-transform: uppercase; }

    /* Empty state */
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
    .empty-title { font-weight: 600; color: #0f172a; font-size: 0.95rem; }
    .empty-desc { color: #64748b; font-size: 0.82rem; }
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
  `]
})
export class DepartmentListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private deptService = inject(DepartmentService);
  private toastService = inject(ToastService);
  authService = inject(AuthService);

  departments: Department[] = [];
  searchTerm = '';
  isLoading = false;
  isSubmitting = false;

  isModalOpen = false;
  isEditing = false;
  editingId: number | null = null;
  deptForm!: FormGroup;

  isDeleteModalOpen = false;
  deptToDelete: Department | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadDepartments();
  }

  get f() {
    return this.deptForm.controls;
  }

  private initForm(): void {
    this.deptForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
      location: ['', [Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  loadDepartments(): void {
    this.isLoading = true;
    this.deptService.getAll(this.searchTerm).subscribe({
      next: res => {
        this.departments = res;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.loadDepartments();
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.deptForm.reset();
    this.isModalOpen = true;
  }

  openEditModal(dept: Department): void {
    this.isEditing = true;
    this.editingId = dept.id;
    this.deptForm.patchValue({
      name: dept.name,
      code: dept.code,
      location: dept.location || '',
      description: dept.description || ''
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.deptForm.reset();
  }

  onSubmit(): void {
    if (this.deptForm.invalid) {
      this.deptForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formVal = this.deptForm.value;
    formVal.code = formVal.code.toUpperCase();

    if (this.isEditing && this.editingId) {
      this.deptService.update(this.editingId, formVal).subscribe({
        next: () => {
          this.toastService.success('Đã cập nhật thông tin phòng ban.');
          this.isSubmitting = false;
          this.closeModal();
          this.loadDepartments();
        },
        error: () => this.isSubmitting = false
      });
    } else {
      this.deptService.create(formVal).subscribe({
        next: () => {
          this.toastService.success('Đã thành lập phòng ban mới.');
          this.isSubmitting = false;
          this.closeModal();
          this.loadDepartments();
        },
        error: () => this.isSubmitting = false
      });
    }
  }

  confirmDelete(dept: Department): void {
    this.deptToDelete = dept;
    this.isDeleteModalOpen = true;
  }

  onConfirmDelete(): void {
    if (!this.deptToDelete) return;
    this.deptService.delete(this.deptToDelete.id).subscribe({
      next: () => {
        this.toastService.success(`Đã xóa phòng ban "${this.deptToDelete?.name}".`);
        this.isDeleteModalOpen = false;
        this.deptToDelete = null;
        this.loadDepartments();
      },
      error: () => {
        this.isDeleteModalOpen = false;
      }
    });
  }
}
