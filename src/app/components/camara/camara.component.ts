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
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FotoIaService } from '../../services/foto-ia.service';

type CamaraEstado = 'iniciando' | 'lista' | 'contando' | 'capturando' | 'error';

@Component({
  selector: 'app-camara',
  standalone: true,
  imports: [CommonModule, FormsModule, NgFor],
  templateUrl: './camara.component.html',
  styleUrls: ['./camara.component.scss'],
})
export class CamaraComponent implements OnInit, OnDestroy {
  @ViewChild('videoEl', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;

  protected estado = signal<CamaraEstado>('iniciando');
  protected cuenta = signal<number>(3);
  protected flashActivo = signal<boolean>(false);
  protected errorMsg = signal<string>('');
  protected camaras = signal<MediaDeviceInfo[]>([]);
  protected camaraSeleccionada = signal<string>('');

  private stream: MediaStream | null = null;
  private router = inject(Router);
  protected svc = inject(FotoIaService);

  async ngOnInit(): Promise<void> {
    if (!this.svc.estado().opcionId) {
      this.router.navigate(['/']);
      return;
    }
    await this.detectarCamaras();
    // Intentar nuevamente después de que todo cargue
    setTimeout(() => {
      const camaras = this.camaras();
      if (camaras[2] && this.camaraSeleccionada() !== camaras[2].deviceId) {
        console.log('🔄 Reintentando cambiar a cámara [2]');
        this.camaraSeleccionada.set(camaras[2].deviceId);
        this.iniciarCamara(camaras[2].deviceId);
      }
    }, 500);
  }

  ngOnDestroy(): void {
    this.detenerStream();
  }

  private async detectarCamaras(): Promise<void> {
    try {
      // Pedir permiso primero para que aparezcan los labels
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach(t => t.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const camaras = devices.filter(d => d.kind === 'videoinput');

      console.log('📷 Cámaras disponibles:');
      camaras.forEach((c, i) => console.log(`  [${i}] ${c.label || 'Cámara ' + i} — id: ${c.deviceId}`));

      this.camaras.set(camaras);

      // 🔥 Seleccionar el índice [2] que es la frontal normal
      const camaraPorDefecto = camaras[2];

      console.log('✅ Usando cámara frontal normal (índice 2):', camaraPorDefecto.label);
      this.camaraSeleccionada.set(camaraPorDefecto.deviceId);
      await this.iniciarCamara(camaraPorDefecto.deviceId);

    } catch {
      this.estado.set('error');
      this.errorMsg.set('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  }

  async onCamaraChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const deviceId = select.value;
    this.camaraSeleccionada.set(deviceId);
    await this.iniciarCamara(deviceId);
  }

  async cambiarCamara(deviceId: string): Promise<void> {
    this.camaraSeleccionada.set(deviceId);
    this.estado.set('iniciando');
    await this.iniciarCamara(deviceId);
  }

  private async iniciarCamara(deviceId: string | null): Promise<void> {
    this.detenerStream();
    try {
      const constraints: MediaStreamConstraints = deviceId
        ? { video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 960 } } }
        : { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } } };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      const video = this.videoRef.nativeElement;
      video.srcObject = this.stream;
      await video.play();
      this.estado.set('lista');
    } catch {
      this.estado.set('error');
      this.errorMsg.set('No se pudo iniciar la cámara seleccionada.');
    }
  }

  private detenerStream(): void {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }

  async tomarFoto(): Promise<void> {
    if (this.estado() !== 'lista') return;
    this.estado.set('contando');

    for (let i = 3; i >= 1; i--) {
      this.cuenta.set(i);
      await this.esperar(1000);
    }

    this.estado.set('capturando');
    this.flashActivo.set(true);
    await this.esperar(120);
    this.flashActivo.set(false);

    const video = this.videoRef.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);

    canvas.toBlob(async blob => {
      if (!blob) { this.estado.set('lista'); return; }
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
    this.detenerStream();
    const opcionId = this.svc.estado().opcionId;
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
