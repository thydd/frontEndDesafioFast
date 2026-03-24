import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { Colaborador } from '../../models/colaborador.model';
import { Presenca, WorkshopParticipante } from '../../models/presenca.model';
import { Workshop } from '../../models/workshop.model';
import { ColaboradoresService } from '../../services/colaboradores.service';
import { PresencasService } from '../../services/presencas.service';
import { WorkshopsService } from '../../services/workshops.service';
import { getApiErrorMessage } from '../../utils/api-error.util';

@Component({
  selector: 'app-workshops-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workshops.page.html',
  styleUrl: './workshops.page.css'
})
export class WorkshopsPage implements OnInit {
  private readonly workshopsService = inject(WorkshopsService);
  private readonly presencasService = inject(PresencasService);
  private readonly colaboradoresService = inject(ColaboradoresService);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly workshops = signal<Workshop[]>([]);

  readonly selectedWorkshop = signal<Workshop | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal('');
  readonly participantes = signal<WorkshopParticipante[]>([]);
  readonly totalColaboradores = signal(0);

  ngOnInit(): void {
    this.loadWorkshops();
  }

  loadWorkshops(): void {
    this.loading.set(true);
    this.error.set('');

    this.workshopsService.getAll().subscribe({
      next: (workshops) => {
        this.workshops.set(workshops);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(getApiErrorMessage(error));
        this.loading.set(false);
      }
    });
  }

  openWorkshopDetail(workshop: Workshop): void {
    this.selectedWorkshop.set(workshop);
    this.detailLoading.set(true);
    this.detailError.set('');
    this.participantes.set([]);
    this.totalColaboradores.set(0);

    forkJoin([
      this.presencasService.getAll(),
      this.colaboradoresService.getAll()
    ]).subscribe({
      next: ([presencas, colaboradores]) => {
        const workshopId = this.getWorkshopId(workshop);
        const participantes = this.mapParticipantes(workshopId, presencas, colaboradores);
        this.participantes.set(participantes);
        this.totalColaboradores.set(colaboradores.length);
        this.detailLoading.set(false);
      },
      error: (error) => {
        this.detailError.set(getApiErrorMessage(error));
        this.detailLoading.set(false);
      }
    });
  }

  closeDetail(): void {
    this.selectedWorkshop.set(null);
    this.detailError.set('');
    this.participantes.set([]);
    this.totalColaboradores.set(0);
  }

  getPresentesCount(): number {
    return this.participantes().length;
  }

  getAusentesCount(): number {
    return Math.max(this.totalColaboradores() - this.getPresentesCount(), 0);
  }

  getPieStyle(): string {
    const total = this.totalColaboradores();
    const presentes = this.getPresentesCount();

    if (total <= 0) {
      return 'conic-gradient(#d3dbe4 0deg 360deg)';
    }

    const presentesAngle = Math.min((presentes / total) * 360, 360);
    return `conic-gradient(#00a19a 0deg ${presentesAngle}deg, #e6ecf2 ${presentesAngle}deg 360deg)`;
  }

  getPresencePercentLabel(): string {
    const total = this.totalColaboradores();
    if (total <= 0) {
      return '0%';
    }

    const percent = (this.getPresentesCount() / total) * 100;
    return `${Math.round(percent)}%`;
  }

  getWorkshopName(workshop: Workshop): string {
    const name = (workshop as Workshop & { Name?: string }).nome ??
      (workshop as Workshop & { Name?: string }).Name;

    return name || 'Workshop sem nome';
  }

  getWorkshopDescription(workshop: Workshop): string {
    const description = (workshop as Workshop & { Descricao?: string }).descricao ??
      (workshop as Workshop & { Descricao?: string }).Descricao;

    return description || 'Sem descricao cadastrada.';
  }

  getWorkshopDate(workshop: Workshop): string {
    const workshopRecord = workshop as unknown as Record<string, unknown>;
    const value = this.readStringProperty(workshopRecord, [
      'data',
      'Data',
      'dataWorkshop',
      'DataWorkshop',
      'dataHora',
      'DataHora',
      'dataEvento',
      'DataEvento',
      'dataRealizacao',
      'DataRealizacao'
    ]);

    if (!value) {
      return 'Data nao informada';
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return parsedDate.toLocaleString('pt-BR');
  }

  private mapParticipantes(
    workshopId: number,
    presencas: Presenca[],
    colaboradores: Colaborador[]
  ): WorkshopParticipante[] {
    const colaboradorMap = new Map<number, Colaborador>();

    for (const colaborador of colaboradores) {
      colaboradorMap.set(this.getColaboradorId(colaborador), colaborador);
    }

    const uniqueByColaborador = new Map<number, WorkshopParticipante>();

    for (const presenca of presencas.filter((item) => this.getPresencaWorkshopId(item) === workshopId)) {
        const colaboradorId = this.getPresencaColaboradorId(presenca);
        const colaborador = colaboradorMap.get(colaboradorId);

        uniqueByColaborador.set(colaboradorId, {
          colaboradorId,
          nome: colaborador ? this.getColaboradorName(colaborador) : `ID ${colaboradorId}`,
          dataHoraCheckIn: this.getPresencaCheckIn(presenca)
        });
    }

    return Array.from(uniqueByColaborador.values())
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }

  private getWorkshopId(workshop: Workshop): number {
    const id = (workshop as Workshop & { Id?: number }).id ??
      (workshop as Workshop & { Id?: number }).Id ??
      0;

    return Number(id);
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

  private getPresencaCheckIn(presenca: Presenca): string | undefined {
    return (presenca as Presenca & { DataHoraCheckIn?: string }).dataHoraCheckIn ??
      (presenca as Presenca & { DataHoraCheckIn?: string }).DataHoraCheckIn;
  }

  private getColaboradorId(colaborador: Colaborador): number {
    const id = (colaborador as Colaborador & { Id?: number }).id ??
      (colaborador as Colaborador & { Id?: number }).Id ??
      0;

    return Number(id);
  }

  private getColaboradorName(colaborador: Colaborador): string {
    return (colaborador as Colaborador & { Nome?: string }).nome ??
      (colaborador as Colaborador & { Nome?: string }).Nome ??
      'Colaborador sem nome';
  }

  private readStringProperty(record: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return null;
  }
}
