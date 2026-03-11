import * as fs from 'fs/promises'
import * as yaml from 'js-yaml'
import { syncConfigSchema } from './schema'
import type { SyncConfig, RepoSyncPlan } from '../types'

export const parseConfigFile = async (
  filePath: string
): Promise<SyncConfig> => {
  const content = await fs.readFile(filePath, 'utf-8')
  const raw = yaml.load(content)
  return syncConfigSchema.parse(raw)
}

export const buildRepoSyncPlans = (config: SyncConfig): readonly RepoSyncPlan[] => {
  const repoMap = new Map<string, { src: string; dest: string }[]>()

  for (const mapping of config.sync) {
    for (const repoFullName of mapping.repos) {
      const existing = repoMap.get(repoFullName) ?? []
      repoMap.set(repoFullName, [
        ...existing,
        { src: mapping.src, dest: mapping.dest },
      ])
    }
  }

  return Array.from(repoMap.entries()).map(([repoFullName, files]) => {
    const [owner, repo] = repoFullName.split('/')
    return { repoFullName, owner, repo, files }
  })
}
