import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastComponent],
  template: `
    <div class="app-layout">
      <app-navbar></app-navbar>
      <main class="app-main">
        <router-outlet></router-outlet>
      </main>
      <footer class="app-footer">
        <div class="footer-container">
          <span>&copy; 2026 Employee Management System — Fullstack Angular + ASP.NET Core 8 + PostgreSQL</span>
        </div>
      </footer>
      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .app-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
    }
    .app-main {
      flex: 1;
    }
    .app-footer {
      background: #ffffff;
      border-top: 1px solid #e5e7eb;
      padding: 20px 24px;
      font-size: 0.85rem;
      color: #6b7280;
      text-align: center;
    }
    .footer-container {
      max-width: 1280px;
      margin: 0 auto;
    }
  `]
})
export class AppComponent {
  title = 'Employee Management';
}
