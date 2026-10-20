import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { UserRole } from '../models';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const expectedRole = route.data?.['role'] as UserRole;
  const currentRole = authService.getRole();

  if (!expectedRole || currentRole === expectedRole) {
    return true;
  }

  toastService.warning('No tienes permisos para acceder a esta sección.');
  
  // Redirigir según el rol que tenga
  if (currentRole === 'Admin') {
    router.navigate(['/admin/dashboard']);
  } else if (currentRole === 'User') {
    router.navigate(['/user/inicio']);
  } else {
    router.navigate(['/login']);
  }

  return false;
};
