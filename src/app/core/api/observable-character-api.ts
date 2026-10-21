import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, firstValueFrom, map, Observable, of, throwError } from 'rxjs';
import { ApiPage, Character } from '../models/character';
import { API_URL } from './api-url';

/**
 * Dimensión Observable: usa `HttpClient` de Angular.
 *
 * - Cada método devuelve un Observable frío: NO sale ninguna petición hasta que alguien se suscribe (lazy).
 * - Si te desuscribes antes de que llegue la respuesta, HttpClient aborta la petición.
 * - Puedes encadenar operadores de RxJS (map, retry, catchError, switchMap...).
 */
@Injectable({ providedIn: 'root' })
export class ObservableCharacterApi {
  private readonly http = inject(HttpClient);

  getPage(page: number): Observable<ApiPage<Character>> {
    return this.http.get<ApiPage<Character>>(`${API_URL}/character`, { params: { page } });
  }

  /** La API responde 404 cuando no hay coincidencias: lo traducimos a lista vacía. */
  search(name: string): Observable<Character[]> {
    if (!name) return of([]);
    return this.http.get<ApiPage<Character>>(`${API_URL}/character`, { params: { name } }).pipe(
      map((page) => page.results),
      catchError((err: HttpErrorResponse) => (err.status === 404 ? of([]) : throwError(() => err))),
    );
  }

  /** Puente Observable → Promise: útil cuando sólo te interesa el primer valor. */
  getPageAsPromise(page: number): Promise<ApiPage<Character>> {
    return firstValueFrom(this.getPage(page));
  }
}
