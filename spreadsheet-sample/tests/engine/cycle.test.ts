import { describe, it, expect } from 'vitest';
import { CycleDetector } from '../../src/engine/cycle';
import { DependencyGraph } from '../../src/engine/dependency';
import { parseAddress } from '../../src/utils/address';

describe('CycleDetector', () => {
  it('should return null for no cycle', () => {
    const graph = new DependencyGraph();
    const a1 = parseAddress('A1')!;
    const b1 = parseAddress('B1')!;
    graph.addDependency(a1, b1);

    const detector = new CycleDetector();
    const cycle = detector.detectCycle(graph, a1);
    expect(cycle).toBeNull();
  });

  it('should detect simple cycle A1→B1→A1', () => {
    const graph = new DependencyGraph();
    const a1 = parseAddress('A1')!;
    const b1 = parseAddress('B1')!;
    graph.addDependency(a1, b1);
    graph.addDependency(b1, a1);

    const detector = new CycleDetector();
    const cycle = detector.detectCycle(graph, a1);
    expect(cycle).not.toBeNull();
    expect(cycle!.length).toBeGreaterThan(0);
  });

  it('should detect cycle A1→B1→C1→A1', () => {
    const graph = new DependencyGraph();
    const a1 = parseAddress('A1')!;
    const b1 = parseAddress('B1')!;
    const c1 = parseAddress('C1')!;
    graph.addDependency(a1, b1);
    graph.addDependency(b1, c1);
    graph.addDependency(c1, a1);

    const detector = new CycleDetector();
    const cycle = detector.detectCycle(graph, a1);
    expect(cycle).not.toBeNull();
    expect(cycle!.length).toBe(3);
  });

  it('should return null for linear chain', () => {
    const graph = new DependencyGraph();
    const a1 = parseAddress('A1')!;
    const b1 = parseAddress('B1')!;
    const c1 = parseAddress('C1')!;
    graph.addDependency(a1, b1);
    graph.addDependency(b1, c1);

    const detector = new CycleDetector();
    const cycle = detector.detectCycle(graph, a1);
    expect(cycle).toBeNull();
  });

  it('should detect self-reference A1→A1', () => {
    const graph = new DependencyGraph();
    const a1 = parseAddress('A1')!;
    graph.addDependency(a1, a1);

    const detector = new CycleDetector();
    const cycle = detector.detectCycle(graph, a1);
    expect(cycle).not.toBeNull();
    expect(cycle!.length).toBe(1);
  });
});
