import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const codigo = sessionStorage.getItem('codigo_acceso');

  if (codigo === '137946') {
    return true;
  }

  router.navigate(['/acceso']);
  return false;
};
