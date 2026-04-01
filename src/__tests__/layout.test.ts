import { describe, it, expect } from 'vitest';
import { measureWords, placeWords } from '../layout';
import type { CloudOptions, MeasuredWord } from '../types';

// Mock Pretext prepare() — deterministic text measurement without DOM
function mockMeasure(text: string, fontSize: number, _fontFamily: string) {
  return {
    width: text.length * fontSize * 0.6,
    height: fontSize * 1.2,
  };
}

const baseOptions: CloudOptions = {
  words: [
    { text: 'JavaScript', weight: 100 },
    { text: 'TypeScript', weight: 80 },
    { text: 'React', weight: 60 },
    { text: 'Node', weight: 40 },
    { text: 'CSS', weight: 20 },
  ],
  width: 800,
  height: 600,
};

describe('measureWords', () => {
  it('returns measured words sorted by weight descending', () => {
    const measured = measureWords(baseOptions, mockMeasure);
    expect(measured.length).toBe(5);
    expect(measured[0].text).toBe('JavaScript');
    expect(measured[0].weight).toBe(100);
    expect(measured[measured.length - 1].text).toBe('CSS');
  });

  it('assigns font sizes proportional to weight', () => {
    const measured = measureWords(baseOptions, mockMeasure);
    // Highest weight gets maxFontSize (default 64)
    expect(measured[0].fontSize).toBe(64);
    // Lowest weight gets minFontSize (default 12)
    expect(measured[measured.length - 1].fontSize).toBe(12);
  });

  it('computes width and height from measure function', () => {
    const measured = measureWords(baseOptions, mockMeasure);
    const first = measured[0]; // JavaScript, fontSize 64
    // 'JavaScript' = 10 chars, fontSize 64 => width = 10 * 64 * 0.6 = 384
    // Every 5th word (index 0) gets rotation=90, so width/height swap
    expect(first.rotation).toBe(90);
    expect(first.width).toBe(64 * 1.2); // swapped: height becomes width
    expect(first.height).toBe(10 * 64 * 0.6); // swapped: width becomes height
  });

  it('handles empty words array', () => {
    const measured = measureWords({ ...baseOptions, words: [] }, mockMeasure);
    expect(measured).toEqual([]);
  });

  it('handles single word', () => {
    const opts = {
      ...baseOptions,
      words: [{ text: 'Solo', weight: 50 }],
    };
    const measured = measureWords(opts, mockMeasure);
    expect(measured.length).toBe(1);
    // Single word: min weight === max weight, gets minFontSize
    // (weight - min) / range = 0/1 = 0, so fontSize = minFontSize
    expect(measured[0].fontSize).toBe(12);
  });

  it('assigns rotation to every 5th word', () => {
    const manyWords = Array.from({ length: 20 }, (_, i) => ({
      text: `word${i}`,
      weight: 100 - i * 4,
    }));
    const measured = measureWords(
      { ...baseOptions, words: manyWords },
      mockMeasure
    );
    // Original indices 0, 5, 10, 15 should have rotation=90
    // But after sort by weight, positions may change.
    // The rotation was assigned before sort, based on original index.
    const rotated = measured.filter((m) => m.rotation === 90);
    expect(rotated.length).toBe(4); // 4 out of 20
  });

  it('respects custom minFontSize and maxFontSize', () => {
    const opts = {
      ...baseOptions,
      minFontSize: 20,
      maxFontSize: 100,
    };
    const measured = measureWords(opts, mockMeasure);
    expect(measured[0].fontSize).toBe(100);
    expect(measured[measured.length - 1].fontSize).toBe(20);
  });
});

describe('placeWords', () => {
  it('places all words without overlap', () => {
    const measured = measureWords(baseOptions, mockMeasure);
    const placements = placeWords(measured, baseOptions);

    expect(placements.length).toBeGreaterThan(0);

    // Check no two placements overlap
    for (let i = 0; i < placements.length; i++) {
      for (let j = i + 1; j < placements.length; j++) {
        const a = placements[i];
        const b = placements[j];
        const overlaps =
          a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y;
        expect(overlaps).toBe(false);
      }
    }
  });

  it('places largest word first near center', () => {
    const measured = measureWords(baseOptions, mockMeasure);
    const placements = placeWords(measured, baseOptions);

    // First placed word should be near center (0,0)
    const first = placements[0];
    expect(Math.abs(first.x + first.width / 2)).toBeLessThan(
      baseOptions.width / 2
    );
    expect(Math.abs(first.y + first.height / 2)).toBeLessThan(
      baseOptions.height / 2
    );
  });

  it('returns empty array for empty input', () => {
    const placements = placeWords([], baseOptions);
    expect(placements).toEqual([]);
  });

  it('works with rectangular spiral', () => {
    const measured = measureWords(baseOptions, mockMeasure);
    const placements = placeWords(measured, {
      ...baseOptions,
      spiral: 'rectangular',
    });
    expect(placements.length).toBeGreaterThan(0);
  });

  it('handles many words without crashing', () => {
    const manyWords = Array.from({ length: 100 }, (_, i) => ({
      text: `word${i}`,
      weight: Math.max(1, 100 - i),
    }));
    const opts = { ...baseOptions, words: manyWords, width: 1200, height: 800 };
    const measured = measureWords(opts, mockMeasure);
    const start = performance.now();
    const placements = placeWords(measured, opts);
    const elapsed = performance.now() - start;

    expect(placements.length).toBeGreaterThan(0);
    // Should complete in under 1 second
    expect(elapsed).toBeLessThan(1000);
  });
});
