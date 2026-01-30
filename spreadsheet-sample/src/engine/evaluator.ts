import type { ASTNode, CellValue, EvaluationResult, CellAddress } from './types';
import { isError, createError } from './types';

export interface EvaluationContext {
  getCellValue(address: CellAddress): CellValue;
  getRangeValues(start: CellAddress, end: CellAddress): CellValue[];
}

export class CellEvaluator {
  evaluate(ast: ASTNode, context: EvaluationContext): EvaluationResult {
    try {
      const value = this.evaluateNode(ast, context);
      return { success: true, value };
    } catch (error) {
      return { success: false, error: createError(error instanceof Error ? error.message : 'Evaluation error') };
    }
  }

  private evaluateNode(node: ASTNode, context: EvaluationContext): CellValue {
    switch (node.type) {
      case 'number':
        return node.value;

      case 'cellRef': {
        const value = context.getCellValue(node.cell);
        if (isError(value)) throw value;
        return typeof value === 'string' ? 0 : value;
      }

      case 'binaryOp': {
        const left = this.evaluateNode(node.left, context);
        if (isError(left)) throw left;
        const right = this.evaluateNode(node.right, context);
        if (isError(right)) throw right;

        const l = typeof left === 'string' ? 0 : left;
        const r = typeof right === 'string' ? 0 : right;

        switch (node.op) {
          case '+': return l + r;
          case '-': return l - r;
          case '*': return l * r;
          case '/':
            if (r === 0) throw createError('Division by zero');
            return l / r;
        }
      }

      case 'range':
        throw createError('Range cannot be evaluated directly');

      case 'function': {
        if (node.args.length !== 1 || node.args[0].type !== 'range') {
          throw createError('Function requires a range argument');
        }

        const rangeNode = node.args[0];
        const values = context.getRangeValues(rangeNode.start, rangeNode.end);
        const numbers = values.filter(v => {
          if (isError(v)) throw v;
          return typeof v === 'number';
        }) as number[];

        if (node.name === 'SUM') {
          return numbers.reduce((sum, n) => sum + n, 0);
        } else if (node.name === 'AVG') {
          return numbers.length > 0 ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : 0;
        }

        throw createError(`Unknown function: ${node.name}`);
      }
    }
  }
}
