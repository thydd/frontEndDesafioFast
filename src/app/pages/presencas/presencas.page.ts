import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { Colaborador } from '../../models/colaborador.model';
import { Presenca } from '../../models/presenca.model';
import { Workshop } from '../../models/workshop.model';
import { AuthService } from '../../services/auth.service';
import { ColaboradoresService } from '../../services/colaboradores.service';
import { PresencaPayload, PresencasService } from '../../services/presencas.service';
import { WorkshopsService } from '../../services/workshops.service';
import { getApiErrorMessage } from '../../utils/api-error.util';

interface PresencaForm {
  workshopId: number | null;
  colaboradorId: number | null;
  dataHoraCheckIn: string;
}

interface EditingPresenceKey {
  workshopId: number;
  colaboradorId: number;
}

@Component({
  selector: 'app-presencas-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './presencas.page.html',
  styleUrl: './presencas.page.css'
})
export class PresencasPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly presencasService = inject(PresencasService);
  private readonly workshopsService = inject(WorkshopsService);
  private readonly colaboradoresService = inject(ColaboradoresService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly actionMessage = signal('');

  readonly presencas = signal<Presenca[]>([]);
  readonly workshops = signal<Workshop[]>([]);
  readonly colaboradores = signal<Colaborador[]>([]);

  readonly form = signal<PresencaForm>({
    workshopId: null,
    colaboradorId: null,
    dataHoraCheckIn: ''
  });

  readonly editingPresenceKey = signal<EditingPresenceKey | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isEditing(): boolean {
    return this.editingPresenceKey() !== null;
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set('');

    forkJoin([
      this.presencasService.getAll(),
      this.workshopsService.getAll(),
      this.colaboradoresService.getAll()
    ]).subscribe({
      next: ([presencas, workshops, colaboradores]) => {
        this.presencas.set(presencas);
        this.workshops.set(workshops);
        this.colaboradores.set(colaboradores);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(getApiErrorMessage(error));
        this.loading.set(false);
      }
    });
  }

  loadPresencasOnly(): void {
    this.presencasService.getAll().subscribe({
      next: (items) => this.presencas.set(items),
      error: (error) => {
        this.actionMessage.set(getApiErrorMessage(error));
      }
    });
  }

  onSubmit(): void {
    if (!this.isAdmin() || this.saving()) {
      return;
    }

    const payload = this.buildPayload();
    if (!payload) {
      this.actionMessage.set('Preencha workshop, colaborador e data/hora de check-in.');
      return;
    }

    this.saving.set(true);
    this.actionMessage.set('');

    const editingKey = this.editingPresenceKey();
    const request$ = editingKey
      ? this.presencasService.update(editingKey.workshopId, editingKey.colaboradorId, payload)
      : this.presencasService.create(payload);

    request$.subscribe({
      next: () => {
        this.actionMessage.set(editingKey ? 'Presença atualizada com sucesso.' : 'Presença cadastrada com sucesso.');
        this.resetForm();
        this.loadPresencasOnly();
        this.saving.set(false);
      },
      error: (error) => {
        this.actionMessage.set(getApiErrorMessage(error));
        this.saving.set(false);
      }
    });
  }

  startEdit(presenca: Presenca): void {
    if (!this.isAdmin()) {
      return;
    }

    const workshopId = this.getPresencaWorkshopId(presenca);
    const colaboradorId = this.getPresencaColaboradorId(presenca);
    const checkIn = this.toDateTimeLocal(this.getPresencaCheckIn(presenca));

    this.editingPresenceKey.set({ workshopId, colaboradorId });
    this.form.set({
      workshopId,
      colaboradorId,
      dataHoraCheckIn: checkIn
    });
    this.actionMessage.set('Editando presença selecionada.');
  }

  deletePresence(presenca: Presenca): void {
    if (!this.isAdmin() || this.saving()) {
      return;
    }

    const workshopId = this.getPresencaWorkshopId(presenca);
    const colaboradorId = this.getPresencaColaboradorId(presenca);

    this.saving.set(true);
    this.actionMessage.set('');

    this.presencasService.delete(workshopId, colaboradorId).subscribe({
      next: () => {
        this.actionMessage.set('Presença removida com sucesso.');
        this.loadPresencasOnly();
        this.saving.set(false);

        const editingKey = this.editingPresenceKey();
        if (editingKey && editingKey.workshopId === workshopId && editingKey.colaboradorId === colaboradorId) {
          this.resetForm();
        }
      },
      error: (error) => {
        this.actionMessage.set(getApiErrorMessage(error));
        this.saving.set(false);
      }
    });
  }

  cancelEdit(): void {
    this.resetForm();
    this.actionMessage.set('Edição cancelada.');
  }

  patchForm(field: keyof PresencaForm, value: string): void {
    const current = this.form();

    if (field === 'workshopId' || field === 'colaboradorId') {
      this.form.set({
        ...current,
        [field]: value ? Number(value) : null
      });
      return;
    }

    this.form.set({
      ...current,
      [field]: value
    });
  }

  getWorkshopNameById(workshopId: number): string {
    const workshop = this.workshops().find((item) => this.getWorkshopId(item) === workshopId);
    return workshop ? this.getWorkshopName(workshop) : `Workshop #${workshopId}`;
  }

  getColaboradorNameById(colaboradorId: number): string {
    const colaborador = this.colaboradores().find((item) => this.getColaboradorId(item) === colaboradorId);
    return colaborador ? this.getColaboradorName(colaborador) : `Colaborador #${colaboradorId}`;
  }

  getWorkshopName(workshop: Workshop): string {
    return (workshop as Workshop & { Name?: string }).nome ??
      (workshop as Workshop & { Name?: string }).Name ??
      'Workshop sem nome';
  }

  getColaboradorName(colaborador: Colaborador): string {
    return (colaborador as Colaborador & { Nome?: string }).nome ??
      (colaborador as Colaborador & { Nome?: string }).Nome ??
      'Colaborador sem nome';
  }

  getPresencaWorkshopId(presenca: Presenca): number {
    const workshopId = (presenca as Presenca & { WorkshopId?: number }).workshopId ??
      (presenca as Presenca & { WorkshopId?: number }).WorkshopId ??
      0;

    return Number(workshopId);
  }

  getPresencaColaboradorId(presenca: Presenca): number {
    const colaboradorId = (presenca as Presenca & { ColaboradorId?: number }).colaboradorId ??
      (presenca as Presenca & { ColaboradorId?: number }).ColaboradorId ??
      0;

    return Number(colaboradorId);
  }

  getPresencaCheckIn(presenca: Presenca): string {
    return (presenca as Presenca & { DataHoraCheckIn?: string }).dataHoraCheckIn ??
      (presenca as Presenca & { DataHoraCheckIn?: string }).DataHoraCheckIn ??
      '';
  }

  private buildPayload(): PresencaPayload | null {
    const { workshopId, colaboradorId, dataHoraCheckIn } = this.form();

    if (!workshopId || !colaboradorId || !dataHoraCheckIn) {
      return null;
    }

    return {
      workshopId,
      colaboradorId,
      dataHoraCheckIn: this.toApiLocalDateTime(dataHoraCheckIn)
    };
  }

  private resetForm(): void {
    this.editingPresenceKey.set(null);
    this.form.set({
      workshopId: null,
      colaboradorId: null,
      dataHoraCheckIn: ''
    });
  }

  private toDateTimeLocal(value: string): string {
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

    // datetime-local returns YYYY-MM-DDTHH:mm; API receives local timestamp without timezone suffix.
    return value.length === 16 ? `${value}:00` : value;
  }

  getWorkshopId(workshop: Workshop): number {
    const id = (workshop as Workshop & { Id?: number }).id ??
      (workshop as Workshop & { Id?: number }).Id ??
      0;

    return Number(id);
  }

  getColaboradorId(colaborador: Colaborador): number {
    const id = (colaborador as Colaborador & { Id?: number }).id ??
      (colaborador as Colaborador & { Id?: number }).Id ??
      0;

    return Number(id);
  }
}
