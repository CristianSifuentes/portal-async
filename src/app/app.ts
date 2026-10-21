import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly links = [
    { path: '/', label: 'Inicio', exact: true },
    { path: '/comparador', label: 'Comparador', exact: false },
    { path: '/buscador', label: 'Buscador', exact: false },
    { path: '/fundamentos', label: 'Fundamentos', exact: false },
  ];
}
