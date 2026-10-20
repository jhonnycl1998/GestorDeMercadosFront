import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const token = authService.getToken();

  let clonedReq = req;
  if (token) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si la URL es la de login, dejamos que el componente de login maneje el error
      const isLoginRequest = req.url.includes('/Usuario/login');

      if (error.status === 401) {
        if (!isLoginRequest) {
          toastService.error('Sesión expirada o no autorizada. Redirigiendo al login...');
          authService.logout();
        }
      } else if (error.status === 403) {
        toastService.error('No tienes permisos para realizar esta acción.', 'Acceso denegado');
      } else if (error.status === 400 && !isLoginRequest) {
        const errorMsg = error.error?.mensaje || error.error?.message || 'Error en la solicitud';
        toastService.warning(errorMsg, 'Validación');
      } else if (error.status === 500) {
        toastService.error('Ocurrió un error interno en el servidor.', 'Error del servidor');
      }

      return throwError(() => error);
    })
  );
};
