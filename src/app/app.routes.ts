import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Portal Async',
    loadComponent: () => import('./features/inicio/inicio').then((m) => m.Inicio),
  },
  {
    path: 'comparador',
    title: 'Comparador · Portal Async',
    loadComponent: () => import('./features/comparador/comparador').then((m) => m.Comparador),
  },
  {
    path: 'buscador',
    title: 'Buscador en vivo · Portal Async',
    loadComponent: () => import('./features/buscador/buscador').then((m) => m.Buscador),
  },
  {
    path: 'fundamentos',
    title: 'Fundamentos · Portal Async',
    loadComponent: () => import('./features/fundamentos/fundamentos').then((m) => m.Fundamentos),
  },
  { path: '**', redirectTo: '' },
];
