import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { SpreadsheetEngine } from '../../src/engine/engine';
import { CellAddress } from '../../src/engine/types';
import { formatAddress } from '../../src/utils/address';

/**
 * Feature: spreadsheet-sample
 * Property 6: 任意のセルと入力値に対して、編集モードでEnterキーを押すかセルの外側をクリックすると、入力が保存され、セルの値が更新される
 */
describe('Property 6: Edit commit persistence', () => {
  it('should persist input when committed', () => {
    fc.assert(
      fc.property(
        fc.record({ col: fc.integer({ min: 0, max: 9 }), row: fc.integer({ min: 0, max: 19 }) }),
        fc.oneof(
          fc.integer({ min: -1000, max: 1000 }).map(String),
          fc.string({ minLength: 0, maxLength: 20 }),
          fc.constant('=1+2'),
          fc.constant('=A1+B2')
        ),
        (address, content) => {
          const engine = new SpreadsheetEngine();
          
          // Simulate commit by setting cell content
          engine.setCellContent(address, content);
          
          // Verify the content is persisted
          const rawContent = engine.getCellRawContent(address);
          expect(rawContent).toBe(content);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: spreadsheet-sample
 * Property 18: 任意のセルの値が変更されたとき、エンジンはトポロジカル順序ですべての依存セルを再計算し、正しい最終値を生成する
 */
describe('Property 18: Topological order recalculation', () => {
  it('should recalculate dependent cells in correct order', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (value) => {
          const engine = new SpreadsheetEngine();
          
          // Create chain: A1 = value, B1 = A1 + 1, C1 = B1 + 1
          const a1: CellAddress = { col: 0, row: 0 };
          const b1: CellAddress = { col: 1, row: 0 };
          const c1: CellAddress = { col: 2, row: 0 };
          
          engine.setCellContent(a1, String(value));
          engine.setCellContent(b1, '=A1+1');
          engine.setCellContent(c1, '=B1+1');
          
          // Verify correct calculation
          expect(engine.getCellValue(a1)).toBe(value);
          expect(engine.getCellValue(b1)).toBe(value + 1);
          expect(engine.getCellValue(c1)).toBe(value + 2);
          
          // Change A1 and verify recalculation
          const newValue = value * 2;
          engine.setCellContent(a1, String(newValue));
          
          expect(engine.getCellValue(a1)).toBe(newValue);
          expect(engine.getCellValue(b1)).toBe(newValue + 1);
          expect(engine.getCellValue(c1)).toBe(newValue + 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: spreadsheet-sample
 * Property 25: 任意のエラーが発生しても、システムは他の機能を中断せず、エラー値を表示して継続動作する
 */
describe('Property 25: Error robustness', () => {
  it('should continue operating after errors', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('=1/0'),
          fc.constant('=INVALID'),
          fc.constant('=Z99'),
          fc.constant('=1+')
        ),
        fc.integer({ min: 1, max: 100 }),
        (errorFormula, validValue) => {
          const engine = new SpreadsheetEngine();
          
          const a1: CellAddress = { col: 0, row: 0 };
          const b1: CellAddress = { col: 1, row: 0 };
          
          // Set error in A1
          engine.setCellContent(a1, errorFormula);
          
          // Verify A1 has error
          const a1Value = engine.getCellValue(a1);
          expect(typeof a1Value === 'object' && 'type' in a1Value).toBe(true);
          
          // Set valid value in B1
          engine.setCellContent(b1, String(validValue));
          
          // Verify B1 works correctly despite A1 error
          expect(engine.getCellValue(b1)).toBe(validValue);
        }
      ),
      { numRuns: 100 }
    );
  });
});
