import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'Admin' },
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'mapa-puestos',
        loadComponent: () => import('./features/admin/mapa-puestos/mapa-puestos.component').then(m => m.MapaPuestosComponent)
      },
      {
        path: 'duenos',
        loadComponent: () => import('./features/admin/duenos/duenos.component').then(m => m.DuenosComponent)
      },
      {
        path: 'servicios',
        loadComponent: () => import('./features/admin/servicios/servicios.component').then(m => m.ServiciosComponent)
      },
      {
        path: 'deudas',
        loadComponent: () => import('./features/admin/deudas/deudas.component').then(m => m.DeudasComponent)
      },
      {
        path: 'pagos',
        loadComponent: () => import('./features/admin/pagos/pagos.component').then(m => m.PagosComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./features/admin/usuarios/usuarios.component').then(m => m.UsuariosComponent)
      }
    ]
  },
  {
    path: 'user',
    loadComponent: () => import('./features/user/user-layout/user-layout.component').then(m => m.UserLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'User' },
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'inicio'
      },
      {
        path: 'inicio',
        loadComponent: () => import('./features/user/inicio/inicio.component').then(m => m.UserInicioComponent)
      },
      {
        path: 'mis-deudas',
        loadComponent: () => import('./features/user/mis-deudas/mis-deudas.component').then(m => m.UserMisDeudasComponent)
      },
      {
        path: 'mis-pagos',
        loadComponent: () => import('./features/user/mis-pagos/mis-pagos.component').then(m => m.UserMisPagosComponent)
      },
      {
        path: 'cambiar-contrasena',
        loadComponent: () => import('./features/user/cambiar-contrasena/cambiar-contrasena.component').then(m => m.UserCambiarContrasenaComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
