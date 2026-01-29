import { describe, it, expect } from 'vitest';
import { FormulaParser } from '../../src/engine/parser';

/**
 * Feature: excel-lite
 * Unit tests for FormulaParser
 * Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.3, 6.1, 6.4
 */

describe('FormulaParser', () => {
  const parser = new FormulaParser();

  describe('Formula recognition (Req 4.1, 4.2)', () => {
    it('should recognize formula starting with =', () => {
      const result = parser.parse('=1+2');
      expect(result.success).toBe(true);
    });

    it('should reject input not starting with =', () => {
      const result = parser.parse('1+2');
      expect(result.success).toBe(false);
    });
  });

  describe('Number literals', () => {
    it('should parse integer', () => {
      const result = parser.parse('=42');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ast.type).toBe('number');
        expect(result.ast.value).toBe(42);
      }
    });

    it('should parse decimal', () => {
      const result = parser.parse('=3.14');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ast.type).toBe('number');
        expect(result.ast.value).toBe(3.14);
      }
    });
  });

  describe('Arithmetic operators (Req 4.3)', () => {
    it('should parse addition', () => {
      const result = parser.parse('=1+2');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ast.type).toBe('binaryOp');
        expect(result.ast.op).toBe('+');
      }
    });

    it('should parse subtraction', () => {
      const result = parser.parse('=5-3');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ast.type).toBe('binaryOp');
        expect(result.ast.op).toBe('-');
      }
    });

    it('should parse multiplication', () => {
      const result = parser.parse('=4*3');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ast.type).toBe('binaryOp');
        expect(result.ast.op).toBe('*');
      }
    });

    it('should parse division', () => {
      const result = parser.parse('=10/2');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ast.type).toBe('binaryOp');
        expect(result.ast.op).toBe('/');
      }
    });

    it('should respect operator precedence (* before +)', () => {
      const result = parser.parse('=1+2*3');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ast.type).toBe('binaryOp');
        expect(result.ast.op).toBe('+');
        expect(result.ast.right.type).toBe('binaryOp');
        expect(result.ast.right.op).toBe('*');
      }
    });

    it('should respect parentheses', () => {
      const result = parser.parse('=(1+2)*3');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ast.type).toBe('binaryOp');
        expect(result.ast.op).toBe('*');
        expect(result.ast.left.type).toBe('binaryOp');
        expect(result.ast.left.op).toBe('+');
      }
    });
  });

  describe('Cell references (Req 5.1)', () => {
    it('should parse single cell reference', () => {
      const result = parser.parse('=A1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ast.type).toBe('cellRef');
        expect(result.ast.cell.col).toBe(0);
        expect(result.ast.cell.row).toBe(0);
      }
    });

    it('should parse cell reference in expression', () => {
      const result = parser.parse('=A1+B2');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ast.type).toBe('binaryOp');
        expect(result.ast.left.type).toBe('cellRef');
        expect(result.ast.right.type).toBe('cellRef');
      }
    });

    it('should parse multiple cell references', () => {
      const result = parser.parse('=A1+B2*C3');
      expect(result.success).toBe(true);
    });
  });

  describe('Range notation (Req 6.1)', () => {
    it('should parse range A1:B5', () => {
      const result = parser.parse('=SUM(A1:B5)');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ast.type).toBe('function');
        expect(result.ast.args[0].type).toBe('range');
        expect(result.ast.args[0].start.col).toBe(0);
        expect(result.ast.args[0].start.row).toBe(0);
        expect(result.ast.args[0].end.col).toBe(1);
        expect(result.ast.args[0].end.row).toBe(4);
      }
    });
  });

  describe('Functions (Req 6.2, 6.3)', () => {
    it('should parse SUM function', () => {
      const result = parser.parse('=SUM(A1:A5)');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ast.type).toBe('function');
        expect(result.ast.name).toBe('SUM');
      }
    });

    it('should parse AVG function', () => {
      const result = parser.parse('=AVG(B1:B10)');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ast.type).toBe('function');
        expect(result.ast.name).toBe('AVG');
      }
    });

    it('should parse function case-insensitively', () => {
      const result1 = parser.parse('=sum(A1:A5)');
      const result2 = parser.parse('=Sum(A1:A5)');
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  describe('Error cases (Req 4.4, 5.3, 6.4)', () => {
    it('should reject empty formula', () => {
      const result = parser.parse('=');
      expect(result.success).toBe(false);
    });

    it('should reject invalid syntax', () => {
      const result = parser.parse('=1++2');
      expect(result.success).toBe(false);
    });

    it('should reject unmatched parentheses', () => {
      const result = parser.parse('=(1+2');
      expect(result.success).toBe(false);
    });

    it('should reject invalid cell reference', () => {
      const result = parser.parse('=Z99');
      expect(result.success).toBe(false);
    });

    it('should reject invalid range', () => {
      const result = parser.parse('=SUM(Z99:AA100)');
      expect(result.success).toBe(false);
    });

    it('should reject unknown function', () => {
      const result = parser.parse('=UNKNOWN(A1)');
      expect(result.success).toBe(false);
    });

    it('should reject function without arguments', () => {
      const result = parser.parse('=SUM()');
      expect(result.success).toBe(false);
    });

    it('should reject trailing operators', () => {
      const result = parser.parse('=1+2+');
      expect(result.success).toBe(false);
    });
  });

  describe('Complex expressions', () => {
    it('should parse nested operations', () => {
      const result = parser.parse('=(A1+B2)*(C3-D4)');
      expect(result.success).toBe(true);
    });

    it('should parse function with cell reference', () => {
      const result = parser.parse('=SUM(A1:A5)+B1');
      expect(result.success).toBe(true);
    });

    it('should parse multiple functions', () => {
      const result = parser.parse('=SUM(A1:A5)+AVG(B1:B5)');
      expect(result.success).toBe(true);
    });
  });
});
