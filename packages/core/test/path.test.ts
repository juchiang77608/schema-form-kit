import { describe, expect, it } from 'vitest';
import { getPath, joinPath, setPath } from '../src';

describe('getPath', () => {
  it('reads nested objects and arrays', () => {
    const source = { a: { b: [{ c: 1 }] } };
    expect(getPath(source, 'a.b.0.c')).toBe(1);
    expect(getPath(source, 'a.x.y')).toBeUndefined();
    expect(getPath(source, '')).toEqual(source);
  });
});

describe('setPath', () => {
  it('sets a value without mutating the input', () => {
    const source = { a: { b: 1 }, keep: { k: true } };
    const next = setPath(source, 'a.b', 2);
    expect(next).toEqual({ a: { b: 2 }, keep: { k: true } });
    expect(source.a.b).toBe(1);
    expect(next.keep).toBe(source.keep);
  });

  it('creates arrays for numeric keys', () => {
    expect(setPath({}, 'list.0.name', 'x')).toEqual({ list: [{ name: 'x' }] });
  });

  it('copies arrays on write', () => {
    const source = { list: [{ n: 1 }, { n: 2 }] };
    const next = setPath(source, 'list.1.n', 3);
    expect(next.list[1]).toEqual({ n: 3 });
    expect(source.list[1]).toEqual({ n: 2 });
    expect(next.list[0]).toBe(source.list[0]);
  });
});

describe('joinPath', () => {
  it('skips empty parts', () => {
    expect(joinPath('', 'a', 0, 'b')).toBe('a.0.b');
  });
});
