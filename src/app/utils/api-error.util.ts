import { HttpErrorResponse } from '@angular/common/http';

import { ApiErrorResponse } from '../models/api-response.model';

export function getApiErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Ocorreu um erro inesperado. Tente novamente.';
  }

  if (error.status === 0) {
    return 'Nao foi possivel conectar com a API. Verifique se o backend esta ativo e o CORS configurado.';
  }

  const body = error.error as ApiErrorResponse | string | null;

  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (body && typeof body === 'object') {
    if (Array.isArray(body.errors) && body.errors.length > 0) {
      return body.errors.join(' | ');
    }

    if (body.message) {
      return body.message;
    }
  }

  switch (error.status) {
    case 400:
      return 'Dados invalidos. Revise os campos e tente novamente.';
    case 401:
      return 'Sessao expirada ou nao autorizada. Faca login novamente.';
    case 404:
      return 'Recurso nao encontrado.';
    case 409:
      return 'Conflito de regra de negocio.';
    default:
      return 'Erro interno no servidor. Tente novamente em instantes.';
  }
}
