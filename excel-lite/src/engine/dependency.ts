import { CellAddress } from './types';
import { formatAddress } from '../utils/address';

export class DependencyGraph {
  private dependents: Map<string, Set<string>> = new Map();

  addDependency(from: CellAddress, to: CellAddress): void {
    const toKey = formatAddress(to);
    if (!this.dependents.has(toKey)) {
      this.dependents.set(toKey, new Set());
    }
    this.dependents.get(toKey)!.add(formatAddress(from));
  }

  removeDependencies(cell: CellAddress): void {
    const cellKey = formatAddress(cell);
    for (const deps of this.dependents.values()) {
      deps.delete(cellKey);
    }
  }

  getDependents(cell: CellAddress): CellAddress[] {
    const cellKey = formatAddress(cell);
    const deps = this.dependents.get(cellKey);
    if (!deps) return [];
    
    return Array.from(deps).map(key => {
      const col = key.charCodeAt(0) - 65;
      const row = parseInt(key.slice(1)) - 1;
      return { col, row };
    });
  }

  getTopologicalOrder(cells: CellAddress[]): CellAddress[] | null {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const result: CellAddress[] = [];

    const dfs = (cell: CellAddress): boolean => {
      const key = formatAddress(cell);
      if (recStack.has(key)) return false;
      if (visited.has(key)) return true;

      visited.add(key);
      recStack.add(key);

      const deps = this.getDependents(cell);
      for (const dep of deps) {
        if (!dfs(dep)) return false;
      }

      recStack.delete(key);
      result.push(cell);
      return true;
    };

    for (const cell of cells) {
      if (!dfs(cell)) return null;
    }

    return result;
  }
}
