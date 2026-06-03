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
  @ViewChild('fotoRef') fotoRef!: ElementRef<HTMLDivElement>;  // ← agrega esto

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

  async imprimir(): Promise<void> {
    const esPanini = this.esPanini();
    const target = esPanini
      ? this.cardRef?.nativeElement
      : this.fotoRef?.nativeElement;

    if (!target) {
      alert('No se encontró el elemento a imprimir');
      return;
    }

    // Forzar un pequeño delay para asegurar renderizado
    await this.esperar(200);

    try {
      // Opciones específicas para Panini
      const options: any = {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        // Esto ayuda con elementos superpuestos
        windowWidth: target.scrollWidth,
        windowHeight: target.scrollHeight
      };

      // Si es Panini, opciones adicionales
      if (esPanini) {
        options.onclone = (clonedDoc: Document, element: HTMLElement) => {
          // Asegurar que los elementos clonados tengan los estilos correctos
          const clonedCard = clonedDoc.querySelector('.card-container');
          if (clonedCard) {
            (clonedCard as HTMLElement).style.overflow = 'visible';
          }
        };
      }

      const canvas = await html2canvas(target, options);
      const imgData = canvas.toDataURL('image/png');

      const win = window.open('', '_blank');
      if (!win) return;

      const titulo = esPanini ? 'Tarjeta Panini' : 'Foto';

      win.document.write(`
        <html>
          <head>
            <title>Imprimir ${titulo}</title>
            <style>
              body {
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: white;
              }
              img {
                max-width: 100%;
                max-height: 100vh;
                object-fit: contain;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
              }
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                }
                img {
                  max-width: 100%;
                  max-height: 100%;
                }
              }
            </style>
          </head>
          <body>
            <img src="${imgData}" onload="window.print();window.close();" onerror="alert('Error al cargar la imagen');" />
          </body>
        </html>
      `);
      win.document.close();

    } catch (error: any) {
      alert(`Error al generar la imagen: ${error.message}`);
      console.error(error);
    }
  }

  private esperar(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
