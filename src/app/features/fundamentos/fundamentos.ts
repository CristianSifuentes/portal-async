import { Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { interval, Observable, Subscription, take } from 'rxjs';
import { appendLog, EventLog, LogEntry, LogTone } from '../../shared/event-log/event-log';

/**
 * Laboratorio sin red: aísla las diferencias de fondo entre Promise y Observable
 * para que se vean sin el ruido de una API.
 */
@Component({
  selector: 'app-fundamentos',
  imports: [EventLog],
  templateUrl: './fundamentos.html',
  styleUrl: './fundamentos.scss',
})
export class Fundamentos {
  // ─── Lab 1: eager vs lazy, y caliente/compartida vs fría/unicast ───
  protected readonly lazyLog = signal<LogEntry[]>([]);
  protected readonly hasPromise = signal(false);
  protected readonly hasObservable = signal(false);
  private promise?: Promise<number>;
  private observable?: Observable<number>;

  protected createPromise(): void {
    this.log(this.lazyLog, '› new Promise(...) creada');
    this.promise = new Promise<number>((resolve) => {
      // Este cuerpo corre YA, aunque nadie haya llamado a .then()
      this.log(this.lazyLog, '🟢 executor de la Promise EJECUTADO (eager)', 'ok');
      setTimeout(() => resolve(Math.round(Math.random() * 100)), 400);
    });
    this.hasPromise.set(true);
  }

  protected thenPromise(): void {
    this.log(this.lazyLog, '› promise.then(...) — se reutiliza el mismo resultado');
    this.promise?.then((v) => this.log(this.lazyLog, `   .then recibió ${v}`, 'ok'));
  }

  protected createObservable(): void {
    this.log(this.lazyLog, '› new Observable(...) creado — todavía no pasa nada…', 'warn');
    this.observable = new Observable<number>((subscriber) => {
      this.log(this.lazyLog, '🔵 executor del Observable EJECUTADO (por la suscripción)', 'ok');
      const t = setTimeout(() => {
        subscriber.next(Math.round(Math.random() * 100));
        subscriber.complete();
      }, 400);
      return () => clearTimeout(t);
    });
    this.hasObservable.set(true);
  }

  protected subscribeObservable(): void {
    this.log(this.lazyLog, '› observable.subscribe(...) — cada suscripción re-ejecuta (frío)');
    this.observable?.subscribe((v) => this.log(this.lazyLog, `   subscribe recibió ${v}`, 'ok'));
  }

  // ─── Lab 2: un valor vs muchos, y cancelación ───
  protected readonly streamLog = signal<LogEntry[]>([]);
  protected readonly streamValues = signal<number[]>([]);
  protected readonly streamRunning = signal(false);
  private streamSub?: Subscription;

  protected readonly promiseLog = signal<LogEntry[]>([]);
  protected readonly promisePending = signal(false);
  private promiseCancelled = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.streamSub?.unsubscribe());
  }

  protected startStream(): void {
    this.streamSub?.unsubscribe();
    this.streamValues.set([]);
    this.streamRunning.set(true);
    this.log(this.streamLog, '› interval(700).pipe(take(10)).subscribe()');
    this.streamSub = interval(700)
      .pipe(take(10))
      .subscribe({
        next: (v) => {
          this.streamValues.update((vals) => [...vals, v]);
          this.log(this.streamLog, `next(${v})`, 'ok');
        },
        complete: () => {
          this.streamRunning.set(false);
          this.log(this.streamLog, 'complete() — el stream terminó solo');
        },
      });
  }

  protected cancelStream(): void {
    this.streamSub?.unsubscribe();
    this.streamRunning.set(false);
    this.log(this.streamLog, '⨯ unsubscribe() — no llegarán más valores', 'warn');
  }

  protected startPromise(): void {
    this.promiseCancelled = false;
    this.promisePending.set(true);
    this.log(this.promiseLog, '› new Promise(resolve => setTimeout(resolve, 3000))');
    new Promise<string>((resolve) => setTimeout(() => resolve('¡valor único!'), 3000)).then((v) => {
      this.promisePending.set(false);
      this.log(
        this.promiseLog,
        this.promiseCancelled
          ? `resolve("${v}") — se resolvió IGUAL, la "cancelación" fue sólo una bandera`
          : `resolve("${v}") — un solo valor y se cierra`,
        this.promiseCancelled ? 'error' : 'ok',
      );
    });
  }

  protected cancelPromise(): void {
    this.promiseCancelled = true;
    this.log(
      this.promiseLog,
      '⨯ No existe promise.cancel(). Sólo podemos ignorar el resultado (o usar AbortController con fetch).',
      'warn',
    );
  }

  private log(target: WritableSignal<LogEntry[]>, text: string, tone: LogTone = 'info'): void {
    target.update((l) => appendLog(l, text, tone));
  }
}
