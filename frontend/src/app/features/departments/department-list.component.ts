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
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Quản lý Phòng Ban</h1>
          <p class="page-subtitle">Danh mục cơ cấu phòng ban và phân bổ nguồn nhân lực</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="openCreateModal()" *ngIf="authService.isManager">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Thêm Phòng Ban
          </button>
        </div>
      </div>

      <!-- Search Toolbar -->
      <div class="toolbar-card">
        <div class="search-input-wrap">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" 
                 class="search-input" 
                 placeholder="Tìm theo tên phòng ban, mã số, hoặc vị trí..."
                 [value]="searchTerm"
                 (input)="onSearchInput($event)">
        </div>
      </div>

      <!-- Department Table / Cards -->
      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 100px;">Mã</th>
                <th>Tên phòng ban</th>
                <th>Vị trí</th>
                <th>Mô tả</th>
                <th style="width: 140px; text-align: center;">Số nhân sự</th>
                <th style="width: 140px; text-align: right;" *ngIf="authService.isManager">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let dept of departments">
                <td>
                  <span class="badge-code">{{ dept.code }}</span>
                </td>
                <td>
                  <div class="dept-title-cell">
                    <strong>{{ dept.name }}</strong>
                    <span class="date-meta">Khởi tạo: {{ dept.createdAt | date:'dd/MM/yyyy' }}</span>
                  </div>
                </td>
                <td>
                  <span class="text-muted">{{ dept.location || '—' }}</span>
                </td>
                <td>
                  <span class="text-description" [title]="dept.description">{{ dept.description || 'Chưa có mô tả' }}</span>
                </td>
                <td style="text-align: center;">
                  <span class="badge-count" [class.badge-empty]="dept.employeeCount === 0">
                    {{ dept.employeeCount }} nhân viên
                  </span>
                </td>
                <td style="text-align: right;" *ngIf="authService.isManager">
                  <div class="table-actions">
                    <button class="btn-icon text-primary" (click)="openEditModal(dept)" title="Chỉnh sửa">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-icon text-danger" 
                            *ngIf="authService.isAdmin" 
                            (click)="confirmDelete(dept)" 
                            title="Xóa phòng ban">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="departments.length === 0 && !isLoading">
                <td [attr.colspan]="authService.isManager ? 6 : 5" class="empty-cell">
                  Không tìm thấy phòng ban nào phù hợp.
                </td>
              </tr>
              <tr *ngIf="isLoading">
                <td [attr.colspan]="authService.isManager ? 6 : 5" class="empty-cell">
                  Đang tải danh sách phòng ban...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add / Edit Department Modal -->
      <div class="modal-backdrop" *ngIf="isModalOpen" (click)="closeModal()">
        <div class="modal-card modal-md" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ isEditing ? 'Cập nhật Phòng Ban' : 'Thêm Phòng Ban Mới' }}</h3>
            <button class="modal-close-btn" (click)="closeModal()">×</button>
          </div>

          <form [formGroup]="deptForm" (ngSubmit)="onSubmit()">
            <div class="modal-body">
              <div class="form-group">
                <label for="deptName" class="form-label required">Tên phòng ban</label>
                <input id="deptName" 
                       type="text" 
                       class="form-control" 
                       formControlName="name" 
                       placeholder="VD: Phòng Công Nghệ Thông Tin"
                       [class.is-invalid]="f['name'].touched && f['name'].invalid">
                <div class="invalid-feedback" *ngIf="f['name'].touched && f['name'].invalid">
                  <span *ngIf="f['name'].errors?.['required']">Tên phòng ban là bắt buộc.</span>
                  <span *ngIf="f['name'].errors?.['minlength']">Tên phải từ 2 ký tự trở lên.</span>
                </div>
              </div>

              <div class="form-group">
                <label for="deptCode" class="form-label required">Mã phòng ban</label>
                <input id="deptCode" 
                       type="text" 
                       class="form-control text-uppercase" 
                       formControlName="code" 
                       placeholder="VD: IT, HR, FIN"
                       [class.is-invalid]="f['code'].touched && f['code'].invalid">
                <div class="invalid-feedback" *ngIf="f['code'].touched && f['code'].invalid">
                  <span *ngIf="f['code'].errors?.['required']">Mã phòng ban là bắt buộc.</span>
                  <span *ngIf="f['code'].errors?.['pattern']">Chỉ chứa chữ hoa, số hoặc dấu gạch nối (VD: IT, MKT-01).</span>
                </div>
              </div>

              <div class="form-group">
                <label for="deptLocation" class="form-label">Vị trí / Tòa nhà</label>
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
                          placeholder="Mô tả tóm tắt vai trò của phòng ban trong doanh nghiệp..."></textarea>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Hủy</button>
              <button type="submit" class="btn btn-primary" [disabled]="deptForm.invalid || isSubmitting">
                {{ isSubmitting ? 'Đang lưu...' : (isEditing ? 'Lưu thay đổi' : 'Tạo mới') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <app-confirm-modal 
        [isOpen]="isDeleteModalOpen"
        [title]="'Xóa phòng ban: ' + (deptToDelete?.name || '')"
        [message]="deptToDelete?.employeeCount ? 'Không thể xóa vì phòng ban có ' + deptToDelete?.employeeCount + ' nhân viên. Bạn cần điều chuyển họ trước.' : 'Bạn có chắc chắn muốn xóa vĩnh viễn phòng ban này?'"
        [confirmText]="'Xóa phòng ban'"
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
    .toolbar-card {
      background: #ffffff;
      padding: 16px 20px;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .search-input-wrap {
      position: relative;
      max-width: 480px;
    }
    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
    }
    .search-input {
      width: 100%;
      padding: 10px 16px 10px 42px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.9rem;
      background: #f9fafb;
      transition: all 0.2s;
    }
    .search-input:focus {
      outline: none;
      border-color: #3b82f6;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
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
      padding: 14px 20px;
      font-weight: 600;
      color: #4b5563;
      border-bottom: 1px solid #e5e7eb;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .data-table td {
      padding: 16px 20px;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: middle;
      color: #374151;
    }
    .data-table tr:hover {
      background: #f9fafb;
    }
    .badge-code {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      background: #eff6ff;
      color: #1d4ed8;
      font-weight: 700;
      font-size: 0.8rem;
    }
    .dept-title-cell {
      display: flex;
      flex-direction: column;
    }
    .date-meta {
      font-size: 0.75rem;
      color: #9ca3af;
      margin-top: 2px;
    }
    .text-description {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      color: #6b7280;
      max-width: 320px;
    }
    .badge-count {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      background: #ecfdf5;
      color: #065f46;
      font-weight: 600;
      font-size: 0.82rem;
    }
    .badge-empty {
      background: #f3f4f6;
      color: #6b7280;
      font-weight: 500;
    }
    .table-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
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
    .btn-icon:hover {
      background: #f3f4f6;
    }
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
    }
    .modal-card {
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 540px;
      overflow: hidden;
    }
    .modal-header {
      padding: 20px 24px;
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
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    .text-uppercase {
      text-transform: uppercase;
    }
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

  // Modal State
  isModalOpen = false;
  isEditing = false;
  editingId: number | null = null;
  deptForm!: FormGroup;

  // Delete State
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
          this.toastService.success('Đã cập nhật thông tin phòng ban thành công.');
          this.isSubmitting = false;
          this.closeModal();
          this.loadDepartments();
        },
        error: () => this.isSubmitting = false
      });
    } else {
      this.deptService.create(formVal).subscribe({
        next: () => {
          this.toastService.success('Đã thêm phòng ban mới thành công.');
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
        this.toastService.success(`Đã xóa phòng ban "${this.deptToDelete?.name}"`);
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
