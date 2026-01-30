import { useEffect, useRef } from 'react';

interface CellProps {
  value: string;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onCommit: (value: string) => void;
  onCancel: () => void;
  editingContent: string;
  onEditingContentChange: (value: string) => void;
  col: number;
  row: number;
}

export function Cell({
  value,
  isSelected,
  isEditing,
  onSelect,
  onEdit,
  onCommit,
  onCancel,
  editingContent,
  onEditingContentChange,
  col,
  row,
}: CellProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onCommit(editingContent);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleBlur = () => {
    if (isEditing) {
      onCommit(editingContent);
    }
  };

  const isError = value.startsWith('#');

  return (
    <div
      data-testid={`cell-${col}-${row}`}
      className={`
        w-24 border-r border-b border-gray-300 h-8 flex items-center px-2 text-sm
        ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50 z-10' : 'bg-white'}
        ${isError ? 'text-red-600 font-bold bg-red-50' : ''}
        cursor-cell hover:bg-gray-50 transition-colors
      `}
      onClick={onSelect}
      onDoubleClick={onEdit}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editingContent}
          onChange={(e) => onEditingContentChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-full h-full outline-none bg-transparent"
        />
      ) : (
        <span className="truncate">{value}</span>
      )}
    </div>
  );
}

export default Cell;
