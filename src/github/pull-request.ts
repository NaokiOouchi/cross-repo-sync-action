import type { Octokit } from '@octokit/rest'
import type { PullRequestInfo } from '../types'
import { PR_LABEL } from '../utils/constants'

export const findExistingPR = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  headBranch: string
): Promise<PullRequestInfo | null> => {
  const { data } = await octokit.pulls.list({
    owner,
    repo,
    head: `${owner}:${headBranch}`,
    state: 'open',
    per_page: 1,
  })

  if (data.length === 0) {
    return null
  }

  const pr = data[0]
  return {
    number: pr.number,
    url: pr.html_url,
    title: pr.title,
  }
}

export const createPR = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  title: string,
  body: string,
  head: string,
  base: string
): Promise<PullRequestInfo> => {
  const { data } = await octokit.pulls.create({
    owner,
    repo,
    title,
    body,
    head,
    base,
  })

  await addLabels(octokit, owner, repo, data.number, [PR_LABEL])

  return {
    number: data.number,
    url: data.html_url,
    title: data.title,
  }
}

export const updatePR = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  title: string,
  body: string
): Promise<PullRequestInfo> => {
  const { data } = await octokit.pulls.update({
    owner,
    repo,
    pull_number: prNumber,
    title,
    body,
  })

  return {
    number: data.number,
    url: data.html_url,
    title: data.title,
  }
}

const addLabels = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  labels: readonly string[]
): Promise<void> => {
  try {
    await octokit.issues.addLabels({
      owner,
      repo,
      issue_number: prNumber,
      labels: [...labels],
    })
  } catch {
    // Label might not exist or no permission - non-critical
  }
}
