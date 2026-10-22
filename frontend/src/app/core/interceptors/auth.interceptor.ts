import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const router = inject(Router);

  let clonedReq = req;
  const token = authService.token;

  if (token) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';

      if (error.error) {
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error.detail) {
          errorMessage = error.error.detail;
        } else if (error.error.message) {
          errorMessage = error.error.message;
        } else if (error.error.errors) {
          // Flatten dictionary of validation errors
          const validationList: string[] = [];
          for (const key of Object.keys(error.error.errors)) {
            const msgs = error.error.errors[key];
            if (Array.isArray(msgs)) {
              validationList.push(...msgs);
            } else if (typeof msgs === 'string') {
              validationList.push(msgs);
            }
          }
          if (validationList.length > 0) {
            errorMessage = validationList.join(' | ');
          }
        }
      }

      if (error.status === 401) {
        authService.logout();
        toastService.warning('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'Yêu cầu đăng nhập');
        router.navigate(['/login']);
      } else if (error.status === 403) {
        toastService.error('Bạn không có quyền thực hiện hành động này.', 'Truy cập bị từ chối');
      } else if (error.status === 404) {
        toastService.error(errorMessage, 'Không tìm thấy');
      } else if (error.status === 409) {
        toastService.warning(errorMessage, 'Xung đột dữ liệu');
      } else if (error.status === 400) {
        toastService.error(errorMessage, 'Lỗi dữ liệu');
      } else if (error.status === 0) {
        toastService.error('Không thể kết nối đến máy chủ backend (ASP.NET Core API). Hãy đảm bảo API đang chạy.', 'Lỗi kết nối');
      } else {
        toastService.error(errorMessage, `Lỗi máy chủ (${error.status})`);
      }

      return throwError(() => error);
    })
  );
};
