import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  if (authService.isAuthenticated) {
    const requiredRoles = route.data?.['roles'] as string[];
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(authService.role)) {
        toastService.error('Bạn không có quyền truy cập vào trang này.', 'Từ chối quyền hạn');
        router.navigate(['/']);
        return false;
      }
    }
    return true;
  }

  toastService.info('Vui lòng đăng nhập để tiếp tục.');
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
