/** Latencia aleatoria para que las condiciones de carrera sean visibles a simple vista. */
export function randomLatency(min = 150, max = 1600): number {
  return Math.round(min + Math.random() * (max - min));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
