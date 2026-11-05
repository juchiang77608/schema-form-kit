/**
 * Tiny, dependency-free helpers for reading and immutably writing dot paths
 * such as `"experiences.0.company"`.
 */

export function splitPath(path: string): string[] {
  return path === '' ? [] : path.split('.');
}

export function joinPath(...parts: Array<string | number>): string {
  return parts.filter((p) => p !== '').join('.');
}

export function getPath(source: unknown, path: string): unknown {
  let current: unknown = source;
  for (const key of splitPath(path)) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

const isIndex = (key: string): boolean => /^\d+$/.test(key);

/** Returns a new object with `value` set at `path`; the input is not mutated. */
export function setPath<T>(source: T, path: string, value: unknown): T {
  const keys = splitPath(path);
  if (keys.length === 0) return value as T;

  const write = (node: unknown, index: number): unknown => {
    const key = keys[index] as string;
    const nextKey = keys[index + 1];
    let container: Record<string, unknown> | unknown[];

    if (Array.isArray(node)) container = [...node];
    else if (node !== null && typeof node === 'object') container = { ...(node as object) };
    else container = isIndex(key) ? [] : {};

    const child = (container as Record<string, unknown>)[key];
    (container as Record<string, unknown>)[key] =
      nextKey === undefined ? value : write(child, index + 1);
    return container;
  };

  return write(source, 0) as T;
}
