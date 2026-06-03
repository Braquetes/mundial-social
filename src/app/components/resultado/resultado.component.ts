import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FotoIaService } from '../../services/foto-ia.service';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-resultado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resultado.component.html',
  styleUrls: ['./resultado.component.scss'],
})
export class ResultadoComponent implements OnInit {
  @ViewChild('cardRef') cardRef!: ElementRef<HTMLDivElement>;

  protected imagenUrl = signal<string>('');
  protected esPanini = signal<boolean>(false);
  protected nombre = signal<string>('');
  protected descargando = signal<boolean>(false);

  private router = inject(Router);
  protected svc = inject(FotoIaService);

  ngOnInit(): void {
    const estado = this.svc.estado();
    if (!estado.resultadoB64) {
      this.router.navigate(['/']);
      return;
    }
    this.imagenUrl.set(estado.resultadoB64);
    this.esPanini.set(estado.opcionValue === 'panini');
    this.nombre.set(estado.nombre);
  }

  async descargar(): Promise<void> {
    this.descargando.set(true);
    try {
      if (this.esPanini()) {
        // Captura toda la card con html2canvas
        const canvas = await html2canvas(this.cardRef.nativeElement, {
          scale: 3,
          useCORS: true,
        });
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `tarjeta_${this.nombre().replace(/\s+/g, '_') || 'panini'}.png`;
        link.click();
      } else {
        // Descarga directa de la imagen
        const link = document.createElement('a');
        link.href = this.imagenUrl();
        link.download = 'foto_ia.png';
        link.click();
      }
    } finally {
      this.descargando.set(false);
    }
  }

  nueva(): void {
    this.router.navigate(['/']);
  }
}
