import { describe, it, expect } from 'vitest'
import { computeFileChanges, computeOrphanedFiles, hasChanges } from '../../src/sync/differ'
import type { RepoFileMapping } from '../../src/types'

describe('computeFileChanges', () => {
  const mappings: RepoFileMapping[] = [
    { src: 'a.md', dest: 'dest/a.md' },
    { src: 'b.md', dest: 'dest/b.md' },
  ]

  it('should detect new files', () => {
    const source = new Map([
      ['a.md', 'content-a'],
      ['b.md', 'content-b'],
    ])
    const target = new Map<string, string | null>([
      ['dest/a.md', null],
      ['dest/b.md', null],
    ])

    const changes = computeFileChanges(mappings, source, target)

    expect(changes).toHaveLength(2)
    expect(changes[0].status).toBe('created')
    expect(changes[1].status).toBe('created')
  })

  it('should detect unchanged files', () => {
    const source = new Map([
      ['a.md', 'same'],
      ['b.md', 'same'],
    ])
    const target = new Map<string, string | null>([
      ['dest/a.md', 'same'],
      ['dest/b.md', 'same'],
    ])

    const changes = computeFileChanges(mappings, source, target)

    expect(changes[0].status).toBe('unchanged')
    expect(changes[1].status).toBe('unchanged')
  })

  it('should detect updated files', () => {
    const source = new Map([
      ['a.md', 'new-content'],
      ['b.md', 'same'],
    ])
    const target = new Map<string, string | null>([
      ['dest/a.md', 'old-content'],
      ['dest/b.md', 'same'],
    ])

    const changes = computeFileChanges(mappings, source, target)

    expect(changes[0].status).toBe('updated')
    expect(changes[0].content).toBe('new-content')
    expect(changes[1].status).toBe('unchanged')
  })

  it('should throw if source file is missing', () => {
    const source = new Map([['a.md', 'content']])
    const target = new Map<string, string | null>([
      ['dest/a.md', null],
      ['dest/b.md', null],
    ])

    expect(() => computeFileChanges(mappings, source, target)).toThrow(
      'Source file not found: b.md'
    )
  })
})

describe('computeOrphanedFiles', () => {
  it('should detect files in target not in source', () => {
    const sourceDests = new Set(['configs/a.json', 'configs/b.json'])
    const targetPaths = ['configs/a.json', 'configs/b.json', 'configs/old.json']
    const directoryDests = ['configs/']

    const orphaned = computeOrphanedFiles(sourceDests, targetPaths, directoryDests)

    expect(orphaned).toHaveLength(1)
    expect(orphaned[0].dest).toBe('configs/old.json')
    expect(orphaned[0].status).toBe('deleted')
    expect(orphaned[0].content).toBe('')
  })

  it('should return empty when no orphaned files', () => {
    const sourceDests = new Set(['configs/a.json'])
    const targetPaths = ['configs/a.json']
    const directoryDests = ['configs/']

    const orphaned = computeOrphanedFiles(sourceDests, targetPaths, directoryDests)

    expect(orphaned).toHaveLength(0)
  })

  it('should not flag files outside synced directories', () => {
    const sourceDests = new Set(['configs/a.json'])
    const targetPaths = ['configs/a.json', 'other/file.json']
    const directoryDests = ['configs/']

    const orphaned = computeOrphanedFiles(sourceDests, targetPaths, directoryDests)

    expect(orphaned).toHaveLength(0)
  })

  it('should handle multiple directory dests', () => {
    const sourceDests = new Set(['dir1/a.json', 'dir2/b.json'])
    const targetPaths = ['dir1/a.json', 'dir1/old.json', 'dir2/b.json', 'dir2/old.json']
    const directoryDests = ['dir1/', 'dir2/']

    const orphaned = computeOrphanedFiles(sourceDests, targetPaths, directoryDests)

    expect(orphaned).toHaveLength(2)
    expect(orphaned.map((o) => o.dest).sort()).toEqual(['dir1/old.json', 'dir2/old.json'])
  })

  it('should handle nested directory paths', () => {
    const sourceDests = new Set(['.github/configs/lint.json'])
    const targetPaths = ['.github/configs/lint.json', '.github/configs/sub/old.json']
    const directoryDests = ['.github/configs/']

    const orphaned = computeOrphanedFiles(sourceDests, targetPaths, directoryDests)

    expect(orphaned).toHaveLength(1)
    expect(orphaned[0].dest).toBe('.github/configs/sub/old.json')
  })
})

describe('hasChanges', () => {
  it('should return true when there are changes', () => {
    const changes = [
      { dest: 'a.md', content: 'x', status: 'created' as const },
      { dest: 'b.md', content: 'y', status: 'unchanged' as const },
    ]
    expect(hasChanges(changes)).toBe(true)
  })

  it('should return true when there are deleted files', () => {
    const changes = [
      { dest: 'a.md', content: '', status: 'deleted' as const },
      { dest: 'b.md', content: 'y', status: 'unchanged' as const },
    ]
    expect(hasChanges(changes)).toBe(true)
  })

  it('should return false when all unchanged', () => {
    const changes = [
      { dest: 'a.md', content: 'x', status: 'unchanged' as const },
      { dest: 'b.md', content: 'y', status: 'unchanged' as const },
    ]
    expect(hasChanges(changes)).toBe(false)
  })

  it('should return false for empty array', () => {
    expect(hasChanges([])).toBe(false)
  })
})
