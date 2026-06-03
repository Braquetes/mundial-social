import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-acceso',
  imports: [FormsModule, CommonModule],
  templateUrl: './acceso.html',
  styleUrl: './acceso.scss',
})
export class Acceso {
  protected codigo = '';
  protected error = signal<boolean>(false);

  constructor(private router: Router) {
    // Si ya tiene acceso, redirige directo
    if (sessionStorage.getItem('codigo_acceso') === '137946') {
      this.router.navigate(['/']);
    }
  }

  verificar(): void {
    if (this.codigo === '137946') {
      sessionStorage.setItem('codigo_acceso', this.codigo);
      this.router.navigate(['/']);
    } else {
      this.error.set(true);
      this.codigo = '';
      setTimeout(() => this.error.set(false), 2000);
    }
  }
}
