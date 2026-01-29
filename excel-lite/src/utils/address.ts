import type { CellAddress } from '../engine/types';

export function parseAddress(str: string): CellAddress | null {
  const match = str.match(/^([A-J])(\d+)$/);
  if (!match) return null;
  
  const col = match[1].charCodeAt(0) - 'A'.charCodeAt(0);
  const row = parseInt(match[2], 10) - 1;
  
  if (col < 0 || col > 9 || row < 0 || row > 19) return null;
  
  return { col, row };
}

export function formatAddress(addr: CellAddress): string {
  return String.fromCharCode('A'.charCodeAt(0) + addr.col) + (addr.row + 1);
}
