import { describe, it, expect } from 'vitest'
import * as path from 'path'
import { parseConfigFile, buildRepoSyncPlans } from '../../src/config/parser'
import type { SyncConfig } from '../../src/types'

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
    expect(plans[0].files).toEqual([{ src: 'file.md', dest: 'dest.md' }])
  })
})
