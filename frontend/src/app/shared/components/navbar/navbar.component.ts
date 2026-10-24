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
        <!-- Left: Workspace identifier -->
        <div class="workspace-group">
          <a routerLink="/" class="workspace-link">
            <div class="workspace-mark">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path><path d="M10 6h4"></path><path d="M10 10h4"></path><path d="M10 14h4"></path><path d="M10 18h4"></path></svg>
            </div>
            <div class="workspace-meta">
              <span class="workspace-name">Tổ Chức Doanh Nghiệp</span>
              <span class="workspace-env">Cổng Quản Trị Nội Bộ</span>
            </div>
          </a>

          <div class="divider-v"></div>

          <!-- Center: Primary Tab Navigation -->
          <nav class="nav-tabs">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-tab">
              Tổng quan
            </a>
            <a routerLink="/employees" routerLinkActive="active" class="nav-tab">
              Nhân sự
            </a>
            <a routerLink="/attendance" routerLinkActive="active" class="nav-tab">
              Chấm công
            </a>
            <a routerLink="/departments" routerLinkActive="active" class="nav-tab">
              Phòng ban
            </a>
          </nav>
        </div>

        <!-- Right: User status & actions -->
        <div class="user-group">
          <ng-container *ngIf="authService.currentUser$ | async as user; else loginBtn">
            <div class="user-pill">
              <div class="user-avatar">
                {{ user.username.charAt(0).toUpperCase() }}
              </div>
              <div class="user-text">
                <span class="user-name">{{ user.username }}</span>
                <span class="role-tag" [ngClass]="'role-' + user.role.toLowerCase()">{{ user.role }}</span>
              </div>
            </div>

            <button class="btn btn-outline-secondary btn-sm" (click)="logout()" title="Đăng xuất khỏi hệ thống">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Đăng xuất
            </button>
          </ng-container>

          <ng-template #loginBtn>
            <a routerLink="/login" class="btn btn-primary btn-sm">
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
      border-bottom: 1px solid var(--border-subtle);
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .nav-container {
      max-width: 1320px;
      margin: 0 auto;
      padding: 0 24px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .workspace-group {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .workspace-link {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: inherit;
    }
    .workspace-mark {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-md);
      background: #0f172a;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .workspace-meta {
      display: flex;
      flex-direction: column;
    }
    .workspace-name {
      font-size: 0.88rem;
      font-weight: 600;
      color: #0f172a;
      line-height: 1.15;
    }
    .workspace-env {
      font-size: 0.7rem;
      color: #64748b;
      font-weight: 450;
    }
    .divider-v {
      width: 1px;
      height: 24px;
      background: #e2e8f0;
    }
    .nav-tabs {
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .nav-tab {
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      color: #475569;
      text-decoration: none;
      font-size: 0.84rem;
      font-weight: 500;
      transition: all 0.1s ease;
    }
    .nav-tab:hover {
      color: #0f172a;
      background: #f1f5f9;
    }
    .nav-tab.active {
      color: #0f172a;
      font-weight: 600;
      background: #f1f5f9;
    }
    .user-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .user-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 3px 8px 3px 4px;
      border: 1px solid #e2e8f0;
      border-radius: 9999px;
      background: #ffffff;
    }
    .user-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #334155;
      color: #ffffff;
      font-weight: 600;
      font-size: 0.72rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-text {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .user-name {
      font-size: 0.8rem;
      font-weight: 500;
      color: #1e293b;
    }
    .role-tag {
      font-size: 0.65rem;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .role-admin { background: #fef2f2; color: #b91c1c; }
    .role-manager { background: #fffbeb; color: #b45309; }
    .role-employee { background: #f0fdf4; color: #15803d; }
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
