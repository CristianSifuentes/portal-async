import { Injectable } from '@angular/core';
import { ApiPage, Character } from '../models/character';
import { API_URL } from './api-url';

/**
 * Dimensión Promise: usa `fetch` nativo del navegador.
 *
 * - Cada método devuelve una Promise: un único valor (o error) y se cierra.
 * - La petición sale en cuanto llamas al método (eager).
 * - Sólo se puede abortar si pasas un `AbortSignal` explícito.
 */
@Injectable({ providedIn: 'root' })
export class PromiseCharacterApi {
  /** Estilo clásico: cadena de `.then()` / `.catch()`. */
  getPageWithThen(page: number): Promise<ApiPage<Character>> {
    return fetch(`${API_URL}/character?page=${page}`).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<ApiPage<Character>>;
    });
  }

  /** Estilo moderno: `async/await`, con `AbortSignal` opcional para cancelar. */
  async getPageWithAwait(page: number, signal?: AbortSignal): Promise<ApiPage<Character>> {
    const res = await fetch(`${API_URL}/character?page=${page}`, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  /** La API responde 404 cuando no hay coincidencias: lo traducimos a lista vacía. */
  async search(name: string, signal?: AbortSignal): Promise<Character[]> {
    if (!name) return [];
    const res = await fetch(`${API_URL}/character?name=${encodeURIComponent(name)}`, { signal });
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const page: ApiPage<Character> = await res.json();
    return page.results;
  }
}
