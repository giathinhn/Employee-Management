import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  title?: string;
  message: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  show(type: 'success' | 'danger' | 'warning' | 'info', message: string, title?: string, durationMs = 4500): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = {
      id,
      type,
      title: title || (type === 'success' ? 'Thành công' : type === 'danger' ? 'Lỗi' : 'Thông báo'),
      message,
      timestamp: new Date()
    };

    const current = this.toastsSubject.value;
    this.toastsSubject.next([...current, newToast]);

    if (durationMs > 0) {
      setTimeout(() => this.remove(id), durationMs);
    }
  }

  success(message: string, title = 'Thành công'): void {
    this.show('success', message, title);
  }

  error(message: string, title = 'Lỗi'): void {
    this.show('danger', message, title, 6000);
  }

  warning(message: string, title = 'Cảnh báo'): void {
    this.show('warning', message, title);
  }

  info(message: string, title = 'Thông tin'): void {
    this.show('info', message, title);
  }

  remove(id: string): void {
    const current = this.toastsSubject.value;
    this.toastsSubject.next(current.filter(t => t.id !== id));
  }
}
