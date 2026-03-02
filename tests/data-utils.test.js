import { describe, it, expect } from 'vitest';
import {
  getFilteredCards,
  arraysEqual,
  normalizeCardData,
  calculateC0,
  extractChartData,
} from '../data-utils.js';

// Shared test fixtures
const classMap = {
  0: 'neutral',
  1: 'elf',
  2: 'royal',
  3: 'witch',
  4: 'dragon',
  5: 'nightmare',
  6: 'bishop',
  7: 'nemesis',
};

const sampleCards = [
  { class: 'elf', 名稱: 'Elf Card A', 數量: 50, 帶3: 10, 帶2: 5, 帶1: 3 },
  { class: 'elf', 名稱: 'Elf Card B', 數量: 30, 帶3: 5, 帶2: 2, 帶1: 1 },
  { class: 'royal', 名稱: 'Royal Card A', 數量: 100, 帶3: 20, 帶2: 10, 帶1: 5 },
  { class: 'witch', 名稱: 'Witch Card A', 數量: 80, 帶3: 15, 帶2: 8, 帶1: 4 },
  {
    class: 'neutral',
    名稱: 'Neutral Card A',
    數量: 200,
    帶3: 40, 帶2: 20, 帶1: 10,
    byclass: {
      '1': { count: 25, 帶3: 5, 帶2: 3, 帶1: 2 },
      '2': { count: 60, 帶3: 10, 帶2: 8, 帶1: 5 },
      '3': { count: 0, 帶3: 0, 帶2: 0, 帶1: 0 },
    },
  },
  {
    class: 'neutral',
    名稱: 'Neutral Card B',
    數量: 150,
    帶3: 30, 帶2: 15, 帶1: 8,
    byclass: {
      '1': { count: 10, 帶3: 2, 帶2: 1, 帶1: 1 },
      '2': { count: 0, 帶3: 0, 帶2: 0, 帶1: 0 },
    },
  },
];

// ─── getFilteredCards ──────────────────────────────────────────

describe('getFilteredCards', () => {
  it('returns all cards sorted by count desc when selectedClass is "all"', () => {
    const result = getFilteredCards(sampleCards, 'all', false, classMap);
    expect(result).toHaveLength(sampleCards.length);
    // Check descending order
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].數量).toBeGreaterThanOrEqual(result[i].數量);
    }
  });

  it('filters by specific class correctly', () => {
    const result = getFilteredCards(sampleCards, 'elf', false, classMap);
    expect(result.every(c => c.class === 'elf')).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('returns only neutral cards when selectedClass is "neutral"', () => {
    const result = getFilteredCards(sampleCards, 'neutral', false, classMap);
    expect(result.every(c => c.class === 'neutral')).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('includes neutral cards with byclass data when includeNeutral is true', () => {
    const result = getFilteredCards(sampleCards, 'elf', true, classMap);
    const elfCards = result.filter(c => c.class === 'elf');
    const neutralByClass = result.filter(c => c._isNeutralByClass);
    expect(elfCards).toHaveLength(2);
    // Both neutral cards have byclass['1'] with count > 0
    expect(neutralByClass).toHaveLength(2);
  });

  it('transforms neutral card count to class-specific count', () => {
    const result = getFilteredCards(sampleCards, 'elf', true, classMap);
    const neutralByClass = result.filter(c => c._isNeutralByClass);
    // Neutral Card A byclass['1'].count = 25
    const cardA = neutralByClass.find(c => c.名稱 === 'Neutral Card A');
    expect(cardA.數量).toBe(25);
    expect(cardA.帶3).toBe(5);
    expect(cardA.帶2).toBe(3);
    expect(cardA.帶1).toBe(2);
  });

  it('excludes neutral cards with zero count for the selected class', () => {
    // Neutral Card A byclass['3'].count = 0, Neutral Card B has no byclass['3']
    const result = getFilteredCards(sampleCards, 'witch', true, classMap);
    const neutralByClass = result.filter(c => c._isNeutralByClass);
    expect(neutralByClass).toHaveLength(0);
  });

  it('does not include neutral cards when includeNeutral is false', () => {
    const result = getFilteredCards(sampleCards, 'royal', false, classMap);
    expect(result.every(c => c.class === 'royal')).toBe(true);
    expect(result).toHaveLength(1);
  });

  it('sorts results descending by count', () => {
    const result = getFilteredCards(sampleCards, 'elf', true, classMap);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].數量).toBeGreaterThanOrEqual(result[i].數量);
    }
  });

  it('handles empty data', () => {
    const result = getFilteredCards([], 'all', false, classMap);
    expect(result).toEqual([]);
  });

  it('handles empty data with class filter', () => {
    const result = getFilteredCards([], 'elf', true, classMap);
    expect(result).toEqual([]);
  });

  it('sets byclass field to selectedClass on neutral-by-class cards', () => {
    const result = getFilteredCards(sampleCards, 'royal', true, classMap);
    const neutralByClass = result.filter(c => c._isNeutralByClass);
    // Neutral Card A byclass['2'].count = 60
    expect(neutralByClass).toHaveLength(1);
    expect(neutralByClass[0].byclass).toBe('royal');
  });
});

