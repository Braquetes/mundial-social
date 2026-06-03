import { Routes } from '@angular/router';
import { authGuard } from './guard/auth.guard';

export const routes: Routes = [
  {
    path: 'acceso',
    loadComponent: () =>
      import('./acceso/acceso').then(m => m.Acceso),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/selector/selector.component').then(m => m.SelectorComponent),
  },
  {
    path: 'nombre',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/nombre-form/nombre-form.component').then(m => m.NombreFormComponent),
  },
  {
    path: 'camara',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/camara/camara.component').then(m => m.CamaraComponent),
  },
  {
    path: 'resultado',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/resultado/resultado.component').then(m => m.ResultadoComponent),
  },
  { path: '**', redirectTo: 'acceso' },
];
