import { AsyncPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, DestroyRef, inject, resource, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, from, map, of, Subscription, switchMap } from 'rxjs';
import { API_URL, TOTAL_PAGES } from '../../core/api/api-url';
import { ObservableCharacterApi } from '../../core/api/observable-character-api';
import { PromiseCharacterApi } from '../../core/api/promise-character-api';
import { ApiPage, Character } from '../../core/models/character';
import { CharacterStrip } from '../../shared/character-strip/character-strip';
import { errorMessage } from '../../shared/utils/latency';

type Kind = 'promise' | 'observable' | 'puente' | 'signal';

interface RunState {
  status: 'idle' | 'loading' | 'ok' | 'error';
  ms?: number;
  data?: ApiPage<Character>;
  error?: string;
}

interface Strategy {
  id: string;
  title: string;
  kind: Kind;
  description: string;
  code: string;
}

interface ImperativeStrategy extends Strategy {
  run: (page: number) => void;
}

@Component({
  selector: 'app-comparador',
  imports: [AsyncPipe, CharacterStrip],
  templateUrl: './comparador.html',
  styleUrl: './comparador.scss',
})
export class Comparador {
  private readonly promiseApi = inject(PromiseCharacterApi);
  private readonly observableApi = inject(ObservableCharacterApi);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly totalPages = TOTAL_PAGES;
  protected readonly page = signal(1);
  protected readonly runs = signal<Record<string, RunState>>({});
  private readonly subscriptions = new Map<string, Subscription>();

