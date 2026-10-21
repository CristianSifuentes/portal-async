/** Modelos de The Rick and Morty API — https://rickandmortyapi.com/documentation */

export type CharacterStatus = 'Alive' | 'Dead' | 'unknown';

export interface LocationRef {
  name: string;
  url: string;
}

export interface Character {
  id: number;
  name: string;
  status: CharacterStatus;
  species: string;
  type: string;
  gender: 'Female' | 'Male' | 'Genderless' | 'unknown';
  origin: LocationRef;
  location: LocationRef;
  image: string;
  episode: string[];
  url: string;
  created: string;
}

export interface ApiInfo {
  count: number;
  pages: number;
  next: string | null;
  prev: string | null;
}

/** Respuesta paginada genérica de la API. */
export interface ApiPage<T> {
  info: ApiInfo;
  results: T[];
}
