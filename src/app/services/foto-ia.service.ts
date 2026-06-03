import { Injectable, signal } from '@angular/core';
import { OpcionValue } from '../models/opcion.model';

export interface EstadoFoto {
  opcionId: number;
  opcionValue: OpcionValue;
  nombre: string;
  registroId: string | null;
  resultadoB64: string | null;  // base64 completo: "data:image/png;base64,..."
}

@Injectable({ providedIn: 'root' })
export class FotoIaService {
  private readonly BACKEND = 'https://api-gemini.difoaxaca.gob.mx';

  // Estado compartido entre componentes
  readonly cargando = signal<boolean>(false);
  readonly estado = signal<EstadoFoto>({
    opcionId: 0,
    opcionValue: 'panini',
    nombre: '',
    registroId: null,
    resultadoB64: null,
  });

  setOpcion(id: number, value: OpcionValue): void {
    this.estado.update(e => ({ ...e, opcionId: id, opcionValue: value }));
  }

  setNombre(nombre: string): void {
    this.estado.update(e => ({ ...e, nombre }));
  }

  setResultado(b64: string): void {
    this.estado.update(e => ({ ...e, resultadoB64: b64 }));
  }

  async crearRegistro(nombre: string): Promise<string> {
    const res = await fetch(`${this.BACKEND}/crear-registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, opcion: 'panini' }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Error al crear registro');
    this.estado.update(e => ({ ...e, registroId: data.id }));
    return data.id;
  }

  async procesarImagen(blob: Blob): Promise<string> {
    const { opcionValue, registroId } = this.estado();
    const fd = new FormData();
    fd.append('image', blob, 'photo.png');
    fd.append('option', opcionValue);
    if (registroId) fd.append('registro_id', registroId);

    this.cargando.set(true);
    try {
      const res = await fetch(`${this.BACKEND}/edit-image`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al procesar imagen');
      const url = `data:image/png;base64,${data.image_b64}`;
      this.setResultado(url);
      return url;
    } finally {
      this.cargando.set(false);
    }
  }
}
