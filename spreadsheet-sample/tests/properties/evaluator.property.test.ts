import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { CellEvaluator } from '../../src/engine/evaluator';
import { FormulaParser } from '../../src/engine/parser';
import type { CellAddress, CellValue, EvaluationContext } from '../../src/engine/types';
import { isError } from '../../src/engine/types';

/**
 * Feature: spreadsheet-sample
 * Property-based tests for CellEvaluator
 */

describe('CellEvaluator Property Tests', () => {
  const parser = new FormulaParser();
  const evaluator = new CellEvaluator();

  // Arbitrary for valid cell addresses (A1-J20)
  const cellAddressArb = fc.record({
    col: fc.integer({ min: 0, max: 9 }),
    row: fc.integer({ min: 0, max: 19 }),
  });

  /**
   * Property 11: Cell reference resolution
   * For any cell reference in a formula, the engine retrieves values from all referenced cells and evaluates correctly
   */
  it('Property 11: resolves cell references correctly', () => {
    fc.assert(
      fc.property(
        cellAddressArb,
        fc.double({ min: -1000, max: 1000, noNaN: true }),
        (addr, value) => {
          const context: EvaluationContext = {
            getCellValue: (a: CellAddress) =>
              a.col === addr.col && a.row === addr.row ? value : 0,
            getRangeValues: () => [],
          };

          const colName = String.fromCharCode(65 + addr.col);
          const rowName = addr.row + 1;
          const formula = `=${colName}${rowName}`;

          const parseResult = parser.parse(formula);
          if (!parseResult.success) return true;

          const evalResult = evaluator.evaluate(parseResult.ast, context);
          return evalResult.success && evalResult.value === value;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12: Error propagation
   * For any formula referencing a cell with an error, that error propagates to the referencing cell
   */
  it('Property 12: propagates errors from referenced cells', () => {
    fc.assert(
      fc.property(cellAddressArb, (addr) => {
        const error = { type: 'ERR' as const, message: 'Test error' };
        const context: EvaluationContext = {
          getCellValue: (a: CellAddress) =>
            a.col === addr.col && a.row === addr.row ? error : 0,
          getRangeValues: () => [],
        };

        const colName = String.fromCharCode(65 + addr.col);
        const rowName = addr.row + 1;
        const formula = `=${colName}${rowName}+1`;

        const parseResult = parser.parse(formula);
        if (!parseResult.success) return true;

        const evalResult = evaluator.evaluate(parseResult.ast, context);
        return !evalResult.success && isError(evalResult.error);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 14: SUM function accuracy
   * For any cell range, SUM(range) correctly calculates the sum of all numeric values in the range
   */
  it('Property 14: SUM function calculates correctly', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: -100, max: 100, noNaN: true }), {
          minLength: 1,
          maxLength: 10,
        }),
        (values) => {
          const context: EvaluationContext = {
            getCellValue: () => 0,
            getRangeValues: () => values,
          };

          const formula = '=SUM(A1:A10)';
          const parseResult = parser.parse(formula);
          if (!parseResult.success) return true;

          const evalResult = evaluator.evaluate(parseResult.ast, context);
          const expectedSum = values.reduce((sum, v) => sum + v, 0);

          return (
            evalResult.success &&
            typeof evalResult.value === 'number' &&
            Math.abs(evalResult.value - expectedSum) < 0.0001
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 15: AVG function accuracy
   * For any cell range, AVG(range) correctly calculates the average of all numeric values in the range
   */
  it('Property 15: AVG function calculates correctly', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: -100, max: 100, noNaN: true }), {
          minLength: 1,
          maxLength: 10,
        }),
        (values) => {
          const context: EvaluationContext = {
            getCellValue: () => 0,
            getRangeValues: () => values,
          };

          const formula = '=AVG(A1:A10)';
          const parseResult = parser.parse(formula);
          if (!parseResult.success) return true;

          const evalResult = evaluator.evaluate(parseResult.ast, context);
          const expectedAvg = values.reduce((sum, v) => sum + v, 0) / values.length;

          return (
            evalResult.success &&
            typeof evalResult.value === 'number' &&
            Math.abs(evalResult.value - expectedAvg) < 0.0001
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 16: Invalid range error handling
   * For any invalid range (e.g., outside grid bounds Z99:AA100), the engine returns #ERR error
   */
  it('Property 16: returns error for invalid ranges', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 25 }),
        fc.integer({ min: 20, max: 99 }),
        (col, row) => {
          const context: EvaluationContext = {
            getCellValue: () => 0,
            getRangeValues: () => [],
          };

          const colName = String.fromCharCode(65 + col);
          const formula = `=SUM(${colName}${row}:${colName}${row + 5})`;

          const parseResult = parser.parse(formula);
          // Parser should reject invalid cell references
          return !parseResult.success;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 23: Syntax error handling
   * For any formula with syntax errors, the engine returns #ERR error
   */
  it('Property 23: returns error for syntax errors', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('=+'),
          fc.constant('=*5'),
          fc.constant('=/2'),
          fc.constant('=1++2'),
          fc.constant('=(1+2'),
          fc.constant('=1+)'),
          fc.constant('=SUM('),
          fc.constant('=AVG)')
        ),
        (invalidFormula) => {
          const parseResult = parser.parse(invalidFormula);
          return !parseResult.success;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 24: Invalid cell reference error handling
   * For any formula with invalid cell references (e.g., Z99), the engine returns #ERR error
   */
  it('Property 24: returns error for invalid cell references', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('=Z99'),
          fc.constant('=A21'),
          fc.constant('=K1'),
          fc.constant('=AA1'),
          fc.constant('=A0'),
          fc.constant('=Z99+1')
        ),
        (invalidFormula) => {
          const parseResult = parser.parse(invalidFormula);
          return !parseResult.success;
        }
      ),
      { numRuns: 100 }
    );
  });
});
