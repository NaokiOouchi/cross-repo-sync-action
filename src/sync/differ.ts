import type { RepoFileMapping, FileChange } from '../types'

export const computeFileChanges = (
  mappings: readonly RepoFileMapping[],
  sourceContents: ReadonlyMap<string, string>,
  targetContents: ReadonlyMap<string, string | null>
): readonly FileChange[] => {
  return mappings.map((mapping) => {
    const source = sourceContents.get(mapping.src)
    if (source === undefined) {
      throw new Error(`Source file not found: ${mapping.src}`)
    }

    const target = targetContents.get(mapping.dest)

    if (target === null || target === undefined) {
      return { dest: mapping.dest, content: source, status: 'created' as const }
    }

    if (source === target) {
      return { dest: mapping.dest, content: source, status: 'unchanged' as const }
    }

    return { dest: mapping.dest, content: source, status: 'updated' as const }
  })
}

export const hasChanges = (changes: readonly FileChange[]): boolean => {
  return changes.some((c) => c.status !== 'unchanged')
}
