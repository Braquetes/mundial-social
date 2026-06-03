import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FotoIaService } from '../../services/foto-ia.service';

@Component({
  selector: 'app-nombre-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './nombre-form.component.html',
  styleUrls: ['./nombre-form.component.scss'],
})
export class NombreFormComponent {
  protected nombre = '';
  protected error = '';

  private router = inject(Router);
  private svc = inject(FotoIaService);

  get nombreValido(): boolean {
    return this.nombre.trim().length > 0 && this.nombre.trim().length <= 20;
  }

  get caractereRestantes(): number {
    return 20 - this.nombre.length;
  }

  async continuar(): Promise<void> {
    if (!this.nombreValido) {
      this.error = 'Ingresa tu nombre (máximo 20 caracteres)';
      return;
    }
    this.error = '';
    const nombre = this.nombre.trim();
    this.svc.setNombre(nombre);

    try {
      this.svc.cargando.set(true);
      await this.svc.crearRegistro(nombre);
    } catch (e: any) {
      this.error = e.message ?? 'Error al crear registro';
      return;
    } finally {
      this.svc.cargando.set(false);
    }

    this.router.navigate(['/camara']);
  }

  volver(): void {
    this.router.navigate(['/']);
  }
}
