import { CellAddress } from './types';
import { DependencyGraph } from './dependency';
import { formatAddress } from '../utils/address';

export class CycleDetector {
  detectCycle(graph: DependencyGraph, startCell: CellAddress): CellAddress[] | null {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const path: CellAddress[] = [];
    
    const dfs = (cell: CellAddress): CellAddress[] | null => {
      const key = formatAddress(cell);
      
      if (recStack.has(key)) {
        // Found cycle - extract cycle from path
        const cycleStart = path.findIndex(c => formatAddress(c) === key);
        return path.slice(cycleStart);
      }
      
      if (visited.has(key)) {
        return null;
      }
      
      visited.add(key);
      recStack.add(key);
      path.push(cell);
      
      const dependents = graph.getDependents(cell);
      for (const dep of dependents) {
        const cycle = dfs(dep);
        if (cycle) {
          return cycle;
        }
      }
      
      recStack.delete(key);
      path.pop();
      return null;
    };
    
    return dfs(startCell);
  }
}
