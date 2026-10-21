# 🌀 Portal Async

> Dos dimensiones, una misma API. **Promises vs Observables** en Angular 22, consumiendo
> [The Rick and Morty API](https://rickandmortyapi.com) (pública, gratuita y sin API key).

## Arrancar

```bash
npm install
npm start        # http://localhost:4200
```

## Los tres laboratorios

| Ruta | Qué demuestra |
| --- | --- |
| `/comparador` | La **misma petición** (`GET /character?page=N`) escrita de 9 formas |
| `/buscador` | Búsqueda por tecla: Promise (condiciones de carrera) vs `debounceTime` + `switchMap` (cancelación) |
| `/fundamentos` | Eager vs lazy, un valor vs muchos, y por qué una Promise no se puede cancelar (sin red) |

### Las 9 formas del comparador

**Imperativas** (tú decides cuándo):

1. `fetch` + `.then()/.catch()` — Promise clásica
2. `fetch` + `async/await` — Promise con sintaxis secuencial
3. `HttpClient` + `.subscribe()` — Observable, cancelable con `unsubscribe()`
4. `firstValueFrom()` — puente Observable → Promise
5. `from()` — puente Promise → Observable (para usar operadores RxJS)

**Declarativas** (reaccionan solas al cambiar `page()`):

6. Observable + pipe `async`
7. Observable → `toSignal()`
8. `httpResource()` — HttpClient como Signals
9. `resource()` con loader basado en Promise y `abortSignal`

## Estructura

```
src/app/
├── core/
│   ├── api/
│   │   ├── promise-character-api.ts     # Dimensión Promise (fetch)
│   │   └── observable-character-api.ts  # Dimensión Observable (HttpClient)
│   └── models/character.ts              # Interfaces tipadas de la API
├── shared/                              # event-log, character-strip, utilidades
└── features/
    ├── inicio/        # Tabla comparativa
    ├── comparador/
    ├── buscador/
    └── fundamentos/
```

## Stack

Angular 22 (standalone, zoneless, signals, control flow `@if/@for/@let`), RxJS 7, SCSS.