// ─── arraysEqual ──────────────────────────────────────────────

describe('arraysEqual', () => {
  it('returns true for equal arrays', () => {
    expect(arraysEqual([1, 2, 3], [1, 2, 3])).toBe(true);
  });

  it('returns true for equal string arrays', () => {
    expect(arraysEqual(['a', 'b'], ['a', 'b'])).toBe(true);
  });

  it('returns false for different lengths', () => {
    expect(arraysEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it('returns false for different values', () => {
    expect(arraysEqual([1, 2, 3], [1, 2, 4])).toBe(false);
  });

  it('returns true for empty arrays', () => {
    expect(arraysEqual([], [])).toBe(true);
  });

  it('returns false when one is empty and the other is not', () => {
    expect(arraysEqual([], [1])).toBe(false);
  });
});

// ─── normalizeCardData ────────────────────────────────────────

describe('normalizeCardData', () => {
  it('maps English field names to Chinese', () => {
    const raw = [
      {
        code: 'C001',
        class: 1,
        name: 'Test Card',
        count: 42,
        image_hash: 'abc123',
        帶3: 10,
        帶2: 5,
        帶1: 3,
      },
    ];
    const result = normalizeCardData(raw, classMap);
    expect(result[0].代碼).toBe('C001');
    expect(result[0].名稱).toBe('Test Card');
    expect(result[0].數量).toBe(42);
    expect(result[0].imagehash).toBe('abc123');
  });

  it('maps class numbers to string keys', () => {
    const raw = [
      { code: 'C001', class: 3, name: 'Witch', count: 10, image_hash: 'h1' },
      { code: 'C002', class: 0, name: 'Neutral', count: 5, image_hash: 'h2' },
    ];
    const result = normalizeCardData(raw, classMap);
    expect(result.find(c => c.名稱 === 'Witch').class).toBe('witch');
    expect(result.find(c => c.名稱 === 'Neutral').class).toBe('neutral');
  });

  it('handles missing optional fields (帶 values default to 0)', () => {
    const raw = [
      { code: 'C001', class: 2, name: 'Royal', count: 20, image_hash: 'h3' },
    ];
    const result = normalizeCardData(raw, classMap);
    expect(result[0].帶3).toBe(0);
    expect(result[0].帶2).toBe(0);
    expect(result[0].帶1).toBe(0);
  });

  it('preserves byclass data when present', () => {
    const raw = [
      {
        code: 'C001',
        class: 0,
        name: 'Neutral',
        count: 100,
        image_hash: 'h4',
        byclass: { '1': { count: 10, 帶3: 2, 帶2: 1, 帶1: 1 } },
      },
    ];
    const result = normalizeCardData(raw, classMap);
    expect(result[0].byclass).toEqual({ '1': { count: 10, 帶3: 2, 帶2: 1, 帶1: 1 } });
  });

  it('sets byclass to undefined when not present', () => {
    const raw = [
      { code: 'C001', class: 1, name: 'Elf', count: 10, image_hash: 'h5' },
    ];
    const result = normalizeCardData(raw, classMap);
    expect(result[0].byclass).toBeUndefined();
  });

  it('sorts output by count descending', () => {
    const raw = [
      { code: 'C001', class: 1, name: 'Low', count: 5, image_hash: 'h1' },
      { code: 'C002', class: 2, name: 'High', count: 99, image_hash: 'h2' },
      { code: 'C003', class: 3, name: 'Mid', count: 50, image_hash: 'h3' },
    ];
    const result = normalizeCardData(raw, classMap);
    expect(result[0].數量).toBe(99);
    expect(result[1].數量).toBe(50);
    expect(result[2].數量).toBe(5);
  });

  it('falls back to Chinese field names when English names are absent', () => {
    const raw = [
      { 代碼: 'C001', class: 1, 名稱: 'Fallback', 數量: 7, imagehash: 'hfb' },
    ];
    const result = normalizeCardData(raw, classMap);
    expect(result[0].代碼).toBe('C001');
    expect(result[0].名稱).toBe('Fallback');
    expect(result[0].數量).toBe(7);
    expect(result[0].imagehash).toBe('hfb');
  });
});

// ─── calculateC0 ──────────────────────────────────────────────

describe('calculateC0', () => {
  it('calculates correctly with normal values', () => {
    // total=100, c1=10, c2=20, c3=30 => 100-10-20-30 = 40
    expect(calculateC0(100, 10, 20, 30)).toBe(40);
  });

  it('returns 0 when sum exceeds total', () => {
    // total=10, c1=5, c2=5, c3=5 => 10-5-5-5 = -5 => max(0,-5) = 0
    expect(calculateC0(10, 5, 5, 5)).toBe(0);
  });

  it('returns total when all carry counts are 0', () => {
    expect(calculateC0(500, 0, 0, 0)).toBe(500);
  });

  it('returns 0 when total is 0', () => {
    expect(calculateC0(0, 0, 0, 0)).toBe(0);
  });

  it('returns 0 when total equals sum of carries', () => {
    expect(calculateC0(60, 20, 20, 20)).toBe(0);
  });
});

// ─── extractChartData ─────────────────────────────────────────

describe('extractChartData', () => {
  const chartColors = ['#FF6384', '#36A2EB', '#FFCE56'];

  it('extracts labels (names) and data (counts)', () => {
    const cards = [
      { 名稱: 'Card A', 數量: 50 },
      { 名稱: 'Card B', 數量: 30 },
    ];
    const result = extractChartData(cards, chartColors);
    expect(result.labels).toEqual(['Card A', 'Card B']);
    expect(result.data).toEqual([50, 30]);
  });

  it('cycles through colors correctly', () => {
    const cards = [
      { 名稱: 'A', 數量: 1 },
      { 名稱: 'B', 數量: 2 },
      { 名稱: 'C', 數量: 3 },
      { 名稱: 'D', 數量: 4 }, // cycles back to index 0
      { 名稱: 'E', 數量: 5 }, // cycles to index 1
    ];
    const result = extractChartData(cards, chartColors);
    expect(result.colors).toEqual([
      '#FF6384', '#36A2EB', '#FFCE56', '#FF6384', '#36A2EB',
    ]);
  });

  it('returns empty arrays for empty input', () => {
    const result = extractChartData([], chartColors);
    expect(result.labels).toEqual([]);
    expect(result.data).toEqual([]);
    expect(result.colors).toEqual([]);
  });

  it('handles single card', () => {
    const cards = [{ 名稱: 'Solo', 數量: 99 }];
    const result = extractChartData(cards, chartColors);
    expect(result.labels).toEqual(['Solo']);
    expect(result.data).toEqual([99]);
    expect(result.colors).toEqual(['#FF6384']);
  });
});
