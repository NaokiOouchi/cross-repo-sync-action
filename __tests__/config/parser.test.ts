import { describe, it, expect } from 'vitest'
import * as path from 'path'
import { parseConfigFile, buildRepoSyncPlans, expandDirectoryMappings, getDirectoryDestPaths } from '../../src/config/parser'
import type { SyncConfig, RepoFileMapping } from '../../src/types'
import * as fs from 'fs/promises'
import * as os from 'os'

const fixturesDir = path.join(__dirname, '..', 'fixtures')

describe('parseConfigFile', () => {
  it('should parse a valid config file', async () => {
    const config = await parseConfigFile(path.join(fixturesDir, 'valid-config.yml'))

    expect(config.sync).toHaveLength(2)
    expect(config.sync[0].src).toBe('rules/coding-style.md')
    expect(config.sync[0].dest).toBe('.github/copilot-instructions.md')
    expect(config.sync[0].repos).toEqual(['org/repo-a', 'org/repo-b'])
  })

  it('should throw on invalid config', async () => {
    await expect(
      parseConfigFile(path.join(fixturesDir, 'invalid-config.yml'))
    ).rejects.toThrow()
  })

  it('should throw on empty sync array', async () => {
    await expect(
      parseConfigFile(path.join(fixturesDir, 'empty-config.yml'))
    ).rejects.toThrow()
  })

  it('should throw on non-existent file', async () => {
    await expect(
      parseConfigFile(path.join(fixturesDir, 'does-not-exist.yml'))
    ).rejects.toThrow()
  })
})

describe('buildRepoSyncPlans', () => {
  it('should group files by repository', () => {
    const config: SyncConfig = {
      sync: [
        {
          src: 'rules/coding-style.md',
          dest: '.github/copilot-instructions.md',
          repos: ['org/repo-a', 'org/repo-b'],
        },
        {
          src: 'rules/security.md',
          dest: '.cursor/rules/security.md',
          repos: ['org/repo-a'],
        },
      ],
    }

    const plans = buildRepoSyncPlans(config)

    expect(plans).toHaveLength(2)

    const repoA = plans.find((p) => p.repoFullName === 'org/repo-a')
    expect(repoA).toBeDefined()
    expect(repoA!.owner).toBe('org')
    expect(repoA!.repo).toBe('repo-a')
    expect(repoA!.files).toHaveLength(2)

    const repoB = plans.find((p) => p.repoFullName === 'org/repo-b')
    expect(repoB).toBeDefined()
    expect(repoB!.files).toHaveLength(1)
  })

  it('should handle single mapping', () => {
    const config: SyncConfig = {
      sync: [
        {
          src: 'file.md',
          dest: 'dest.md',
          repos: ['org/repo'],
        },
      ],
    }

    const plans = buildRepoSyncPlans(config)

    expect(plans).toHaveLength(1)
    expect(plans[0].repoFullName).toBe('org/repo')
    expect(plans[0].files).toEqual([{ src: 'file.md', dest: 'dest.md', delete: undefined }])
  })

  it('should pass delete flag through to file mappings', () => {
    const config: SyncConfig = {
      sync: [
        {
          src: 'configs/',
          dest: '.github/configs/',
          repos: ['org/repo-a'],
          delete: true,
        },
      ],
    }

    const plans = buildRepoSyncPlans(config)

    expect(plans[0].files[0].delete).toBe(true)
  })
})

describe('expandDirectoryMappings', () => {
  let tmpDir: string

  const setup = async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'parser-test-'))
  }

  const teardown = async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }

  it('should pass through non-directory mappings unchanged', async () => {
    const files: RepoFileMapping[] = [
      { src: 'file.md', dest: 'dest.md' },
    ]

    const result = await expandDirectoryMappings(files)

    expect(result).toHaveLength(1)
    expect(result[0].src).toBe('file.md')
    expect(result[0].dest).toBe('dest.md')
  })

  it('should expand directory mappings into file mappings', async () => {
    await setup()
    try {
      const srcDir = path.join(tmpDir, 'configs') + '/'
      await fs.mkdir(srcDir, { recursive: true })
      await fs.writeFile(path.join(srcDir, 'a.json'), '{}')
      await fs.writeFile(path.join(srcDir, 'b.json'), '{}')

      const files: RepoFileMapping[] = [
        { src: srcDir, dest: '.github/configs/' },
      ]

      const result = await expandDirectoryMappings(files)

      expect(result).toHaveLength(2)
    } finally {
      await teardown()
    }
  })
})

describe('getDirectoryDestPaths', () => {
  it('should return dest paths for directory sources', () => {
    const files: RepoFileMapping[] = [
      { src: 'configs/', dest: '.github/configs/' },
      { src: 'file.md', dest: 'dest.md' },
      { src: 'other/', dest: '.other/' },
    ]

    const result = getDirectoryDestPaths(files)

    expect(result).toEqual(['.github/configs/', '.other/'])
  })

  it('should return empty array when no directories', () => {
    const files: RepoFileMapping[] = [
      { src: 'file.md', dest: 'dest.md' },
    ]

    const result = getDirectoryDestPaths(files)

    expect(result).toEqual([])
  })
})
