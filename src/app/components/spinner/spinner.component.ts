import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FotoIaService } from '../../services/foto-ia.service';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
})
export class SpinnerComponent {
  protected svc = inject(FotoIaService);
}
