import { useEffect, useRef } from 'react'
import { Trash2, X } from 'lucide-react'

interface BulkDeleteModalProps {
  open: boolean
  count: number
  itemLabel: string
  itemLabelPlural?: string
  warningText?: string
  deleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function BulkDeleteModal({
  open,
  count,
  itemLabel,
  itemLabelPlural,
  warningText,
  deleting,
  onCancel,
  onConfirm,
}: BulkDeleteModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onCancel()
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  const label = count === 1 ? itemLabel : itemLabelPlural ?? `${itemLabel}s`

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" disabled={deleting}>
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-red-900">
                  Delete {count} {label}?
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {warningText ?? 'This action cannot be undone.'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              disabled={deleting}
              className="flex-1 px-4 py-3 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {deleting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete {count}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
