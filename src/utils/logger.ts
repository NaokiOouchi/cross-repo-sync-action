import * as core from '@actions/core'

export const info = (message: string): void => {
  core.info(message)
}

export const warn = (message: string): void => {
  core.warning(message)
}

export const error = (message: string): void => {
  core.error(message)
}

export const debug = (message: string): void => {
  core.debug(message)
}

export const startGroup = (name: string): void => {
  core.startGroup(name)
}

export const endGroup = (): void => {
  core.endGroup()
}
