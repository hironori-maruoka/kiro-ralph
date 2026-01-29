import { ASTNode, ParseResult } from './types';
import { parseAddress } from '../utils/address';

export class FormulaParser {
  private input: string = '';
  private pos: number = 0;

  parse(formula: string): ParseResult {
    if (!formula.startsWith('=')) {
      return { success: false, error: 'Formula must start with =' };
    }

    this.input = formula.slice(1).trim();
    this.pos = 0;

    try {
      const ast = this.parseExpression();
      if (this.pos < this.input.length) {
        return { success: false, error: 'Unexpected characters after expression' };
      }
      return { success: true, ast };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Parse error' };
    }
  }

  private parseExpression(): ASTNode {
    return this.parseAddSub();
  }

  private parseAddSub(): ASTNode {
    let left = this.parseMulDiv();

    while (this.pos < this.input.length) {
      this.skipWhitespace();
      const op = this.input[this.pos];
      if (op !== '+' && op !== '-') break;
      this.pos++;
      const right = this.parseMulDiv();
      left = { type: 'binaryOp', op, left, right };
    }

    return left;
  }

  private parseMulDiv(): ASTNode {
    let left = this.parsePrimary();

    while (this.pos < this.input.length) {
      this.skipWhitespace();
      const op = this.input[this.pos];
      if (op !== '*' && op !== '/') break;
      this.pos++;
      const right = this.parsePrimary();
      left = { type: 'binaryOp', op, left, right };
    }

    return left;
  }

  private parsePrimary(): ASTNode {
    this.skipWhitespace();

    // Number
    if (this.isDigit(this.input[this.pos])) {
      return this.parseNumber();
    }

    // Function or cell reference
    if (this.isAlpha(this.input[this.pos])) {
      const start = this.pos;
      while (this.pos < this.input.length && this.isAlphaNum(this.input[this.pos])) {
        this.pos++;
      }
      const token = this.input.slice(start, this.pos);

      this.skipWhitespace();

      // Function call
      if (this.input[this.pos] === '(') {
        return this.parseFunction(token);
      }

      // Range or cell reference
      if (this.input[this.pos] === ':') {
        this.pos++;
        const endToken = this.parseToken();
        const startAddr = parseAddress(token);
        const endAddr = parseAddress(endToken);
        if (!startAddr || !endAddr) {
          throw new Error('Invalid range');
        }
        return { type: 'range', start: startAddr, end: endAddr };
      }

      // Cell reference
      const addr = parseAddress(token);
      if (!addr) {
        throw new Error(`Invalid cell reference: ${token}`);
      }
      return { type: 'cellRef', cell: addr };
    }

    // Parentheses
    if (this.input[this.pos] === '(') {
      this.pos++;
      const expr = this.parseExpression();
      this.skipWhitespace();
      if (this.input[this.pos] !== ')') {
        throw new Error('Missing closing parenthesis');
      }
      this.pos++;
      return expr;
    }

    throw new Error('Unexpected character');
  }

  private parseNumber(): ASTNode {
    const start = this.pos;
    while (this.pos < this.input.length && (this.isDigit(this.input[this.pos]) || this.input[this.pos] === '.')) {
      this.pos++;
    }
    const value = parseFloat(this.input.slice(start, this.pos));
    if (isNaN(value)) {
      throw new Error('Invalid number');
    }
    return { type: 'number', value };
  }

  private parseFunction(name: string): ASTNode {
    const upperName = name.toUpperCase();
    if (upperName !== 'SUM' && upperName !== 'AVG') {
      throw new Error(`Unknown function: ${name}`);
    }

    this.pos++; // skip '('
    this.skipWhitespace();

    const arg = this.parseRange();

    this.skipWhitespace();
    if (this.input[this.pos] !== ')') {
      throw new Error('Missing closing parenthesis in function');
    }
    this.pos++;

    return { type: 'function', name: upperName as 'SUM' | 'AVG', args: [arg] };
  }

  private parseRange(): ASTNode {
    const startToken = this.parseToken();
    this.skipWhitespace();

    if (this.input[this.pos] === ':') {
      this.pos++;
      this.skipWhitespace();
      const endToken = this.parseToken();
      const startAddr = parseAddress(startToken);
      const endAddr = parseAddress(endToken);
      if (!startAddr || !endAddr) {
        throw new Error('Invalid range');
      }
      return { type: 'range', start: startAddr, end: endAddr };
    }

    const addr = parseAddress(startToken);
    if (!addr) {
      throw new Error(`Invalid cell reference: ${startToken}`);
    }
    return { type: 'cellRef', cell: addr };
  }

  private parseToken(): string {
    const start = this.pos;
    while (this.pos < this.input.length && this.isAlphaNum(this.input[this.pos])) {
      this.pos++;
    }
    return this.input.slice(start, this.pos);
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) {
      this.pos++;
    }
  }

  private isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
  }

  private isAlpha(ch: string): boolean {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
  }

  private isAlphaNum(ch: string): boolean {
    return this.isAlpha(ch) || this.isDigit(ch);
  }
}