  // ─────────────────────────────────────────────────────────────
  // 1) IMPERATIVO: tú decides cuándo se dispara la petición
  // ─────────────────────────────────────────────────────────────
  protected readonly imperative: ImperativeStrategy[] = [
    {
      id: 'then',
      title: 'Promise + .then()',
      kind: 'promise',
      description: 'fetch nativo. La petición sale en el momento en que llamas al método (eager).',
      code: `this.promiseApi.getPageWithThen(page)
  .then(data => this.ok(data))
  .catch(err => this.fail(err));`,
      run: (page) => {
        const t0 = this.start('then');
        this.promiseApi
          .getPageWithThen(page)
          .then((data) => this.succeed('then', t0, data))
          .catch((err) => this.fail('then', t0, err));
      },
    },
    {
      id: 'await',
      title: 'Promise + async/await',
      kind: 'promise',
      description: 'Misma Promise, sintaxis secuencial. El error se maneja con try/catch.',
      code: `try {
  const data = await this.promiseApi.getPageWithAwait(page);
  this.ok(data);
} catch (err) {
  this.fail(err);
}`,
      run: async (page) => {
        const t0 = this.start('await');
        try {
          const data = await this.promiseApi.getPageWithAwait(page);
          this.succeed('await', t0, data);
        } catch (err) {
          this.fail('await', t0, err);
        }
      },
    },
    {
      id: 'subscribe',
      title: 'Observable + .subscribe()',
      kind: 'observable',
      description:
        'HttpClient. Nada sale hasta subscribe() (lazy). Si vuelves a pulsar antes de que responda, la petición anterior se cancela con unsubscribe().',
      code: `this.sub?.unsubscribe(); // cancela la anterior
this.sub = this.observableApi.getPage(page)
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe({
    next: data => this.ok(data),
    error: err => this.fail(err),
  });`,
      run: (page) => {
        const t0 = this.start('subscribe');
        this.subscriptions.get('subscribe')?.unsubscribe();
        const sub = this.observableApi
          .getPage(page)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (data) => this.succeed('subscribe', t0, data),
            error: (err) => this.fail('subscribe', t0, err),
          });
        this.subscriptions.set('subscribe', sub);
      },
    },
    {
      id: 'firstValueFrom',
      title: 'Observable → Promise (firstValueFrom)',
      kind: 'puente',
      description:
        'Convierte el Observable de HttpClient en Promise para usar await. Sustituto moderno del obsoleto toPromise().',
      code: `const data = await firstValueFrom(
  this.observableApi.getPage(page)
);`,
      run: async (page) => {
        const t0 = this.start('firstValueFrom');
        try {
          this.succeed('firstValueFrom', t0, await this.observableApi.getPageAsPromise(page));
        } catch (err) {
          this.fail('firstValueFrom', t0, err);
        }
      },
    },
    {
      id: 'from',
      title: 'Promise → Observable (from)',
      kind: 'puente',
      description:
        'Envuelve una Promise en un Observable para usar operadores RxJS. Ojo: la Promise ya salió (eager), from() no la vuelve lazy.',
      code: `from(this.promiseApi.getPageWithAwait(page))
  .pipe(map(data => ({ ...data, results: data.results.filter(c => c.status === 'Alive') })))
  .subscribe(data => this.ok(data));`,
      run: (page) => {
        const t0 = this.start('from');
        from(this.promiseApi.getPageWithAwait(page))
          .pipe(
            map((data) => ({ ...data, results: data.results.filter((c) => c.status === 'Alive') })),
            takeUntilDestroyed(this.destroyRef),
          )
          .subscribe({
            next: (data) => this.succeed('from', t0, data),
            error: (err) => this.fail('from', t0, err),
          });
      },
    },
  ];

  // ─────────────────────────────────────────────────────────────
  // 2) DECLARATIVO: se describe "de qué depende" y Angular reacciona
  //    solo cada vez que cambia la página.
  // ─────────────────────────────────────────────────────────────
  private readonly page$ = toObservable(this.page);

  /** Observable + pipe async: el template se suscribe y desuscribe por ti. */
  protected readonly viaAsyncPipe$ = this.page$.pipe(
    switchMap((page) => this.observableApi.getPage(page).pipe(catchError(() => of(null)))),
  );

  /** Observable → Signal: toSignal se suscribe al crear el componente y limpia al destruirlo. */
  protected readonly viaToSignal = toSignal(
    this.page$.pipe(
      switchMap((page) => this.observableApi.getPage(page).pipe(catchError(() => of(null)))),
    ),
  );

  /** httpResource: HttpClient expuesto como Signals (value, isLoading, error). */
  protected readonly viaHttpResource = httpResource<ApiPage<Character>>(
    () => `${API_URL}/character?page=${this.page()}`,
  );

  /** resource(): loader basado en Promise; Angular aborta la anterior vía abortSignal. */
  protected readonly viaResource = resource({
    params: () => ({ page: this.page() }),
    loader: ({ params, abortSignal }) => this.promiseApi.getPageWithAwait(params.page, abortSignal),
  });

  protected readonly declarative: Strategy[] = [
    {
      id: 'asyncPipe',
      title: 'Observable + pipe async',
      kind: 'observable',
      description: 'switchMap cancela la petición anterior si cambias de página rápido.',
      code: `page$ = toObservable(this.page);
data$ = this.page$.pipe(
  switchMap(p => this.api.getPage(p))
);
<!-- template -->
@if (data$ | async; as data) { ... }`,
    },
    {
      id: 'toSignal',
      title: 'Observable → toSignal()',
      kind: 'puente',
      description: 'Lo mejor de RxJS (operadores) consumido como Signal en el template.',
      code: `data = toSignal(
  this.page$.pipe(switchMap(p => this.api.getPage(p)))
);
<!-- template -->
{{ data()?.results.length }}`,
    },
    {
      id: 'httpResource',
      title: 'httpResource() ✨',
      kind: 'signal',
      description: 'API moderna de Angular: estado de carga, error y valor como Signals, sin subscribe.',
      code: `data = httpResource<ApiPage<Character>>(
  () => API_URL + '/character?page=' + this.page()
);
<!-- template -->
@if (data.isLoading()) { ... }
@if (data.hasValue()) { ... }`,
    },
    {
      id: 'resource',
      title: 'resource() + Promise ✨',
      kind: 'signal',
      description: 'Para cuando tu fuente es una Promise (fetch, SDKs). Angular pasa un abortSignal para cancelar.',
      code: `data = resource({
  params: () => ({ page: this.page() }),
  loader: ({ params, abortSignal }) =>
    this.promiseApi.getPageWithAwait(params.page, abortSignal),
});`,
    },
  ];

  protected setPage(page: number): void {
    this.page.set(Math.min(Math.max(page, 1), TOTAL_PAGES));
  }

  protected runAll(): void {
    for (const s of this.imperative) s.run(this.page());
  }

  private start(id: string): number {
    this.patch(id, { status: 'loading' });
    return performance.now();
  }

  private succeed(id: string, t0: number, data: ApiPage<Character>): void {
    this.patch(id, { status: 'ok', ms: Math.round(performance.now() - t0), data });
  }

  private fail(id: string, t0: number, err: unknown): void {
    this.patch(id, { status: 'error', ms: Math.round(performance.now() - t0), error: errorMessage(err) });
  }

  private patch(id: string, state: RunState): void {
    this.runs.update((runs) => ({ ...runs, [id]: state }));
  }
}
