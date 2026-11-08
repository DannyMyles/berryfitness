import { useEffect, useState } from 'react'

export function useBulkSelection<T>(items: T[], getId: (item: T) => string) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Prune selection when the underlying list changes (filter/search/refresh)
  // so stale ids from a previous view never linger.
  useEffect(() => {
    const validIds = new Set(items.map(getId))
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => validIds.has(id)))
      return next.size === prev.size ? prev : next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const isSelected = (id: string) => selectedIds.has(id)

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    const ids = items.map(getId)
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.has(id))
    setSelectedIds(allSelected ? new Set() : new Set(ids))
  }

  const clear = () => setSelectedIds(new Set())

  const isAllSelected = items.length > 0 && items.every((item) => selectedIds.has(getId(item)))

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isSelected,
    isAllSelected,
    toggle,
    toggleAll,
    clear,
  }
}
