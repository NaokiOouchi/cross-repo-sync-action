import { describe, it, expect } from 'vitest'
import { computeFileChanges, hasChanges } from '../../src/sync/differ'
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

describe('hasChanges', () => {
  it('should return true when there are changes', () => {
    const changes = [
      { dest: 'a.md', content: 'x', status: 'created' as const },
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
