import { describe, it, expect } from 'vitest';
import { intersects, isWithinBounds, collidesWithAny } from '../collision';
import type { BBox } from '../types';

describe('intersects', () => {
  it('detects overlapping boxes', () => {
    const a: BBox = { x: 0, y: 0, width: 10, height: 10 };
    const b: BBox = { x: 5, y: 5, width: 10, height: 10 };
    expect(intersects(a, b)).toBe(true);
  });

  it('returns false for non-overlapping boxes', () => {
    const a: BBox = { x: 0, y: 0, width: 10, height: 10 };
    const b: BBox = { x: 20, y: 20, width: 10, height: 10 };
    expect(intersects(a, b)).toBe(false);
  });

  it('returns false for adjacent boxes (touching edges)', () => {
    const a: BBox = { x: 0, y: 0, width: 10, height: 10 };
    const b: BBox = { x: 10, y: 0, width: 10, height: 10 };
    expect(intersects(a, b)).toBe(false);
  });

  it('detects contained box', () => {
    const outer: BBox = { x: 0, y: 0, width: 100, height: 100 };
    const inner: BBox = { x: 10, y: 10, width: 20, height: 20 };
    expect(intersects(outer, inner)).toBe(true);
  });

  it('handles negative coordinates', () => {
    const a: BBox = { x: -10, y: -10, width: 15, height: 15 };
    const b: BBox = { x: -5, y: -5, width: 10, height: 10 };
    expect(intersects(a, b)).toBe(true);
  });
});

describe('isWithinBounds', () => {
  it('box inside bounds returns true', () => {
    const box: BBox = { x: -10, y: -10, width: 20, height: 20 };
    expect(isWithinBounds(box, { width: 100, height: 100 })).toBe(true);
  });

  it('box exceeding right edge returns false', () => {
    const box: BBox = { x: 40, y: 0, width: 20, height: 10 };
    expect(isWithinBounds(box, { width: 100, height: 100 })).toBe(false);
  });

  it('box exceeding left edge returns false', () => {
    const box: BBox = { x: -60, y: 0, width: 10, height: 10 };
    expect(isWithinBounds(box, { width: 100, height: 100 })).toBe(false);
  });

  it('box exactly at bounds returns true', () => {
    const box: BBox = { x: -50, y: -50, width: 100, height: 100 };
    expect(isWithinBounds(box, { width: 100, height: 100 })).toBe(true);
  });
});

describe('collidesWithAny', () => {
  it('returns false for empty placed list', () => {
    const box: BBox = { x: 0, y: 0, width: 10, height: 10 };
    expect(collidesWithAny(box, [])).toBe(false);
  });

  it('returns true when colliding with one placed box', () => {
    const box: BBox = { x: 0, y: 0, width: 10, height: 10 };
    const placed: BBox[] = [{ x: 5, y: 5, width: 10, height: 10 }];
    expect(collidesWithAny(box, placed)).toBe(true);
  });

  it('returns false when no collision with any placed box', () => {
    const box: BBox = { x: 100, y: 100, width: 10, height: 10 };
    const placed: BBox[] = [
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 20, y: 20, width: 10, height: 10 },
    ];
    expect(collidesWithAny(box, placed)).toBe(false);
  });
});
