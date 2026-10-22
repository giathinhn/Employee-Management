import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
          </div>
          <h2 class="auth-title">Đăng Ký Tài Khoản</h2>
          <p class="auth-subtitle">Tạo tài khoản người dùng quản trị hệ thống</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="username" class="form-label required">Tên đăng nhập</label>
            <input id="username" 
                   type="text" 
                   class="form-control" 
                   formControlName="username" 
                   placeholder="VD: minh.nguyen"
                   [class.is-invalid]="f['username'].touched && f['username'].invalid">
            <div class="invalid-feedback" *ngIf="f['username'].touched && f['username'].invalid">
              <span *ngIf="f['username'].errors?.['required']">Tên đăng nhập là bắt buộc.</span>
              <span *ngIf="f['username'].errors?.['minlength']">Tối thiểu 3 ký tự.</span>
            </div>
          </div>

          <div class="form-group">
            <label for="email" class="form-label required">Địa chỉ Email</label>
            <input id="email" 
                   type="email" 
                   class="form-control" 
                   formControlName="email" 
                   placeholder="VD: minh@company.com"
                   [class.is-invalid]="f['email'].touched && f['email'].invalid">
            <div class="invalid-feedback" *ngIf="f['email'].touched && f['email'].invalid">
              <span *ngIf="f['email'].errors?.['required']">Email là bắt buộc.</span>
              <span *ngIf="f['email'].errors?.['email']">Email không đúng định dạng.</span>
            </div>
          </div>

          <div class="form-group">
            <label for="password" class="form-label required">Mật khẩu</label>
            <input id="password" 
                   type="password" 
                   class="form-control" 
                   formControlName="password" 
                   placeholder="Tối thiểu 6 ký tự"
                   [class.is-invalid]="f['password'].touched && f['password'].invalid">
            <div class="invalid-feedback" *ngIf="f['password'].touched && f['password'].invalid">
              <span *ngIf="f['password'].errors?.['required']">Mật khẩu là bắt buộc.</span>
              <span *ngIf="f['password'].errors?.['minlength']">Mật khẩu tối thiểu 6 ký tự.</span>
            </div>
          </div>

          <div class="form-group">
            <label for="role" class="form-label required">Vai trò quyền hạn</label>
            <select id="role" class="form-control" formControlName="role">
              <option value="Employee">Employee (Xem và tra cứu)</option>
              <option value="Manager">Manager (Thêm & sửa nhân viên/phòng ban)</option>
              <option value="Admin">Admin (Toàn quyền quản trị hệ thống)</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary w-100 btn-submit" [disabled]="registerForm.invalid || isSubmitting">
            {{ isSubmitting ? 'Đang khởi tạo tài khoản...' : 'Đăng Ký Tài Khoản' }}
          </button>
        </form>

        <div class="auth-footer">
          Đã có tài khoản? <a routerLink="/login">Quay lại đăng nhập</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: calc(100vh - 140px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
    }
    .auth-card {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      width: 100%;
      max-width: 440px;
      padding: 32px;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 24px;
    }
    .auth-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: #eff6ff;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }
    .auth-title {
      font-size: 1.45rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 6px 0;
    }
    .auth-subtitle {
      font-size: 0.85rem;
      color: #6b7280;
      margin: 0;
    }
    .btn-submit {
      margin-top: 14px;
      padding: 12px;
      font-size: 0.95rem;
      font-weight: 600;
    }
    .auth-footer {
      margin-top: 24px;
      text-align: center;
      font-size: 0.85rem;
      color: #6b7280;
    }
    .auth-footer a {
      color: #2563eb;
      font-weight: 600;
      text-decoration: none;
    }
    .auth-footer a:hover {
      text-decoration: underline;
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  isSubmitting = false;

  registerForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['Employee', [Validators.required]]
  });

  get f() {
    return this.registerForm.controls;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.authService.register(this.registerForm.value).subscribe({
      next: res => {
        this.toastService.success(`Đăng ký thành công! Đã đăng nhập với tư cách ${res.username} (${res.role}).`);
        this.isSubmitting = false;
        this.router.navigate(['/']);
      },
      error: () => this.isSubmitting = false
    });
  }
}
