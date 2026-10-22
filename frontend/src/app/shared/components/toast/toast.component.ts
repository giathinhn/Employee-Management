import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toasts$ | async" 
           class="toast-item" 
           [ngClass]="'toast-' + toast.type"
           role="alert">
        <div class="toast-icon">
          <svg *ngIf="toast.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <svg *ngIf="toast.type === 'danger'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          <svg *ngIf="toast.type === 'warning'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <svg *ngIf="toast.type === 'info'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        </div>
        <div class="toast-body">
          <strong *ngIf="toast.title" class="toast-title">{{ toast.title }}</strong>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <button type="button" class="toast-close" (click)="remove(toast.id)" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 420px;
      width: calc(100% - 40px);
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 10px;
      background: #ffffff;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
      border-left: 5px solid;
      animation: slideIn 0.25s ease-out;
      font-size: 0.9rem;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .toast-success { border-color: #10b981; color: #065f46; }
    .toast-success .toast-icon { color: #10b981; }
    .toast-danger { border-color: #ef4444; color: #991b1b; }
    .toast-danger .toast-icon { color: #ef4444; }
    .toast-warning { border-color: #f59e0b; color: #92400e; }
    .toast-warning .toast-icon { color: #f59e0b; }
    .toast-info { border-color: #3b82f6; color: #1e40af; }
    .toast-info .toast-icon { color: #3b82f6; }

    .toast-icon {
      flex-shrink: 0;
      margin-top: 2px;
    }
    .toast-body {
      flex-grow: 1;
    }
    .toast-title {
      display: block;
      font-weight: 600;
      margin-bottom: 2px;
      font-size: 0.92rem;
    }
    .toast-message {
      color: #374151;
      line-height: 1.4;
      word-break: break-word;
    }
    .toast-close {
      flex-shrink: 0;
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      padding: 2px;
      border-radius: 4px;
      transition: color 0.15s;
    }
    .toast-close:hover {
      color: #374151;
    }
  `]
})
export class ToastComponent {
  private toastService = inject(ToastService);
  toasts$ = this.toastService.toasts$;

  remove(id: string): void {
    this.toastService.remove(id);
  }
}
