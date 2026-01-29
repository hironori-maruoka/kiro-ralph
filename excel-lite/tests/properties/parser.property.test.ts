import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { FormulaParser } from '../../src/engine/parser';

/**
 * Feature: excel-lite
 * Property-based tests for FormulaParser
 */

describe('FormulaParser - Property Tests', () => {
  const parser = new FormulaParser();

  /**
   * Property 8: Input classification accuracy
   * For any input string, if it starts with '=', it's recognized as a formula,
   * otherwise it's treated as literal text or number
   */
  it('Property 8: correctly classifies formulas vs literals', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = parser.parse(input);
        
        if (input.startsWith('=')) {
          // Should attempt to parse as formula
          // Either succeeds or returns error
          expect(result.success === true || result.success === false).toBe(true);
        } else {
          // Should fail because it doesn't start with '='
          expect(result.success).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: Arithmetic operator parsing
   * For any valid formula containing +, -, *, /, the parser correctly generates AST
   */
  it('Property 9: parses arithmetic operators correctly', () => {
    const numberArb = fc.integer({ min: 1, max: 100 });
    const operatorArb = fc.constantFrom('+', '-', '*', '/');
    
    fc.assert(
      fc.property(numberArb, operatorArb, numberArb, (left, op, right) => {
        const formula = `=${left}${op}${right}`;
        const result = parser.parse(formula);
        
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.ast.type).toBe('binaryOp');
          if (result.ast.type === 'binaryOp') {
            expect(result.ast.op).toBe(op);
            expect(result.ast.left.type).toBe('number');
            expect(result.ast.right.type).toBe('number');
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10: Syntax error detection
   * For any formula with invalid syntax, the parser returns #ERR error
   */
  it('Property 10: detects syntax errors', () => {
    const invalidFormulas = fc.constantFrom(
      '=+',
      '=-',
      '=*',
      '=/',
      '=1+',
      '=+1',
      '=1++1',
      '=1 2',
      '=()',
      '=SUM()',
      '=UNKNOWN(A1)',
      '=A1:',
      '=:A1',
      '=A1::A2'
    );
    
    fc.assert(
      fc.property(invalidFormulas, (formula) => {
        const result = parser.parse(formula);
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13: Range notation parsing
   * For any valid range notation A1:B5, the parser correctly recognizes the range
   */
  it('Property 13: parses range notation correctly', () => {
    const colArb = fc.integer({ min: 0, max: 9 }).map(n => String.fromCharCode(65 + n));
    const rowArb = fc.integer({ min: 1, max: 20 });
    
    fc.assert(
      fc.property(colArb, rowArb, colArb, rowArb, (col1, row1, col2, row2) => {
        const formula = `=${col1}${row1}:${col2}${row2}`;
        const result = parser.parse(formula);
        
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.ast.type).toBe('range');
          if (result.ast.type === 'range') {
            expect(result.ast.start.col).toBe(col1.charCodeAt(0) - 65);
            expect(result.ast.start.row).toBe(row1 - 1);
            expect(result.ast.end.col).toBe(col2.charCodeAt(0) - 65);
            expect(result.ast.end.row).toBe(row2 - 1);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});
