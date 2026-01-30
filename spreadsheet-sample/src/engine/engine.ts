import { CellAddress, CellData, CellValue, createCycleError } from './types';
import { formatAddress } from '../utils/address';
import { FormulaParser } from './parser';
import { CellEvaluator } from './evaluator';
import { DependencyGraph } from './dependency';
import { CycleDetector } from './cycle';

export class SpreadsheetEngine {
  private cells: Map<string, CellData> = new Map();
  private parser = new FormulaParser();
  private evaluator = new CellEvaluator();
  private dependencyGraph = new DependencyGraph();
  private cycleDetector = new CycleDetector();

  setCellContent(address: CellAddress, content: string): void {
    const key = formatAddress(address);
    
    // Remove old dependencies
    this.dependencyGraph.removeDependencies(address);
    
    // Parse and evaluate
    const cellData: CellData = {
      rawContent: content,
      evaluatedValue: content,
      dependencies: [],
    };

    if (content.startsWith('=')) {
      const parseResult = this.parser.parse(content);
      if (parseResult.success) {
        cellData.parsedFormula = parseResult.ast;
        
        // Extract dependencies
        const deps = this.extractDependencies(parseResult.ast);
        cellData.dependencies = deps;
        
        // Add to dependency graph
        for (const dep of deps) {
          this.dependencyGraph.addDependency(address, dep);
        }
        
        // Evaluate
        const evalResult = this.evaluator.evaluate(parseResult.ast, {
          getCellValue: (addr) => this.getCellValue(addr),
          getRangeValues: (start, end) => this.getRangeValues(start, end),
        });
        
        cellData.evaluatedValue = evalResult.success ? evalResult.value : evalResult.error;
      } else {
        cellData.evaluatedValue = { type: 'ERR', message: parseResult.error };
      }
    }

    this.cells.set(key, cellData);
    this.recalculate(address);
  }

  getCellValue(address: CellAddress): CellValue {
    const key = formatAddress(address);
    const cell = this.cells.get(key);
    if (!cell) return 0;
    
    const value = cell.evaluatedValue;
    if (value === '') return 0;
    if (typeof value === 'string') {
      const num = Number(value);
      return isNaN(num) ? value : num;
    }
    return value;
  }

  getCellDisplayValue(address: CellAddress): string {
    const key = formatAddress(address);
    const cell = this.cells.get(key);
    
    // If no cell data, return empty string
    if (!cell) return '';
    
    // If it's a formula, show the evaluated value
    if (cell.rawContent.startsWith('=')) {
      const value = cell.evaluatedValue;
      if (typeof value === 'object' && 'type' in value) {
        return `#${value.type}`;
      }
      return String(value);
    }
    
    // For non-formulas, show the raw content
    return cell.rawContent;
  }

  getCellRawContent(address: CellAddress): string {
    const key = formatAddress(address);
    const cell = this.cells.get(key);
    return cell ? cell.rawContent : '';
  }

  recalculate(changedCell: CellAddress): void {
    // Check for cycles
    const cycle = this.cycleDetector.detectCycle(this.dependencyGraph, changedCell);
    
    if (cycle) {
      // Set cycle error for all cells in cycle
      const cycleError = createCycleError('Circular reference detected');
      for (const cellAddr of cycle) {
        const key = formatAddress(cellAddr);
        const cell = this.cells.get(key);
        if (cell) {
          cell.evaluatedValue = cycleError;
        }
      }
      return;
    }
    
    // Get all dependents (transitively)
    const allDependents = this.getAllDependents(changedCell);
    
    // Get topological order
    const order = this.dependencyGraph.getTopologicalOrder(allDependents);
    if (!order) return; // Cycle detected in dependents
    
    // Reverse the order so dependencies are calculated before dependents
    order.reverse();
    
    // Recalculate in topological order
    for (const cellAddr of order) {
      const key = formatAddress(cellAddr);
      const cell = this.cells.get(key);
      
      if (cell && cell.parsedFormula) {
        const evalResult = this.evaluator.evaluate(cell.parsedFormula, {
          getCellValue: (addr) => this.getCellValue(addr),
          getRangeValues: (start, end) => this.getRangeValues(start, end),
        });
        
        cell.evaluatedValue = evalResult.success ? evalResult.value : evalResult.error;
      }
    }
  }

  private getAllDependents(cell: CellAddress): CellAddress[] {
    const visited = new Set<string>();
    const result: CellAddress[] = [];
    
    const visit = (addr: CellAddress) => {
      const dependents = this.dependencyGraph.getDependents(addr);
      for (const dep of dependents) {
        const key = formatAddress(dep);
        if (!visited.has(key)) {
          visited.add(key);
          result.push(dep);
          visit(dep);
        }
      }
    };
    
    visit(cell);
    return result;
  }

  private extractDependencies(ast: any): CellAddress[] {
    const deps: CellAddress[] = [];
    
    const visit = (node: any) => {
      if (node.type === 'cellRef') {
        deps.push(node.cell);
      } else if (node.type === 'range') {
        // Add all cells in range
        for (let row = node.start.row; row <= node.end.row; row++) {
          for (let col = node.start.col; col <= node.end.col; col++) {
            deps.push({ col, row });
          }
        }
      } else if (node.type === 'binaryOp') {
        visit(node.left);
        visit(node.right);
      } else if (node.type === 'function') {
        for (const arg of node.args) {
          visit(arg);
        }
      }
    };
    
    visit(ast);
    return deps;
  }

  private getRangeValues(start: CellAddress, end: CellAddress): CellValue[] {
    const values: CellValue[] = [];
    for (let row = start.row; row <= end.row; row++) {
      for (let col = start.col; col <= end.col; col++) {
        values.push(this.getCellValue({ col, row }));
      }
    }
    return values;
  }
}
