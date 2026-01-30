import { CellAddress } from '../engine/types';
import { formatAddress } from '../utils/address';

interface FormulaBarProps {
  selectedCell: CellAddress | null;
  cellContent: string;
  onContentChange: (newContent: string) => void;
}

export function FormulaBar({ selectedCell, cellContent, onContentChange }: FormulaBarProps) {
  return (
    <div className="flex items-center gap-2 p-2 border-b bg-gray-50">
      <div className="font-mono text-sm font-semibold min-w-[3rem]">
        {selectedCell ? formatAddress(selectedCell) : ''}
      </div>
      <input
        type="text"
        value={cellContent}
        onChange={(e) => onContentChange(e.target.value)}
        className="flex-1 px-2 py-1 border rounded font-mono text-sm"
        placeholder="Enter value or formula"
      />
    </div>
  );
}
