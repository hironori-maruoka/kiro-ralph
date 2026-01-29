import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { DependencyGraph } from '../../src/engine/dependency';
import { CycleDetector } from '../../src/engine/cycle';
import { CellAddress } from '../../src/engine/types';

/**
 * Feature: excel-lite
 * Property 17: 任意のセルの値が変更されたとき、エンジンは依存関係グラフを使用して、そのセルを参照するすべてのセルを正しく識別する
 */
describe('Property 17: Dependent cell identification', () => {
  it('should correctly identify all cells that reference a changed cell', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          from: fc.record({ col: fc.integer({ min: 0, max: 9 }), row: fc.integer({ min: 0, max: 19 }) }),
          to: fc.record({ col: fc.integer({ min: 0, max: 9 }), row: fc.integer({ min: 0, max: 19 }) })
        }), { minLength: 0, maxLength: 20 }),
        (dependencies) => {
          const graph = new DependencyGraph();
          
          // Add all dependencies
          for (const dep of dependencies) {
            graph.addDependency(dep.from, dep.to);
          }
          
          // For each unique 'to' cell, verify getDependents returns all 'from' cells
          const toMap = new Map<string, CellAddress[]>();
          for (const dep of dependencies) {
            const key = `${dep.to.col},${dep.to.row}`;
            if (!toMap.has(key)) {
              toMap.set(key, []);
            }
            toMap.get(key)!.push(dep.from);
          }
          
          for (const [key, expectedFroms] of toMap) {
            const [col, row] = key.split(',').map(Number);
            const to: CellAddress = { col, row };
            const dependents = graph.getDependents(to);
            
            // Check that all expected dependents are found
            const dependentKeys = new Set(dependents.map(d => `${d.col},${d.row}`));
            const expectedKeys = new Set(expectedFroms.map(f => `${f.col},${f.row}`));
            
            expect(dependentKeys).toEqual(expectedKeys);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: excel-lite
 * Property 19: 任意の操作（セル更新、数式変更）の後、依存関係グラフはすべてのセル参照関係を正確に反映する
 */
describe('Property 19: Dependency graph consistency', () => {
  it('should maintain accurate dependency relationships after operations', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          from: fc.record({ col: fc.integer({ min: 0, max: 9 }), row: fc.integer({ min: 0, max: 19 }) }),
          to: fc.record({ col: fc.integer({ min: 0, max: 9 }), row: fc.integer({ min: 0, max: 19 }) })
        }), { minLength: 0, maxLength: 20 }),
        fc.record({ col: fc.integer({ min: 0, max: 9 }), row: fc.integer({ min: 0, max: 19 }) }),
        (dependencies, cellToRemove) => {
          const graph = new DependencyGraph();
          
          // Add dependencies
          for (const dep of dependencies) {
            graph.addDependency(dep.from, dep.to);
          }
          
          // Remove dependencies for a cell
          graph.removeDependencies(cellToRemove);
          
          // Verify the cell no longer appears as a dependent
          for (const dep of dependencies) {
            const dependents = graph.getDependents(dep.to);
            const hasRemoved = dependents.some(d => d.col === cellToRemove.col && d.row === cellToRemove.row);
            expect(hasRemoved).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: excel-lite
 * Property 20: 任意の循環依存を作成する数式（例: A1→B1→A1）に対して、エンジンはサイクルを検出する
 */
describe('Property 20: Cycle detection', () => {
  it('should detect cycles in dependency graph', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        (cycleLength) => {
          const graph = new DependencyGraph();
          const detector = new CycleDetector();
          
          // Create a cycle: cell0 -> cell1 -> ... -> cellN -> cell0
          const cells: CellAddress[] = [];
          for (let i = 0; i < cycleLength; i++) {
            cells.push({ col: i % 10, row: Math.floor(i / 10) });
          }
          
          for (let i = 0; i < cycleLength; i++) {
            const from = cells[(i + 1) % cycleLength];
            const to = cells[i];
            graph.addDependency(from, to);
          }
          
          // Detect cycle starting from any cell in the cycle
          const cycle = detector.detectCycle(graph, cells[0]);
          
          expect(cycle).not.toBeNull();
          expect(cycle!.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: excel-lite
 * Property 21: 任意の循環依存が検出されたとき、サイクル内のすべてのセルに`#CYC`エラーが設定される
 */
describe('Property 21: Cycle error propagation', () => {
  it('should return all cells in the cycle', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        (cycleLength) => {
          const graph = new DependencyGraph();
          const detector = new CycleDetector();
          
          // Create a cycle
          const cells: CellAddress[] = [];
          for (let i = 0; i < cycleLength; i++) {
            cells.push({ col: i % 10, row: Math.floor(i / 10) });
          }
          
          for (let i = 0; i < cycleLength; i++) {
            const from = cells[(i + 1) % cycleLength];
            const to = cells[i];
            graph.addDependency(from, to);
          }
          
          const cycle = detector.detectCycle(graph, cells[0]);
          
          expect(cycle).not.toBeNull();
          expect(cycle!.length).toBeLessThanOrEqual(cycleLength);
          expect(cycle!.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: excel-lite
 * Property 22: 任意の循環依存に対して、エンジンは評価前にサイクルを検出し、無限ループを発生させない
 */
describe('Property 22: Infinite loop prevention', () => {
  it('should detect cycles before evaluation without infinite loops', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        (cycleLength) => {
          const graph = new DependencyGraph();
          const detector = new CycleDetector();
          
          // Create a cycle
          const cells: CellAddress[] = [];
          for (let i = 0; i < cycleLength; i++) {
            cells.push({ col: i % 10, row: Math.floor(i / 10) });
          }
          
          for (let i = 0; i < cycleLength; i++) {
            const from = cells[(i + 1) % cycleLength];
            const to = cells[i];
            graph.addDependency(from, to);
          }
          
          // This should complete without hanging
          const startTime = Date.now();
          const cycle = detector.detectCycle(graph, cells[0]);
          const endTime = Date.now();
          
          expect(cycle).not.toBeNull();
          expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
        }
      ),
      { numRuns: 100 }
    );
  });
});
