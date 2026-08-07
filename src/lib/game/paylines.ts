/**
 * Fixed left-to-right paylines on a 5×4 grid.
 * Each path is an array of row indices (0 = top) for reels 0..4.
 */
export interface PaylineDefinition {
  id: number;
  rows: [number, number, number, number, number];
}

export const REEL_COUNT = 5;
export const ROW_COUNT = 4;

/** Approximately 14 paylines covering horizontals, zigzags, and V shapes. */
export const PAYLINES: PaylineDefinition[] = [
  { id: 0, rows: [0, 0, 0, 0, 0] },
  { id: 1, rows: [1, 1, 1, 1, 1] },
  { id: 2, rows: [2, 2, 2, 2, 2] },
  { id: 3, rows: [3, 3, 3, 3, 3] },
  { id: 4, rows: [0, 1, 2, 1, 0] },
  { id: 5, rows: [3, 2, 1, 2, 3] },
  { id: 6, rows: [0, 0, 1, 0, 0] },
  { id: 7, rows: [3, 3, 2, 3, 3] },
  { id: 8, rows: [1, 0, 0, 0, 1] },
  { id: 9, rows: [2, 3, 3, 3, 2] },
  { id: 10, rows: [0, 1, 0, 1, 0] },
  { id: 11, rows: [3, 2, 3, 2, 3] },
  { id: 12, rows: [1, 2, 3, 2, 1] },
  { id: 13, rows: [2, 1, 0, 1, 2] },
];
