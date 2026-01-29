import { describe, it, expect, beforeEach } from 'vitest';
import { DependencyGraph } from '../../src/engine/dependency';
import type { CellAddress } from '../../src/engine/types';

describe('DependencyGraph', () => {
  let graph: DependencyGraph;

  beforeEach(() => {
    graph = new DependencyGraph();
  });

  describe('addDependency', () => {
    it('should add a dependency relationship', () => {
      const from: CellAddress = { col: 0, row: 0 }; // A1
      const to: CellAddress = { col: 1, row: 0 }; // B1

      graph.addDependency(from, to);
      const dependents = graph.getDependents(to);

      expect(dependents).toHaveLength(1);
      expect(dependents[0]).toEqual(from);
    });

    it('should handle multiple dependencies from one cell', () => {
      const from: CellAddress = { col: 0, row: 0 }; // A1
      const to1: CellAddress = { col: 1, row: 0 }; // B1
      const to2: CellAddress = { col: 2, row: 0 }; // C1

      graph.addDependency(from, to1);
      graph.addDependency(from, to2);

      expect(graph.getDependents(to1)).toHaveLength(1);
      expect(graph.getDependents(to2)).toHaveLength(1);
    });

    it('should handle multiple cells depending on one cell', () => {
      const from1: CellAddress = { col: 0, row: 0 }; // A1
      const from2: CellAddress = { col: 1, row: 0 }; // B1
      const to: CellAddress = { col: 2, row: 0 }; // C1

      graph.addDependency(from1, to);
      graph.addDependency(from2, to);

      const dependents = graph.getDependents(to);
      expect(dependents).toHaveLength(2);
    });
  });

  describe('removeDependencies', () => {
    it('should remove all dependencies from a cell', () => {
      const from: CellAddress = { col: 0, row: 0 }; // A1
      const to1: CellAddress = { col: 1, row: 0 }; // B1
      const to2: CellAddress = { col: 2, row: 0 }; // C1

      graph.addDependency(from, to1);
      graph.addDependency(from, to2);
      graph.removeDependencies(from);

      expect(graph.getDependents(to1)).toHaveLength(0);
      expect(graph.getDependents(to2)).toHaveLength(0);
    });

    it('should not affect other dependencies', () => {
      const from1: CellAddress = { col: 0, row: 0 }; // A1
      const from2: CellAddress = { col: 1, row: 0 }; // B1
      const to: CellAddress = { col: 2, row: 0 }; // C1

      graph.addDependency(from1, to);
      graph.addDependency(from2, to);
      graph.removeDependencies(from1);

      const dependents = graph.getDependents(to);
      expect(dependents).toHaveLength(1);
      expect(dependents[0]).toEqual(from2);
    });
  });

  describe('getDependents', () => {
    it('should return empty array for cell with no dependents', () => {
      const cell: CellAddress = { col: 0, row: 0 }; // A1
      expect(graph.getDependents(cell)).toHaveLength(0);
    });

    it('should return all cells that depend on the given cell', () => {
      const target: CellAddress = { col: 0, row: 0 }; // A1
      const dep1: CellAddress = { col: 1, row: 0 }; // B1
      const dep2: CellAddress = { col: 2, row: 0 }; // C1
      const dep3: CellAddress = { col: 3, row: 0 }; // D1

      graph.addDependency(dep1, target);
      graph.addDependency(dep2, target);
      graph.addDependency(dep3, target);

      const dependents = graph.getDependents(target);
      expect(dependents).toHaveLength(3);
    });
  });

  describe('getTopologicalOrder', () => {
    it('should return empty array for empty input', () => {
      const result = graph.getTopologicalOrder([]);
      expect(result).toEqual([]);
    });

    it('should return single cell for single input', () => {
      const cell: CellAddress = { col: 0, row: 0 }; // A1
      const result = graph.getTopologicalOrder([cell]);
      expect(result).toEqual([cell]);
    });

    it('should return correct order for linear chain', () => {
      const a1: CellAddress = { col: 0, row: 0 }; // A1
      const b1: CellAddress = { col: 1, row: 0 }; // B1
      const c1: CellAddress = { col: 2, row: 0 }; // C1

      // A1 depends on B1, B1 depends on C1
      graph.addDependency(a1, b1);
      graph.addDependency(b1, c1);

      const result = graph.getTopologicalOrder([a1, b1, c1]);
      expect(result).not.toBeNull();
      expect(result).toHaveLength(3);
      
      // Topological order returns cells in post-order (dependencies last)
      // A1 depends on B1, so A1 comes before B1 in result
      // B1 depends on C1, so B1 comes before C1 in result
      // Order: A1, B1, C1
      const a1Index = result!.findIndex(c => c.col === 0 && c.row === 0);
      const b1Index = result!.findIndex(c => c.col === 1 && c.row === 0);
      const c1Index = result!.findIndex(c => c.col === 2 && c.row === 0);
      
      expect(a1Index).toBeLessThan(b1Index);
      expect(b1Index).toBeLessThan(c1Index);
    });

    it('should return null for cycle', () => {
      const a1: CellAddress = { col: 0, row: 0 }; // A1
      const b1: CellAddress = { col: 1, row: 0 }; // B1

      // A1 depends on B1, B1 depends on A1 (cycle)
      graph.addDependency(a1, b1);
      graph.addDependency(b1, a1);

      const result = graph.getTopologicalOrder([a1, b1]);
      expect(result).toBeNull();
    });
  });
});
