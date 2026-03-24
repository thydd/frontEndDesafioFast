export interface Presenca {
  workshopId: number;
  colaboradorId: number;
  dataHoraCheckIn?: string;
}

export interface WorkshopParticipante {
  colaboradorId: number;
  nome: string;
  email?: string;
  dataHoraCheckIn?: string;
}
