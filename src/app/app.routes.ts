import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/selector/selector.component').then(m => m.SelectorComponent),
  },
  {
    path: 'nombre',
    loadComponent: () =>
      import('./components/nombre-form/nombre-form.component').then(m => m.NombreFormComponent),
  },
  {
    path: 'camara',
    loadComponent: () =>
      import('./components/camara/camara.component').then(m => m.CamaraComponent),
  },
  {
    path: 'resultado',
    loadComponent: () =>
      import('./components/resultado/resultado.component').then(m => m.ResultadoComponent),
  },
  { path: '**', redirectTo: '' },
];
