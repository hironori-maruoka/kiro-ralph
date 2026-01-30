import { describe, it, expect, beforeEach } from 'vitest';
import { SpreadsheetEngine } from '../../src/engine/engine';

describe('SpreadsheetEngine', () => {
  let engine: SpreadsheetEngine;

  beforeEach(() => {
    engine = new SpreadsheetEngine();
  });

  describe('Chained recalculation - Requirement 7.2', () => {
    it('should recalculate simple chain A1→B1', () => {
      engine.setCellContent({ col: 0, row: 0 }, '10');
      engine.setCellContent({ col: 1, row: 0 }, '=A1*2');
      expect(engine.getCellValue({ col: 1, row: 0 })).toBe(20);
      
      engine.setCellContent({ col: 0, row: 0 }, '5');
      expect(engine.getCellValue({ col: 1, row: 0 })).toBe(10);
    });

    it('should recalculate chain A1→B1→C1', () => {
      engine.setCellContent({ col: 0, row: 0 }, '10');
      engine.setCellContent({ col: 1, row: 0 }, '=A1+5');
      engine.setCellContent({ col: 2, row: 0 }, '=B1*2');
      expect(engine.getCellValue({ col: 2, row: 0 })).toBe(30);
      
      engine.setCellContent({ col: 0, row: 0 }, '20');
      expect(engine.getCellValue({ col: 1, row: 0 })).toBe(25);
      expect(engine.getCellValue({ col: 2, row: 0 })).toBe(50);
    });

    it('should recalculate chain A1→B1→C1→D1', () => {
      engine.setCellContent({ col: 0, row: 0 }, '2');
      engine.setCellContent({ col: 1, row: 0 }, '=A1*3');
      engine.setCellContent({ col: 2, row: 0 }, '=B1+4');
      engine.setCellContent({ col: 3, row: 0 }, '=C1-1');
      expect(engine.getCellValue({ col: 3, row: 0 })).toBe(9);
      
      engine.setCellContent({ col: 0, row: 0 }, '5');
      expect(engine.getCellValue({ col: 1, row: 0 })).toBe(15);
      expect(engine.getCellValue({ col: 2, row: 0 })).toBe(19);
      expect(engine.getCellValue({ col: 3, row: 0 })).toBe(18);
    });

    it('should recalculate diamond dependency', () => {
      engine.setCellContent({ col: 0, row: 0 }, '10');
      engine.setCellContent({ col: 1, row: 0 }, '=A1+1');
      engine.setCellContent({ col: 2, row: 0 }, '=A1+2');
      engine.setCellContent({ col: 3, row: 0 }, '=B1+C1');
      expect(engine.getCellValue({ col: 3, row: 0 })).toBe(23);
      
      engine.setCellContent({ col: 0, row: 0 }, '5');
      expect(engine.getCellValue({ col: 3, row: 0 })).toBe(13);
    });
  });

  describe('Error propagation - Requirement 5.4', () => {
    it('should propagate syntax error', () => {
      engine.setCellContent({ col: 0, row: 0 }, '=1++2');
      engine.setCellContent({ col: 1, row: 0 }, '=A1+5');
      const value = engine.getCellValue({ col: 1, row: 0 });
      expect(typeof value === 'object' && value.type === 'ERR').toBe(true);
    });

    it('should propagate error through chain', () => {
      engine.setCellContent({ col: 0, row: 0 }, '=1/0');
      engine.setCellContent({ col: 1, row: 0 }, '=A1+1');
      engine.setCellContent({ col: 2, row: 0 }, '=B1*2');
      const b1 = engine.getCellValue({ col: 1, row: 0 });
      const c1 = engine.getCellValue({ col: 2, row: 0 });
      expect(typeof b1 === 'object' && b1.type === 'ERR').toBe(true);
      expect(typeof c1 === 'object' && c1.type === 'ERR').toBe(true);
    });

    it('should not affect unrelated cells', () => {
      engine.setCellContent({ col: 0, row: 0 }, '=1++2');
      engine.setCellContent({ col: 1, row: 0 }, '10');
      engine.setCellContent({ col: 2, row: 0 }, '=B1+5');
      expect(engine.getCellValue({ col: 2, row: 0 })).toBe(15);
    });
  });

  describe('Circular reference detection - Requirement 8.1, 8.2', () => {
    it('should detect simple cycle A1→B1→A1', () => {
      engine.setCellContent({ col: 0, row: 0 }, '=B1');
      engine.setCellContent({ col: 1, row: 0 }, '=A1');
      const a1 = engine.getCellValue({ col: 0, row: 0 });
      const b1 = engine.getCellValue({ col: 1, row: 0 });
      expect(typeof a1 === 'object' && a1.type === 'CYC').toBe(true);
      expect(typeof b1 === 'object' && b1.type === 'CYC').toBe(true);
    });

    it('should detect cycle A1→B1→C1→A1', () => {
      engine.setCellContent({ col: 0, row: 0 }, '=B1');
      engine.setCellContent({ col: 1, row: 0 }, '=C1');
      engine.setCellContent({ col: 2, row: 0 }, '=A1');
      const a1 = engine.getCellValue({ col: 0, row: 0 });
      const b1 = engine.getCellValue({ col: 1, row: 0 });
      const c1 = engine.getCellValue({ col: 2, row: 0 });
      expect(typeof a1 === 'object' && a1.type === 'CYC').toBe(true);
      expect(typeof b1 === 'object' && b1.type === 'CYC').toBe(true);
      expect(typeof c1 === 'object' && c1.type === 'CYC').toBe(true);
    });

    it('should detect self-reference', () => {
      engine.setCellContent({ col: 0, row: 0 }, '=A1+1');
      const value = engine.getCellValue({ col: 0, row: 0 });
      expect(typeof value === 'object' && value.type === 'CYC').toBe(true);
    });

    it('should allow breaking cycle', () => {
      engine.setCellContent({ col: 0, row: 0 }, '=B1');
      engine.setCellContent({ col: 1, row: 0 }, '=A1');
      expect(typeof engine.getCellValue({ col: 0, row: 0 }) === 'object').toBe(true);
      
      engine.setCellContent({ col: 1, row: 0 }, '10');
      expect(engine.getCellValue({ col: 0, row: 0 })).toBe(10);
      expect(engine.getCellValue({ col: 1, row: 0 })).toBe(10);
    });
  });

  describe('Error handling - Requirement 9.4', () => {
    it('should continue operating after error', () => {
      engine.setCellContent({ col: 0, row: 0 }, '=INVALID');
      engine.setCellContent({ col: 1, row: 0 }, '=5+5');
      expect(engine.getCellValue({ col: 1, row: 0 })).toBe(10);
    });

    it('should display error values correctly', () => {
      engine.setCellContent({ col: 0, row: 0 }, '=1++2');
      expect(engine.getCellDisplayValue({ col: 0, row: 0 })).toBe('#ERR');
      
      engine.setCellContent({ col: 1, row: 0 }, '=B1');
      engine.setCellContent({ col: 1, row: 0 }, '=A2');
      engine.setCellContent({ col: 0, row: 1 }, '=B1');
      expect(engine.getCellDisplayValue({ col: 1, row: 0 })).toBe('#CYC');
    });
  });
});
