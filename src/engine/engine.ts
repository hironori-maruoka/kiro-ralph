import { CellAddress, CellData, CellValue } from './types';
import { formatAddress } from '../utils/address';

export class SpreadsheetEngine {
  private cells: Map<string, CellData> = new Map();

  setCellContent(address: CellAddress, content: string): void {
    const key = formatAddress(address);
    this.cells.set(key, {
      rawContent: content,
      evaluatedValue: content,
      dependencies: [],
    });
  }

  getCellValue(address: CellAddress): CellValue {
    const key = formatAddress(address);
    const cell = this.cells.get(key);
    return cell?.evaluatedValue ?? '';
  }

  getCellDisplayValue(address: CellAddress): string {
    const value = this.getCellValue(address);
    if (typeof value === 'object' && 'type' in value) {
      return `#${value.type}`;
    }
    return String(value);
  }

  recalculate(changedCell: CellAddress): void {
    // TODO: Implement recalculation logic
  }
}
