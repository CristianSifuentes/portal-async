import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Row {
  feature: string;
  promise: string;
  observable: string;
}

@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {
  protected readonly rows: Row[] = [
    {
      feature: 'Valores emitidos',
      promise: 'Uno solo (éxito o error) y se cierra.',
      observable: 'Cero, uno o muchos a lo largo del tiempo (stream).',
    },
    {
      feature: 'Ejecución',
      promise: 'Eager: corre en cuanto se crea.',
      observable: 'Lazy: no hace nada hasta que alguien se suscribe.',
    },
    {
      feature: 'Cancelación',
      promise: 'No se puede cancelar (sólo fetch con AbortController).',
      observable: 'unsubscribe(); switchMap y takeUntilDestroyed lo hacen por ti.',
    },
    {
      feature: 'Operadores',
      promise: 'then / catch / finally, Promise.all, Promise.race…',
      observable: 'Cientos con RxJS: map, filter, debounceTime, switchMap, retry…',
    },
    {
      feature: 'Nativo en JS',
      promise: 'Sí.',
      observable: 'No: RxJS (incluido en Angular).',
    },
    {
      feature: 'Consumo',
      promise: '.then() o async/await.',
      observable: '.subscribe(), pipe async, toSignal() o httpResource().',
    },
  ];

  protected readonly labs = [
    {
      path: '/comparador',
      title: 'Comparador',
      text: 'La misma petición a la API escrita de 9 formas: then, async/await, subscribe, pipe async, toSignal, httpResource, resource…',
    },
    {
      path: '/buscador',
      title: 'Buscador en vivo',
      text: 'Una búsqueda por tecla con Promise vs debounceTime + switchMap. Verás condiciones de carrera y cancelaciones en tiempo real.',
    },
    {
      path: '/fundamentos',
      title: 'Fundamentos',
      text: 'Eager vs lazy, un valor vs muchos, y por qué una Promise no se puede cancelar. Sin red, sólo las reglas.',
    },
  ];
}
