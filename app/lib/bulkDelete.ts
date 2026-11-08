export interface BulkDeleteResult {
  succeededIds: string[]
  failedIds: string[]
}

/**
 * Runs deleteFn over every id concurrently via Promise.allSettled — a single
 * failure (e.g. an item already deleted from another tab) doesn't abort the
 * rest of the batch, and callers can tell exactly which ids actually went
 * through to keep local state in sync.
 */
export async function runBulkDelete(
  ids: string[],
  deleteFn: (id: string) => Promise<void>
): Promise<BulkDeleteResult> {
  const results = await Promise.allSettled(ids.map((id) => deleteFn(id)))

  const succeededIds: string[] = []
  const failedIds: string[] = []
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') succeededIds.push(ids[i])
    else failedIds.push(ids[i])
  })

  return { succeededIds, failedIds }
}
