import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FotoIaService } from '../../services/foto-ia.service';

type CamaraEstado = 'iniciando' | 'lista' | 'contando' | 'capturando' | 'error';

@Component({
  selector: 'app-camara',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './camara.component.html',
  styleUrls: ['./camara.component.scss'],
})
export class CamaraComponent implements OnInit, OnDestroy {
  @ViewChild('videoEl', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;

  protected estado = signal<CamaraEstado>('iniciando');
  protected cuenta = signal<number>(3);
  protected flashActivo = signal<boolean>(false);
  protected errorMsg = signal<string>('');

  private stream: MediaStream | null = null;
  private router = inject(Router);
  protected svc = inject(FotoIaService);

  async ngOnInit(): Promise<void> {
    // Guard: si no hay opción seleccionada, regresa al inicio
    if (!this.svc.estado().opcionId) {
      this.router.navigate(['/']);
      return;
    }
    await this.iniciarCamara();
  }

  ngOnDestroy(): void {
    this.detenerStream();
  }

  private async iniciarCamara(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      const video = this.videoRef.nativeElement;
      video.srcObject = this.stream;
      await video.play();
      this.estado.set('lista');
    } catch {
      this.estado.set('error');
      this.errorMsg.set('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  }

  private detenerStream(): void {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }

  async tomarFoto(): Promise<void> {
    if (this.estado() !== 'lista') return;
    this.estado.set('contando');

    // Countdown 3 → 1
    for (let i = 3; i >= 1; i--) {
      this.cuenta.set(i);
      await this.esperar(1000);
    }

    // Flash
    this.estado.set('capturando');
    this.flashActivo.set(true);
    await this.esperar(120);
    this.flashActivo.set(false);

    // Captura frame
    const video = this.videoRef.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);

    canvas.toBlob(async blob => {
      if (!blob) {
        this.estado.set('lista');
        return;
      }
      try {
        await this.svc.procesarImagen(blob);
        this.detenerStream();
        this.router.navigate(['/resultado']);
      } catch (e: any) {
        this.estado.set('lista');
        this.errorMsg.set(e.message ?? 'Error al procesar');
      }
    }, 'image/png');
  }

  volver(): void {
    const opcionId = this.svc.estado().opcionId;
    this.detenerStream();
    if (opcionId === 1) {
      this.router.navigate(['/nombre']);
    } else {
      this.router.navigate(['/']);
    }
  }

  private esperar(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
