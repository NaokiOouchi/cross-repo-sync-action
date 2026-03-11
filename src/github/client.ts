import { Octokit } from '@octokit/rest'

export const createGitHubClient = (token: string): Octokit => {
  return new Octokit({ auth: token })
}
