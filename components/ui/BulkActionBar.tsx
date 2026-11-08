import { ReactNode } from 'react'
import { Trash2, X } from 'lucide-react'

interface BulkActionBarProps {
  selectedCount: number
  itemLabel: string
  itemLabelPlural?: string
  onClear: () => void
  onDeleteClick: () => void
  extraActions?: ReactNode
}

export default function BulkActionBar({
  selectedCount,
  itemLabel,
  itemLabelPlural,
  onClear,
  onDeleteClick,
  extraActions,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  const label = selectedCount === 1 ? itemLabel : itemLabelPlural ?? `${itemLabel}s`

  return (
    <div className="adventure-card bg-accent-50 border-accent-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-accent-700 font-medium text-sm">{selectedCount}</span>
          </div>
          <p className="text-accent-700 font-medium">
            {selectedCount} {label} selected
          </p>
        </div>
        <div className="flex items-center gap-2">
          {extraActions}
          <button
            onClick={onDeleteClick}
            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Selected
          </button>
          <button
            onClick={onClear}
            className="p-1.5 text-accent-700 hover:bg-accent-100 rounded-lg transition-colors"
            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
