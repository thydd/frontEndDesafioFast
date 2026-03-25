import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { Colaborador } from '../../models/colaborador.model';
import { Presenca, WorkshopParticipante } from '../../models/presenca.model';
import { Workshop } from '../../models/workshop.model';
import { AuthService } from '../../services/auth.service';
import { ColaboradoresService } from '../../services/colaboradores.service';
import { PresencasService } from '../../services/presencas.service';
import { WorkshopPayload, WorkshopsService } from '../../services/workshops.service';
import { getApiErrorMessage } from '../../utils/api-error.util';

interface WorkshopForm {
  nome: string;
  descricao: string;
  data: string;
}

@Component({
  selector: 'app-workshops-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workshops.page.html',
  styleUrl: './workshops.page.css'
})
export class WorkshopsPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly workshopsService = inject(WorkshopsService);
  private readonly presencasService = inject(PresencasService);
  private readonly colaboradoresService = inject(ColaboradoresService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly actionMessage = signal('');
  readonly workshops = signal<Workshop[]>([]);
  readonly editingWorkshopId = signal<number | null>(null);
  readonly form = signal<WorkshopForm>({
    nome: '',
    descricao: '',
    data: ''
  });

  readonly selectedWorkshop = signal<Workshop | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal('');
  readonly participantes = signal<WorkshopParticipante[]>([]);
  readonly totalColaboradores = signal(0);

  ngOnInit(): void {
    this.loadWorkshops();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isEditing(): boolean {
    return this.editingWorkshopId() !== null;
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

  patchForm(field: keyof WorkshopForm, value: string): void {
    this.form.set({
      ...this.form(),
      [field]: value
    });
  }

  submitWorkshop(): void {
    if (!this.isAdmin() || this.saving()) {
      return;
    }

    const payload = this.buildWorkshopPayload();
    if (!payload) {
      this.actionMessage.set('Informe pelo menos o nome do workshop.');
      return;
    }

    this.saving.set(true);
    this.actionMessage.set('');

    const editingId = this.editingWorkshopId();
    const request$ = editingId !== null
      ? this.workshopsService.update(editingId, payload)
      : this.workshopsService.create(payload);

    request$.subscribe({
      next: () => {
        this.actionMessage.set(editingId !== null ? 'Workshop atualizado com sucesso.' : 'Workshop criado com sucesso.');
        this.resetForm();
        this.loadWorkshops();
        this.saving.set(false);
      },
      error: (error) => {
        this.actionMessage.set(getApiErrorMessage(error));
        this.saving.set(false);
      }
    });
  }

  startEdit(workshop: Workshop): void {
    if (!this.isAdmin()) {
      return;
    }

    this.editingWorkshopId.set(this.getWorkshopId(workshop));
    this.form.set({
      nome: this.getWorkshopName(workshop),
      descricao: this.getWorkshopDescriptionOrEmpty(workshop),
      data: this.toDateTimeLocal(this.getWorkshopDateRaw(workshop))
    });
    this.actionMessage.set('Editando workshop selecionado.');
  }

  cancelEdit(): void {
    this.resetForm();
    this.actionMessage.set('Edição cancelada.');
  }

  deleteWorkshop(workshop: Workshop): void {
    if (!this.isAdmin() || this.saving()) {
      return;
    }

    const id = this.getWorkshopId(workshop);
    this.saving.set(true);
    this.actionMessage.set('');

    this.workshopsService.delete(id).subscribe({
      next: () => {
        this.actionMessage.set('Workshop removido com sucesso.');
        this.loadWorkshops();
        this.saving.set(false);

        if (this.editingWorkshopId() === id) {
          this.resetForm();
        }
      },
      error: (error) => {
        this.actionMessage.set(getApiErrorMessage(error));
        this.saving.set(false);
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

    return description || 'Sem descrição cadastrada.';
  }

  getWorkshopDate(workshop: Workshop): string {
    const value = this.getWorkshopDateRaw(workshop);

    if (!value) {
      return 'Data não informada';
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return parsedDate.toLocaleString('pt-BR');
  }

  getWorkshopDescriptionOrEmpty(workshop: Workshop): string {
    return (workshop as Workshop & { Descricao?: string }).descricao ??
      (workshop as Workshop & { Descricao?: string }).Descricao ??
      '';
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

  getWorkshopId(workshop: Workshop): number {
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

  private buildWorkshopPayload(): WorkshopPayload | null {
    const current = this.form();
    const nome = current.nome.trim();

    if (!nome) {
      return null;
    }

    const payload: WorkshopPayload = {
      nome
    };

    if (current.descricao.trim()) {
      payload.descricao = current.descricao.trim();
    }

    if (current.data) {
      const localDateTime = this.toApiLocalDateTime(current.data);
      payload.data = localDateTime;
      payload.dataHora = localDateTime;
    }

    return payload;
  }

  private resetForm(): void {
    this.editingWorkshopId.set(null);
    this.form.set({
      nome: '',
      descricao: '',
      data: ''
    });
  }

  private getWorkshopDateRaw(workshop: Workshop): string | null {
    const workshopRecord = workshop as unknown as Record<string, unknown>;
    return this.readStringProperty(workshopRecord, [
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
  }

  private toDateTimeLocal(value: string | null): string {
    if (!value) {
      return '';
    }

    const hasExplicitTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(value);
    if (!hasExplicitTimezone) {
      return value.slice(0, 16);
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    const offset = parsed.getTimezoneOffset();
    const localDate = new Date(parsed.getTime() - offset * 60_000);
    return localDate.toISOString().slice(0, 16);
  }

  private toApiLocalDateTime(value: string): string {
    if (!value) {
      return value;
    }

    return value.length === 16 ? `${value}:00` : value;
  }
}
