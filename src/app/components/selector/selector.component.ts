import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OPCIONES, Opcion } from '../../models/opcion.model';
import { FotoIaService } from '../../services/foto-ia.service';

@Component({
  selector: 'app-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './selector.component.html',
  styleUrls: ['./selector.component.scss'],
})
export class SelectorComponent {
  protected opciones: Opcion[] = OPCIONES;
  private router = inject(Router);
  private svc = inject(FotoIaService);

  seleccionar(opcion: Opcion): void {
    this.svc.setOpcion(opcion.id, opcion.value);

    if (opcion.id === 1) {
      this.router.navigate(['/nombre']);
    } else {
      this.router.navigate(['/camara']);
    }
  }
}
