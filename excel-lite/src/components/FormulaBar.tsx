import { CellAddress } from '../engine/types';
import { formatAddress } from '../utils/address';

interface FormulaBarProps {
  selectedCell: CellAddress | null;
  cellContent: string;
  onContentChange: (newContent: string) => void;
}

export function FormulaBar({ selectedCell, cellContent, onContentChange }: FormulaBarProps) {
  return (
    <div className="flex items-center gap-2 mb-4 p-2 bg-white border border-gray-300 rounded shadow-sm">
      <div className="font-mono font-bold text-gray-700 w-16 text-center">
        {selectedCell ? formatAddress(selectedCell) : ''}
      </div>
      <input
        data-testid="formula-bar-input"
        type="text"
        value={cellContent}
        onChange={(e) => onContentChange(e.target.value)}
        className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        placeholder="Enter value or formula (e.g., =A1+B2)"
      />
    </div>
  );
}
