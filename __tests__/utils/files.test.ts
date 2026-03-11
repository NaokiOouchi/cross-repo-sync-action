import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'
import { expandDirectoryMapping, isDirectoryPath } from '../../src/utils/files'

describe('isDirectoryPath', () => {
  it('should return true for paths ending with /', () => {
    expect(isDirectoryPath('configs/')).toBe(true)
    expect(isDirectoryPath('a/b/c/')).toBe(true)
  })

  it('should return false for file paths', () => {
    expect(isDirectoryPath('file.ts')).toBe(false)
    expect(isDirectoryPath('a/b/file.ts')).toBe(false)
  })
})

describe('expandDirectoryMapping', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sync-test-'))
  })

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  it('should return single mapping for non-directory src', async () => {
    const result = await expandDirectoryMapping('file.ts', 'dest/file.ts')
    expect(result).toEqual([{ src: 'file.ts', dest: 'dest/file.ts', delete: undefined }])
  })

  it('should expand directory into individual file mappings', async () => {
    const srcDir = path.join(tmpDir, 'configs') + '/'
    await fs.mkdir(srcDir, { recursive: true })
    await fs.writeFile(path.join(srcDir, 'a.json'), '{}')
    await fs.writeFile(path.join(srcDir, 'b.json'), '{}')

    const result = await expandDirectoryMapping(srcDir, '.github/configs/')

    expect(result).toHaveLength(2)
    expect(result[0].src).toBe(path.join(srcDir, 'a.json'))
    expect(result[0].dest).toBe(path.join('.github/configs/', 'a.json'))
    expect(result[1].src).toBe(path.join(srcDir, 'b.json'))
    expect(result[1].dest).toBe(path.join('.github/configs/', 'b.json'))
  })

  it('should expand nested directories recursively', async () => {
    const srcDir = path.join(tmpDir, 'configs') + '/'
    await fs.mkdir(path.join(srcDir, 'sub'), { recursive: true })
    await fs.writeFile(path.join(srcDir, 'root.json'), '{}')
    await fs.writeFile(path.join(srcDir, 'sub', 'nested.json'), '{}')

    const result = await expandDirectoryMapping(srcDir, 'dest/')

    expect(result).toHaveLength(2)
    const srcPaths = result.map((r) => path.basename(r.src))
    expect(srcPaths).toContain('root.json')
    expect(srcPaths).toContain('nested.json')

    const nestedMapping = result.find((r) => r.src.includes('nested.json'))
    expect(nestedMapping?.dest).toBe(path.join('dest/', 'sub', 'nested.json'))
  })

  it('should pass delete flag through to expanded mappings', async () => {
    const srcDir = path.join(tmpDir, 'configs') + '/'
    await fs.mkdir(srcDir, { recursive: true })
    await fs.writeFile(path.join(srcDir, 'a.json'), '{}')

    const result = await expandDirectoryMapping(srcDir, 'dest/', true)

    expect(result).toHaveLength(1)
    expect(result[0].delete).toBe(true)
  })

  it('should return empty array for empty directory', async () => {
    const srcDir = path.join(tmpDir, 'empty') + '/'
    await fs.mkdir(srcDir, { recursive: true })

    const result = await expandDirectoryMapping(srcDir, 'dest/')

    expect(result).toHaveLength(0)
  })
})
