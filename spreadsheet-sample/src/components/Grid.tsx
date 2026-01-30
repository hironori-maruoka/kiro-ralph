import { Cell } from './Cell';
import { FormulaBar } from './FormulaBar';
import { useSpreadsheet } from '../hooks/useSpreadsheet';

interface GridProps {
  rows: number;
  cols: number;
}

export function Grid({ rows, cols }: GridProps) {
  const {
    selectedCell,
    editingCell,
    editingContent,
    selectCell,
    startEditing,
    commitEdit,
    cancelEdit,
    setEditingContent,
    handleKeyDown,
    getCellDisplayValue,
    getCellRawContent
  } = useSpreadsheet(rows, cols);

  const colLabels = Array.from({ length: cols }, (_, i) => String.fromCharCode(65 + i));
  const rowLabels = Array.from({ length: rows }, (_, i) => i + 1);

  const handleFormulaBarChange = (newContent: string) => {
    if (selectedCell) {
      setEditingContent(newContent);
      commitEdit(newContent);
    }
  };

  return (
    <div className="focus:outline-none" onKeyDown={handleKeyDown} tabIndex={0}>
      <FormulaBar
        selectedCell={selectedCell}
        cellContent={selectedCell ? getCellRawContent(selectedCell) : ''}
        onContentChange={handleFormulaBarChange}
      />
      <div className="inline-block border-2 border-gray-400 shadow-lg rounded-sm overflow-hidden">
        {/* Header row */}
        <div className="flex">
          <div className="w-12 h-8 border-b-2 border-r-2 border-gray-400 bg-gray-200" />
          {colLabels.map((label) => (
            <div key={label} className="w-24 h-8 border-b-2 border-r border-gray-400 bg-gray-200 flex items-center justify-center font-bold text-gray-700">
              {label}
            </div>
          ))}
        </div>
        
        {/* Data rows */}
        {rowLabels.map((rowLabel, rowIdx) => (
          <div key={rowLabel} className="flex">
            <div className="w-12 h-8 border-b border-r-2 border-gray-400 bg-gray-200 flex items-center justify-center font-bold text-gray-700">
              {rowLabel}
            </div>
            {colLabels.map((_, colIdx) => {
              const address = { col: colIdx, row: rowIdx };
              const isSelected = selectedCell?.col === colIdx && selectedCell?.row === rowIdx;
              const isEditing = editingCell?.col === colIdx && editingCell?.row === rowIdx;
              
              return (
                <Cell
                  key={`${colIdx}-${rowIdx}`}
                  value={getCellDisplayValue(address)}
                  isSelected={isSelected}
                  isEditing={isEditing}
                  editingContent={editingContent}
                  onSelect={() => selectCell(address)}
                  onEdit={() => startEditing(address)}
                  onCommit={commitEdit}
                  onCancel={cancelEdit}
                  onEditingContentChange={setEditingContent}
                  col={colIdx}
                  row={rowIdx}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Grid;
