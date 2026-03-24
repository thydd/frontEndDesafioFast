import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { Colaborador } from '../../models/colaborador.model';
import { Presenca } from '../../models/presenca.model';
import { Workshop } from '../../models/workshop.model';
import { ColaboradoresService } from '../../services/colaboradores.service';
import { PresencasService } from '../../services/presencas.service';
import { WorkshopsService } from '../../services/workshops.service';
import { getApiErrorMessage } from '../../utils/api-error.util';

@Component({
  selector: 'app-colaboradores-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './colaboradores.page.html',
  styleUrl: './colaboradores.page.css'
})
export class ColaboradoresPage implements OnInit {
  private readonly colaboradoresService = inject(ColaboradoresService);
  private readonly presencasService = inject(PresencasService);
  private readonly workshopsService = inject(WorkshopsService);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly colaboradores = signal<Colaborador[]>([]);
  readonly selectedColaborador = signal<Colaborador | null>(null);
  readonly statsLoading = signal(false);
  readonly statsError = signal('');
  readonly workshopsParticipados = signal(0);
  readonly totalWorkshops = signal(0);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.colaboradoresService.getAll().subscribe({
      next: (items) => {
        this.colaboradores.set(items);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(getApiErrorMessage(error));
        this.loading.set(false);
      }
    });
  }

  getColaboradorName(colaborador: Colaborador): string {
    return (colaborador as Colaborador & { Nome?: string }).nome ??
      (colaborador as Colaborador & { Nome?: string }).Nome ??
      'Colaborador sem nome';
  }

  openColaboradorStats(colaborador: Colaborador): void {
    this.selectedColaborador.set(colaborador);
    this.statsLoading.set(true);
    this.statsError.set('');

    forkJoin([
      this.presencasService.getAll(),
      this.workshopsService.getAll()
    ]).subscribe({
      next: ([presencas, workshops]) => {
        const colaboradorId = this.getColaboradorId(colaborador);
        this.workshopsParticipados.set(this.countWorkshopParticipation(colaboradorId, presencas));
        this.totalWorkshops.set(workshops.length);
        this.statsLoading.set(false);
      },
      error: (error) => {
        this.statsError.set(getApiErrorMessage(error));
        this.statsLoading.set(false);
      }
    });
  }

  closeColaboradorStats(): void {
    this.selectedColaborador.set(null);
    this.statsLoading.set(false);
    this.statsError.set('');
    this.workshopsParticipados.set(0);
    this.totalWorkshops.set(0);
  }

  getParticipacaoPercent(): number {
    const total = this.totalWorkshops();
    if (total <= 0) {
      return 0;
    }

    return Math.round((this.workshopsParticipados() / total) * 100);
  }

  getNaoParticipados(): number {
    return Math.max(this.totalWorkshops() - this.workshopsParticipados(), 0);
  }

  getParticipouBarWidth(): string {
    return `${this.getParticipacaoPercent()}%`;
  }

  getNaoParticipouBarWidth(): string {
    return `${100 - this.getParticipacaoPercent()}%`;
  }

  private getColaboradorId(colaborador: Colaborador): number {
    const id = (colaborador as Colaborador & { Id?: number }).id ??
      (colaborador as Colaborador & { Id?: number }).Id ??
      0;

    return Number(id);
  }

  private countWorkshopParticipation(colaboradorId: number, presencas: Presenca[]): number {
    const workshopIds = new Set<number>();

    for (const presenca of presencas) {
      if (this.getPresencaColaboradorId(presenca) === colaboradorId) {
        workshopIds.add(this.getPresencaWorkshopId(presenca));
      }
    }

    return workshopIds.size;
  }

  private getPresencaWorkshopId(presenca: Presenca): number {
    const workshopId = (presenca as Presenca & { WorkshopId?: number }).workshopId ??
      (presenca as Presenca & { WorkshopId?: number }).WorkshopId ??
      0;

    return Number(workshopId);
  }

  private getPresencaColaboradorId(presenca: Presenca): number {
    const colaboradorId = (presenca as Presenca & { ColaboradorId?: number }).colaboradorId ??
      (presenca as Presenca & { ColaboradorId?: number }).ColaboradorId ??
      0;

    return Number(colaboradorId);
  }
}
