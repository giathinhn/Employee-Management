import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <h2 class="auth-title">Đăng Nhập Hệ Thống</h2>
          <p class="auth-subtitle">Hệ thống Quản lý Nhân sự & Cơ cấu Phòng ban</p>
        </div>

        <!-- Quick Demo Account Fill -->
        <div class="demo-box">
          <span class="demo-title">Tài khoản dùng thử (1-click điền):</span>
          <div class="demo-buttons">
            <button type="button" class="btn-demo demo-admin" (click)="fillDemo('admin', 'Admin@123')">
              Admin
            </button>
            <button type="button" class="btn-demo demo-manager" (click)="fillDemo('manager', 'Manager@123')">
              Manager
            </button>
            <button type="button" class="btn-demo demo-employee" (click)="fillDemo('employee', 'Employee@123')">
              Employee
            </button>
          </div>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="username" class="form-label required">Tên đăng nhập</label>
            <input id="username" 
                   type="text" 
                   class="form-control" 
                   formControlName="username" 
                   placeholder="Nhập tên đăng nhập"
                   [class.is-invalid]="f['username'].touched && f['username'].invalid">
            <div class="invalid-feedback" *ngIf="f['username'].touched && f['username'].invalid">
              Vui lòng nhập tên đăng nhập.
            </div>
          </div>

          <div class="form-group">
            <label for="password" class="form-label required">Mật khẩu</label>
            <input id="password" 
                   type="password" 
                   class="form-control" 
                   formControlName="password" 
                   placeholder="Nhập mật khẩu"
                   [class.is-invalid]="f['password'].touched && f['password'].invalid">
            <div class="invalid-feedback" *ngIf="f['password'].touched && f['password'].invalid">
              Vui lòng nhập mật khẩu.
            </div>
          </div>

          <button type="submit" class="btn btn-primary w-100 btn-submit" [disabled]="loginForm.invalid || isSubmitting">
            {{ isSubmitting ? 'Đang xác thực...' : 'Đăng Nhập' }}
          </button>
        </form>

        <div class="auth-footer">
          Chưa có tài khoản? <a routerLink="/register">Đăng ký tài khoản mới</a>
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
    .demo-box {
      background: #f9fafb;
      border: 1px dashed #d1d5db;
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 20px;
      text-align: center;
    }
    .demo-title {
      display: block;
      font-size: 0.78rem;
      font-weight: 600;
      color: #4b5563;
      margin-bottom: 8px;
    }
    .demo-buttons {
      display: flex;
      justify-content: center;
      gap: 8px;
    }
    .btn-demo {
      border: 1px solid;
      background: #ffffff;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .demo-admin { border-color: #fca5a5; color: #dc2626; }
    .demo-admin:hover { background: #fee2e2; }
    .demo-manager { border-color: #fde68a; color: #d97706; }
    .demo-manager:hover { background: #fef3c7; }
    .demo-employee { border-color: #a7f3d0; color: #059669; }
    .demo-employee:hover { background: #d1fae5; }

    .btn-submit {
      margin-top: 10px;
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
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  isSubmitting = false;

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  get f() {
    return this.loginForm.controls;
  }

  fillDemo(u: string, p: string): void {
    this.loginForm.patchValue({
      username: u,
      password: p
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: res => {
        this.toastService.success(`Chào mừng trở lại, ${res.username}! (Quyền: ${res.role})`);
        this.isSubmitting = false;
        this.router.navigate(['/']);
      },
      error: () => this.isSubmitting = false
    });
  }
}
