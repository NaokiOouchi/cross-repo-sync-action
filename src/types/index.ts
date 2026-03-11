export interface FileMapping {
  readonly src: string
  readonly dest: string
  readonly repos: readonly string[]
  readonly delete?: boolean
}

export interface SyncConfig {
  readonly sync: readonly FileMapping[]
}

export interface RepoFileMapping {
  readonly src: string
  readonly dest: string
  readonly delete?: boolean
}

export interface RepoSyncPlan {
  readonly repoFullName: string
  readonly owner: string
  readonly repo: string
  readonly files: readonly RepoFileMapping[]
}

export type FileChangeStatus = 'created' | 'updated' | 'unchanged' | 'deleted'

export interface FileChange {
  readonly dest: string
  readonly content: string
  readonly status: FileChangeStatus
}

export interface PullRequestInfo {
  readonly number: number
  readonly url: string
  readonly title: string
}

export type SyncResultStatus = 'success' | 'skipped' | 'error'

export interface SyncResult {
  readonly repoFullName: string
  readonly status: SyncResultStatus
  readonly pr?: PullRequestInfo
  readonly changes: readonly FileChange[]
  readonly error?: string
}
