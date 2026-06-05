import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FotoIaService } from '../../services/foto-ia.service';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

@Component({
  selector: 'app-resultado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resultado.component.html',
  styleUrls: ['./resultado.component.scss'],
})
export class ResultadoComponent implements OnInit {
  @ViewChild('cardRef') cardRef!: ElementRef<HTMLDivElement>;
  @ViewChild('fotoRef') fotoRef!: ElementRef<HTMLDivElement>;

  protected imagenUrl = signal<string>('');
  protected esPanini = signal<boolean>(false);
  protected nombre = signal<string>('');
  protected descargando = signal<boolean>(false);

  protected qrUrl = signal<string>('');
  protected urlArchivo = signal<string>('');

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

  private async subirYGenerarQr(canvas: HTMLCanvasElement): Promise<void> {
    const unixTime = Math.floor(Date.now() / 1000);
    const ahora = new Date();
    const folder = `${String(ahora.getDate()).padStart(2, '0')}${String(ahora.getMonth() + 1).padStart(2, '0')}${ahora.getFullYear()}`;
    const nombreArchivo = `${unixTime}.png`;
    const modulo = 'mundial_social';
    // const documento = this.esPanini() ? 'panini' : 'foto';
    const documento = this.svc.estado().opcionValue;

    const blob = await new Promise<Blob>(resolve =>
      canvas.toBlob(b => resolve(b!), 'image/png')
    );

    const fd = new FormData();
    fd.append('file', blob, nombreArchivo);

    const res = await fetch(
      `https://apifilemanager.difoaxaca.gob.mx/upload?folder=${folder}&modulo=${modulo}&documento=${documento}`,
      { method: 'POST', body: fd }
    );
    if (!res.ok) throw new Error('Error al subir archivo');

    const url = `https://apifilemanager.difoaxaca.gob.mx/${modulo}/${folder}/${nombreArchivo}`;
    this.urlArchivo.set(url);

    const qr = await QRCode.toDataURL(url, { width: 200, margin: 2 });
    this.qrUrl.set(qr);
  }

  async imprimir(): Promise<void> {
    const esPanini = this.esPanini();
    const target = esPanini
      ? this.cardRef?.nativeElement
      : this.fotoRef?.nativeElement;

    if (!target) {
      alert('No se encontró el elemento a capturar');
      return;
    }

    await this.esperar(200);

    try {
      const options: any = {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: target.scrollWidth,
        windowHeight: target.scrollHeight
      };

      if (esPanini) {
        options.onclone = (clonedDoc: Document, element: HTMLElement) => {
          const clonedCard = clonedDoc.querySelector('.card-container');
          if (clonedCard) {
            (clonedCard as HTMLElement).style.overflow = 'visible';
          }
        };
      }

      this.svc.cargando.set(true);

      const canvas = await html2canvas(target, options);
      const imgData = canvas.toDataURL('image/png');

      // Subir al servidor y generar QR
      await this.subirYGenerarQr(canvas);

      // Abrir la imagen en una nueva ventana (sin imprimir)
      const ventana = window.open();
      if (ventana) {
        ventana.document.write(`
          <html>
            <head>
              <title>${esPanini ? 'Tarjeta Panini' : 'Foto'} - Capturada</title>
              <style>
                body {
                  margin: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: #f0f0f0;
                }
                img {
                  max-width: 100%;
                  max-height: 100vh;
                  object-fit: contain;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                .info {
                  position: fixed;
                  bottom: 20px;
                  left: 20px;
                  background: rgba(0,0,0,0.7);
                  color: white;
                  padding: 8px 12px;
                  border-radius: 8px;
                  font-family: sans-serif;
                  font-size: 12px;
                }
              </style>
            </head>
            <body>
              <img src="${imgData}" />
              <div class="info">
                📸 Captura generada | Puedes guardar la imagen con clic derecho
              </div>
            </body>
          </html>
        `);
        ventana.document.close();
      }

      alert('✅ Imagen capturada y subida correctamente. QR generado.');

    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
      console.error(error);
    } finally {
      this.svc.cargando.set(false);
    }
  }

  private esperar(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
