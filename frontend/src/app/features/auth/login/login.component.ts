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
          <div class="auth-brand-mark">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path><path d="M10 6h4"></path><path d="M10 10h4"></path><path d="M10 14h4"></path><path d="M10 18h4"></path></svg>
          </div>
          <h2 class="auth-title">Đăng Nhập Cổng Nội Bộ</h2>
          <p class="auth-subtitle">Nhập tài khoản định danh để truy cập hệ thống quản trị</p>
        </div>

        <!-- Sleek Quick Access Pills -->
        <div class="quick-access-box">
          <span class="quick-access-title">Tài khoản kiểm thử nhanh:</span>
          <div class="quick-pills">
            <button type="button" class="access-pill" (click)="fillDemo('admin', 'Admin@123')">
              <span class="pill-dot dot-admin"></span> Admin
            </button>
            <button type="button" class="access-pill" (click)="fillDemo('manager', 'Manager@123')">
              <span class="pill-dot dot-manager"></span> Manager
            </button>
            <button type="button" class="access-pill" (click)="fillDemo('employee', 'Employee@123')">
              <span class="pill-dot dot-employee"></span> Employee
            </button>
          </div>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group mb-3">
            <label for="username" class="form-label required">Tên đăng nhập</label>
            <input id="username" 
                   type="text" 
                   class="form-control" 
                   formControlName="username" 
                   placeholder="Tên tài khoản hoặc email"
                   [class.is-invalid]="f['username'].touched && f['username'].invalid">
            <div class="invalid-feedback" *ngIf="f['username'].touched && f['username'].invalid">
              Vui lòng nhập tên đăng nhập.
            </div>
          </div>

          <div class="form-group mb-4">
            <div class="label-row">
              <label for="password" class="form-label required">Mật khẩu</label>
            </div>
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

          <button type="submit" class="btn btn-primary w-100" [disabled]="loginForm.invalid || isSubmitting">
            {{ isSubmitting ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống' }}
          </button>
        </form>

        <div class="auth-footer">
          Chưa có tài khoản? <a routerLink="/register">Đăng ký tài khoản</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: calc(100vh - 120px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
    }
    .auth-card {
      background: #ffffff;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-subtle);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      width: 100%;
      max-width: 400px;
      padding: 32px 28px;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 24px;
    }
    .auth-brand-mark {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: #0f172a;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 14px;
    }
    .auth-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin: 0 0 4px 0;
    }
    .auth-subtitle {
      font-size: 0.8rem;
      color: #64748b;
      margin: 0;
    }
    .quick-access-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      margin-bottom: 20px;
    }
    .quick-access-title {
      display: block;
      font-size: 0.72rem;
      font-weight: 500;
      color: #64748b;
      margin-bottom: 6px;
    }
    .quick-pills {
      display: flex;
      gap: 6px;
    }
    .access-pill {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 5px 8px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      color: #334155;
      cursor: pointer;
      transition: all 0.12s ease;
    }
    .access-pill:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
      color: #0f172a;
    }
    .pill-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
    }
    .dot-admin { background: #ef4444; }
    .dot-manager { background: #f59e0b; }
    .dot-employee { background: #10b981; }

    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .mb-3 { margin-bottom: 14px; }
    .mb-4 { margin-bottom: 18px; }

    .auth-footer {
      margin-top: 24px;
      text-align: center;
      font-size: 0.8rem;
      color: #64748b;
      border-top: 1px solid #f1f5f9;
      padding-top: 16px;
    }
    .auth-footer a {
      color: #0f172a;
      font-weight: 600;
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
        this.toastService.success(`Chào mừng trở lại, ${res.username} (${res.role}).`);
        this.isSubmitting = false;
        this.router.navigate(['/']);
      },
      error: () => this.isSubmitting = false
    });
  }
}
