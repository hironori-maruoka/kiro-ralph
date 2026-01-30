// Cell address in the grid (0-indexed)
export interface CellAddress {
  col: number; // 0-9 (A-J)
  row: number; // 0-19 (1-20)
}

// Cell error types
export type CellError =
  | { type: 'ERR'; message: string }
  | { type: 'CYC'; message: string };

// Cell value can be number, string, or error
export type CellValue = number | string | CellError;

// AST node types for formula parsing
export type ASTNode =
  | { type: 'number'; value: number }
  | { type: 'cellRef'; cell: CellAddress }
  | { type: 'range'; start: CellAddress; end: CellAddress }
  | { type: 'binaryOp'; op: '+' | '-' | '*' | '/'; left: ASTNode; right: ASTNode }
  | { type: 'function'; name: 'SUM' | 'AVG'; args: ASTNode[] };

// Cell data stored in the engine
export interface CellData {
  rawContent: string;
  parsedFormula?: ASTNode;
  evaluatedValue: CellValue;
  dependencies: CellAddress[];
}

// Parse result from formula parser
export type ParseResult =
  | { success: true; ast: ASTNode }
  | { success: false; error: string };

// Evaluation result from cell evaluator
export type EvaluationResult =
  | { success: true; value: CellValue }
  | { success: false; error: CellError };

// Helper to check if a value is an error
export function isError(value: CellValue): value is CellError {
  return typeof value === 'object' && 'type' in value && (value.type === 'ERR' || value.type === 'CYC');
}

// Helper to create error values
export function createError(message: string): CellError {
  return { type: 'ERR', message };
}

export function createCycleError(message: string): CellError {
  return { type: 'CYC', message };
}
