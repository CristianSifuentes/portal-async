import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';

export type LogTone = 'info' | 'ok' | 'warn' | 'error';

export interface LogEntry {
  id: number;
  at: Date;
  text: string;
  tone: LogTone;
}

let nextId = 0;

/** Antepone una entrada nueva y conserva sólo las últimas `max`. */
export function appendLog(entries: LogEntry[], text: string, tone: LogTone = 'info', max = 40): LogEntry[] {
  return [{ id: nextId++, at: new Date(), text, tone }, ...entries].slice(0, max);
}

@Component({
  selector: 'app-event-log',
  imports: [DatePipe],
  template: `
    <ol class="log" aria-live="polite">
      @for (entry of entries(); track entry.id) {
        <li [class]="entry.tone">
          <time>{{ entry.at | date: 'HH:mm:ss.SSS' }}</time>
          <span>{{ entry.text }}</span>
        </li>
      } @empty {
        <li class="empty">{{ emptyText() }}</li>
      }
    </ol>
  `,
  styleUrl: './event-log.scss',
})
export class EventLog {
  readonly entries = input.required<LogEntry[]>();
  readonly emptyText = input('Sin eventos todavía.');
}
