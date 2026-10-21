import { Component, computed, input } from '@angular/core';
import { Character } from '../../core/models/character';

/** Fila compacta de avatares para mostrar el resultado de cada estrategia. */
@Component({
  selector: 'app-character-strip',
  template: `
    <ul class="strip">
      @for (c of visible(); track c.id) {
        <li [title]="c.name + ' · ' + c.species + ' · ' + c.status">
          <img [src]="c.image" [alt]="c.name" width="56" height="56" loading="lazy" />
          <span [class]="'dot ' + c.status.toLowerCase()"></span>
        </li>
      }
      @if (hidden() > 0) {
        <li class="more">+{{ hidden() }}</li>
      }
    </ul>
  `,
  styleUrl: './character-strip.scss',
})
export class CharacterStrip {
  readonly characters = input.required<Character[]>();
  readonly max = input(8);

  protected readonly visible = computed(() => this.characters().slice(0, this.max()));
  protected readonly hidden = computed(() => this.characters().length - this.visible().length);
}
