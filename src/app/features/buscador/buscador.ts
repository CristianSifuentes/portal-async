import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  defer,
  delay,
  distinctUntilChanged,
  finalize,
  map,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { ObservableCharacterApi } from '../../core/api/observable-character-api';
import { PromiseCharacterApi } from '../../core/api/promise-character-api';
import { Character } from '../../core/models/character';
import { CharacterStrip } from '../../shared/character-strip/character-strip';
import { appendLog, EventLog, LogEntry } from '../../shared/event-log/event-log';
import { errorMessage, randomLatency, sleep } from '../../shared/utils/latency';

interface SideStats {
  sent: number;
  completed: number;
  cancelled: number;
  stale: number;
}

const emptyStats = (): SideStats => ({ sent: 0, completed: 0, cancelled: 0, stale: 0 });

/**
 * Un solo input alimenta a las dos dimensiones a la vez:
 *  - Promise: cada tecla dispara un fetch. No hay debounce ni cancelación,
 *    así que la respuesta más lenta puede pisar a la más reciente (condición de carrera).
 *  - Observable: debounceTime + distinctUntilChanged + switchMap. Solo la última búsqueda importa
 *    y las anteriores en vuelo se cancelan (HttpClient aborta la petición).
 */
@Component({
  selector: 'app-buscador',
  imports: [CharacterStrip, EventLog],
  templateUrl: './buscador.html',
  styleUrl: './buscador.scss',
})
export class Buscador {
  private readonly promiseApi = inject(PromiseCharacterApi);
  private readonly observableApi = inject(ObservableCharacterApi);

  protected readonly query = signal('');
  protected readonly simulateLatency = signal(true);

  // ── Dimensión Promise ──
  protected readonly promiseResults = signal<Character[]>([]);
  protected readonly promiseShownFor = signal('');
  protected readonly promiseLog = signal<LogEntry[]>([]);
  protected readonly promiseStats = signal(emptyStats());
  protected readonly promiseIsStale = computed(
    () => this.promiseShownFor() !== this.query().trim(),
  );
  private promiseCounter = 0;

  // ── Dimensión Observable ──
  protected readonly observableResults = signal<Character[]>([]);
  protected readonly observableShownFor = signal('');
  protected readonly observableLog = signal<LogEntry[]>([]);
  protected readonly observableStats = signal(emptyStats());
  private readonly keystrokes$ = new Subject<string>();
  private observableCounter = 0;

  constructor() {
    this.keystrokes$
      .pipe(
        map((q) => q.trim()),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => this.trackedObservableSearch(q)),
        takeUntilDestroyed(),
      )
      .subscribe(({ q, results }) => {
        this.observableResults.set(results);
        this.observableShownFor.set(q);
      });
  }

  protected onInput(value: string): void {
    this.query.set(value);
    this.keystrokes$.next(value);
    void this.promiseSearch(value.trim());
  }

  protected reset(): void {
    this.query.set('');
    this.keystrokes$.next('');
    this.promiseResults.set([]);
    this.promiseShownFor.set('');
    this.promiseLog.set([]);
    this.promiseStats.set(emptyStats());
    this.observableLog.set([]);
    this.observableStats.set(emptyStats());
  }

  /** Una Promise por tecla: imposible "retirarla" una vez lanzada. */
  private async promiseSearch(q: string): Promise<void> {
    const id = ++this.promiseCounter;
    const latency = this.latency();
    this.bump(this.promiseStats, 'sent');
    this.promiseLog.update((l) => appendLog(l, `#${id} "${q}" → fetch enviado (+${latency} ms)`));

    try {
      const results = await this.promiseApi.search(q);
      await sleep(latency);
      this.bump(this.promiseStats, 'completed');

      // Llega tarde y aun así sobrescribe lo que se muestra: la condición de carrera.
      this.promiseResults.set(results);
      this.promiseShownFor.set(q);

      if (q !== this.query().trim()) {
        this.bump(this.promiseStats, 'stale');
        this.promiseLog.update((l) =>
          appendLog(l, `#${id} "${q}" llegó tarde y pisó la búsqueda actual "${this.query().trim()}"`, 'warn'),
        );
      } else {
        this.promiseLog.update((l) => appendLog(l, `#${id} "${q}" ✓ ${results.length} resultados`, 'ok'));
      }
    } catch (err) {
      this.promiseLog.update((l) => appendLog(l, `#${id} "${q}" ✗ ${errorMessage(err)}`, 'error'));
    }
  }

  /** `defer` crea el Observable en el momento de la suscripción, para poder medir y registrar cada intento. */
  private trackedObservableSearch(q: string) {
    return defer(() => {
      const id = ++this.observableCounter;
      const latency = this.latency();
      let settled = false;
      this.bump(this.observableStats, 'sent');
      this.observableLog.update((l) => appendLog(l, `#${id} "${q}" → subscribe (+${latency} ms)`));

      return this.observableApi.search(q).pipe(
        delay(latency),
        tap((results) => {
          settled = true;
          this.bump(this.observableStats, 'completed');
          this.observableLog.update((l) => appendLog(l, `#${id} "${q}" ✓ ${results.length} resultados`, 'ok'));
        }),
        map((results) => ({ q, results })),
        catchError((err) => {
          settled = true;
          this.observableLog.update((l) => appendLog(l, `#${id} "${q}" ✗ ${errorMessage(err)}`, 'error'));
          return of({ q, results: [] as Character[] });
        }),
        finalize(() => {
          if (settled) return;
          this.bump(this.observableStats, 'cancelled');
          this.observableLog.update((l) =>
            appendLog(l, `#${id} "${q}" ⨯ cancelada por switchMap (unsubscribe)`, 'warn'),
          );
        }),
      );
    });
  }

  private latency(): number {
    return this.simulateLatency() ? randomLatency() : 0;
  }

  private bump(stats: WritableSignal<SideStats>, key: keyof SideStats): void {
    stats.update((s) => ({ ...s, [key]: s[key] + 1 }));
  }
}
