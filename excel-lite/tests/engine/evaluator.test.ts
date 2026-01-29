import { describe, it, expect } from 'vitest';
import { CellEvaluator } from '../../src/engine/evaluator';
import { EvaluationContext } from '../../src/engine/evaluator';
import { CellValue, CellAddress, isError } from '../../src/engine/types';
import { FormulaParser } from '../../src/engine/parser';

describe('CellEvaluator', () => {
  const parser = new FormulaParser();
  const evaluator = new CellEvaluator();

  const createContext = (cells: Record<string, CellValue>): EvaluationContext => ({
    getCellValue: (addr: CellAddress) => {
      const key = String.fromCharCode(65 + addr.col) + (addr.row + 1);
      return cells[key] ?? 0;
    },
    getRangeValues: (start: CellAddress, end: CellAddress) => {
      const values: CellValue[] = [];
      for (let row = start.row; row <= end.row; row++) {
        for (let col = start.col; col <= end.col; col++) {
          const key = String.fromCharCode(65 + col) + (row + 1);
          values.push(cells[key] ?? 0);
        }
      }
      return values;
    }
  });

  describe('Number literals', () => {
    it('should evaluate integer', () => {
      const parseResult = parser.parse('=42');
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      
      const result = evaluator.evaluate(parseResult.ast, createContext({}));
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(42);
    });

    it('should evaluate decimal', () => {
      const parseResult = parser.parse('=3.14');
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      
      const result = evaluator.evaluate(parseResult.ast, createContext({}));
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(3.14);
    });
  });

  describe('Cell references', () => {
    it('should resolve cell reference', () => {
      const parseResult = parser.parse('=A1');
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      
      const result = evaluator.evaluate(parseResult.ast, createContext({ A1: 10 }));
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(10);
    });

    it('should treat empty cell as 0', () => {
      const parseResult = parser.parse('=A1');
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      
      const result = evaluator.evaluate(parseResult.ast, createContext({}));
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(0);
    });

    it('should propagate error from referenced cell', () => {
      const parseResult = parser.parse('=A1');
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      
      const error = { type: 'ERR' as const, message: 'Test error' };
      const result = evaluator.evaluate(parseResult.ast, createContext({ A1: error }));
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.type).toBe('ERR');
    });
  });

  describe('Binary operations', () => {
    it('should evaluate addition', () => {
      const parseResult = parser.parse('=5+3');
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      
      const result = evaluator.evaluate(parseResult.ast, createContext({}));
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(8);
    });

    it('should evaluate subtraction', () => {
      const parseResult = parser.parse('=10-4');
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      
      const result = evaluator.evaluate(parseResult.ast, createContext({}));
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(6);
    });

    it('should evaluate multiplication', () => {
      const parseResult = parser.parse('=6*7');
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      
      const result = evaluator.evaluate(parseResult.ast, createContext({}));
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(42);
    });

    it('should evaluate division', () => {
      const parseResult = parser.parse('=20/4');
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      
      const result = evaluator.evaluate(parseResult.ast, createContext({}));
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(5);
    });

    it('should handle division by zero', () => {
      const parseResult = parser.parse('=10/0');
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      
      const result = evaluator.evaluate(parseResult.ast, createContext({}));
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.type).toBe('ERR');
    });
  });

  describe('Complex expressions', () => {
    it('should evaluate expression with cell references', () => {
      const parseResult = parser.parse('=A1+B2');
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      
      const result = evaluator.evaluate(parseResult.ast, createContext({ A1: 5, B2: 3 }));
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(8);
    });

    it('should evaluate nested operations', () => {
      const parseResult = parser.parse('=(A1+B1)*C1');
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      
      const result = evaluator.evaluate(parseResult.ast, createContext({ A1: 2, B1: 3, C1: 4 }));
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(20);
    });
  });

  describe('SUM function', () => {
    it('should sum range of numbers', () => {
      const parseResult = parser.parse('=SUM(A1:A3)');
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      
      const result = evaluator.evaluate(parseResult.ast, createContext({ A1: 1, A2: 2, A3: 3 }));
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(6);
    });

    it('should ignore non-numeric values', () => {
      const parseResult = parser.parse('=SUM(A1:A3)');
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      
      const result = evaluator.evaluate(parseResult.ast, createContext({ A1: 1, A2: 'text', A3: 3 }));
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(4);
    });

    it('should treat empty cells as 0', () => {
      const parseResult = parser.parse('=SUM(A1:A3)');
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      
      const result = evaluator.evaluate(parseResult.ast, createContext({ A1: 5 }));
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(5);
    });
  });

  describe('AVG function', () => {
    it('should calculate average of range', () => {
      const parseResult = parser.parse('=AVG(A1:A4)');
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      
      const result = evaluator.evaluate(parseResult.ast, createContext({ A1: 2, A2: 4, A3: 6, A4: 8 }));
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(5);
    });

    it('should ignore non-numeric values', () => {
      const parseResult = parser.parse('=AVG(A1:A4)');
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      
      const result = evaluator.evaluate(parseResult.ast, createContext({ A1: 2, A2: 'text', A3: 6, A4: 8 }));
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(16 / 3);
    });

    it('should return 0 for empty range', () => {
      const parseResult = parser.parse('=AVG(A1:A3)');
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      
      const result = evaluator.evaluate(parseResult.ast, createContext({}));
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(0);
    });
  });

  describe('Error propagation', () => {
    it('should propagate error in binary operation left side', () => {
      const parseResult = parser.parse('=A1+5');
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      
      const error = { type: 'ERR' as const, message: 'Test error' };
      const result = evaluator.evaluate(parseResult.ast, createContext({ A1: error }));
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.type).toBe('ERR');
    });

    it('should propagate error in binary operation right side', () => {
      const parseResult = parser.parse('=5+A1');
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      
      const error = { type: 'ERR' as const, message: 'Test error' };
      const result = evaluator.evaluate(parseResult.ast, createContext({ A1: error }));
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.type).toBe('ERR');
    });

    it('should propagate error in function argument', () => {
      const parseResult = parser.parse('=SUM(A1:A3)');
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      
      const error = { type: 'ERR' as const, message: 'Test error' };
      const result = evaluator.evaluate(parseResult.ast, createContext({ A1: 1, A2: error, A3: 3 }));
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.type).toBe('ERR');
    });
  });
});
