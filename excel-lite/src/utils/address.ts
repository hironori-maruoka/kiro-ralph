import type { CellAddress } from '../engine/types';

/**
 * Parse a cell address string (e.g., "A1", "J20") into a CellAddress object.
 * Returns null if the address is invalid.
 */
export function parseAddress(str: string): CellAddress | null {
  const match = str.match(/^([A-J])(\d+)$/);
  if (!match) return null;
  
  const col = match[1].charCodeAt(0) - 'A'.charCodeAt(0);
  const row = parseInt(match[2], 10) - 1;
  
  if (col < 0 || col > 9 || row < 0 || row > 19) return null;
  
  return { col, row };
}

/**
 * Format a CellAddress object into a string (e.g., "A1", "J20").
 */
export function formatAddress(addr: CellAddress): string {
  const col = String.fromCharCode('A'.charCodeAt(0) + addr.col);
  const row = (addr.row + 1).toString();
  return col + row;
}

/**
 * Check if two cell addresses are equal.
 */
export function addressEquals(a: CellAddress, b: CellAddress): boolean {
  return a.col === b.col && a.row === b.row;
}
