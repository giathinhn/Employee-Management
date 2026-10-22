import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="app-navbar">
      <div class="nav-container">
        <div class="nav-brand-group">
          <a routerLink="/" class="nav-brand">
            <div class="brand-logo">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div class="brand-text">
              <span class="brand-title">HR Master</span>
              <span class="brand-subtitle">Employee & Dept Management</span>
            </div>
          </a>

          <nav class="nav-links">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              Tổng quan
            </a>
            <a routerLink="/employees" routerLinkActive="active" class="nav-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Nhân viên
            </a>
            <a routerLink="/departments" routerLinkActive="active" class="nav-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
              Phòng ban
            </a>
          </nav>
        </div>

        <div class="nav-user-group">
          <ng-container *ngIf="authService.currentUser$ | async as user; else loginBtn">
            <div class="user-pill">
              <div class="avatar-circle">
                {{ user.username.charAt(0).toUpperCase() }}
              </div>
              <div class="user-meta">
                <span class="user-name">{{ user.username }}</span>
                <span class="role-badge" [ngClass]="'role-' + user.role.toLowerCase()">{{ user.role }}</span>
              </div>
            </div>
            <button class="btn btn-outline-danger btn-sm" (click)="logout()" title="Đăng xuất">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Đăng xuất
            </button>
          </ng-container>

          <ng-template #loginBtn>
            <a routerLink="/login" class="btn btn-primary btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
              Đăng nhập
            </a>
          </ng-template>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .app-navbar {
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    }
    .nav-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 24px;
      height: 68px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .nav-brand-group {
      display: flex;
      align-items: center;
      gap: 36px;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: inherit;
    }
    .brand-logo {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    }
    .brand-text {
      display: flex;
      flex-direction: column;
    }
    .brand-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #111827;
      line-height: 1.2;
      letter-spacing: -0.01em;
    }
    .brand-subtitle {
      font-size: 0.72rem;
      color: #6b7280;
      font-weight: 500;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .nav-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 8px;
      color: #4b5563;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.15s ease;
    }
    .nav-link:hover {
      background: #f3f4f6;
      color: #111827;
    }
    .nav-link.active {
      background: #eff6ff;
      color: #2563eb;
      font-weight: 600;
    }
    .nav-user-group {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .user-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 12px 4px 6px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 20px;
    }
    .avatar-circle {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #3b82f6;
      color: white;
      font-weight: 600;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-meta {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-size: 0.82rem;
      font-weight: 600;
      color: #1f2937;
      line-height: 1.1;
    }
    .role-badge {
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .role-admin { color: #dc2626; }
    .role-manager { color: #d97706; }
    .role-employee { color: #059669; }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
